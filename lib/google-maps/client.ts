import "server-only";
import { getGoogleMapsConfig } from "@/lib/google-maps/config";

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const DETAILS_BASE_URL = "https://places.googleapis.com/v1/places/";
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 256 * 1024;
const RIYADH_CENTER = { latitude: 24.7136, longitude: 46.6753 };
const RIYADH_BOUNDS = {
  latitude: { min: 24.2, max: 25.2 },
  longitude: { min: 46.2, max: 47.2 },
};

export type GoogleMapsErrorCode =
  | "TIMEOUT"
  | "NETWORK"
  | "UPSTREAM_STATUS"
  | "INVALID_RESPONSE"
  | "NO_RESULTS";

export class GoogleMapsApiError extends Error {
  constructor(
    public readonly code: GoogleMapsErrorCode,
    public readonly upstreamStatus?: number,
  ) {
    super(`Google Maps request failed: ${code}`);
    this.name = "GoogleMapsApiError";
  }
}

export type LocationVerificationStatus = "VERIFIED" | "NEEDS_REVIEW";

export type GoogleLocationVerification = {
  status: LocationVerificationStatus;
  placeId: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  googleMapsUrl: string;
  reviewReason: "OUTSIDE_RIYADH" | "PARTIAL_ADDRESS" | "RIYADH_NOT_CONFIRMED" | null;
};

export type GoogleMapsProbeResult = {
  ok: true;
  service: "google-maps";
  operation: "places-search-details";
  upstreamStatus: { search: number; details: number };
  latencyMs: number;
  checkedAt: string;
  verification: { status: LocationVerificationStatus; withinRiyadh: boolean };
};

type SearchPayload = { places?: Array<{ id?: unknown }> };
type DetailsPayload = {
  id?: unknown;
  location?: { latitude?: unknown; longitude?: unknown };
  formattedAddress?: unknown;
};

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function containsRiyadh(value: string): boolean {
  return /(?:الرياض|riyadh)/i.test(value);
}

export function isWithinRiyadh(latitude: number, longitude: number): boolean {
  return (
    latitude >= RIYADH_BOUNDS.latitude.min &&
    latitude <= RIYADH_BOUNDS.latitude.max &&
    longitude >= RIYADH_BOUNDS.longitude.min &&
    longitude <= RIYADH_BOUNDS.longitude.max
  );
}

/**
 * Removes common customer identifiers before any value can reach Google.
 * Building numbers and Saudi short-address codes remain because they are
 * operational address data required to locate the delivery point.
 */
export function sanitizeOperationalAddress(input: string): string {
  if (typeof input !== "string" || input.length > 500) return "";

  const sanitized = input
    .normalize("NFKC")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, " ")
    .replace(/(?:\+?966|00966|0)?5\d{8}/g, " ")
    .replace(/\b\d{10,}\b/g, " ")
    .replace(
      /(?:tracking|barcode|shipment|reference|رقم\s*الشحنة|الباركود|المرجع)\s*[:：-]?\s*[A-Z0-9._-]{5,}/gi,
      " ",
    )
    .replace(/(?:customer|client|recipient|العميل|المستلم|اسم\s*العميل)\s*[:：-]\s*[^,،;\n]+/gi, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[,،;\s-]+|[,،;\s-]+$/g, "")
    .trim();

  if (sanitized.length < 4) return "";
  return containsRiyadh(sanitized)
    ? sanitized
    : `${sanitized}، الرياض، المملكة العربية السعودية`;
}

function isOperationallySpecific(address: string): boolean {
  const withoutCity = address
    .replace(/(?:الرياض|riyadh|المملكة العربية السعودية|saudi arabia)/gi, " ")
    .replace(/[،,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const hasShortAddress = /\b[A-Z]{4}\s?\d{4}\b/i.test(withoutCity);
  const hasBuildingNumber = /(?:^|\D)\d{3,5}(?:\D|$)/.test(withoutCity);
  const hasStreet = /(?:شارع|طريق|street|road|st\.?\b|rd\.?\b)/i.test(withoutCity);
  return hasShortAddress || hasBuildingNumber || (hasStreet && withoutCity.length >= 12);
}

async function readBoundedJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (contentType && !/\bapplication\/(?:[a-z0-9.+-]*\+)?json\b/i.test(contentType)) {
    throw new GoogleMapsApiError("INVALID_RESPONSE", response.status);
  }

  const advertisedLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(advertisedLength) && advertisedLength > MAX_RESPONSE_BYTES) {
    throw new GoogleMapsApiError("INVALID_RESPONSE", response.status);
  }

  if (!response.body) return response.json();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new GoogleMapsApiError("INVALID_RESPONSE", response.status);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new GoogleMapsApiError("INVALID_RESPONSE", response.status);
  }
}

async function googleFetch(
  url: string,
  fieldMask: string,
  init: RequestInit = {},
): Promise<{ payload: unknown; status: number }> {
  const { apiKey } = getGoogleMapsConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers: {
          Accept: "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": fieldMask,
          ...init.headers,
        },
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        signal: controller.signal,
      });
    } catch (error) {
      throw new GoogleMapsApiError(isAbortError(error) ? "TIMEOUT" : "NETWORK");
    }

    if (!response.ok) throw new GoogleMapsApiError("UPSTREAM_STATUS", response.status);
    return { payload: await readBoundedJson(response), status: response.status };
  } finally {
    clearTimeout(timeout);
  }
}

async function searchPlace(address: string): Promise<{ placeId: string; status: number }> {
  const response = await googleFetch(SEARCH_URL, "places.id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      textQuery: address,
      languageCode: "ar",
      locationBias: {
        circle: { center: RIYADH_CENTER, radius: 50_000 },
      },
    }),
  });
  const payload = response.payload as SearchPayload;
  const placeId = payload.places?.[0]?.id;
  if (typeof placeId !== "string" || !placeId.trim()) {
    throw new GoogleMapsApiError("NO_RESULTS", response.status);
  }
  return { placeId: placeId.trim(), status: response.status };
}

async function readPlaceDetails(
  placeId: string,
): Promise<{ payload: DetailsPayload; status: number }> {
  const url = `${DETAILS_BASE_URL}${encodeURIComponent(placeId)}?languageCode=ar`;
  const response = await googleFetch(url, "id,location,formattedAddress");
  return { payload: response.payload as DetailsPayload, status: response.status };
}

function parseVerification(address: string, details: DetailsPayload): GoogleLocationVerification {
  const placeId = details.id;
  const latitude = details.location?.latitude;
  const longitude = details.location?.longitude;
  const formattedAddress = details.formattedAddress;

  if (
    typeof placeId !== "string" ||
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    typeof formattedAddress !== "string" ||
    !formattedAddress.trim()
  ) {
    throw new GoogleMapsApiError("INVALID_RESPONSE");
  }

  const withinRiyadh = isWithinRiyadh(latitude, longitude);
  const riyadhConfirmed = containsRiyadh(formattedAddress);
  const specific = isOperationallySpecific(address);
  const reviewReason = !withinRiyadh
    ? "OUTSIDE_RIYADH"
    : !riyadhConfirmed
      ? "RIYADH_NOT_CONFIRMED"
      : !specific
        ? "PARTIAL_ADDRESS"
        : null;

  return {
    status: reviewReason ? "NEEDS_REVIEW" : "VERIFIED",
    placeId,
    latitude,
    longitude,
    formattedAddress: formattedAddress.trim(),
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    reviewReason,
  };
}

export async function verifyOperationalAddress(
  rawAddress: string,
): Promise<GoogleLocationVerification> {
  const address = sanitizeOperationalAddress(rawAddress);
  if (!address) throw new GoogleMapsApiError("INVALID_RESPONSE");
  const search = await searchPlace(address);
  const details = await readPlaceDetails(search.placeId);
  return parseVerification(address, details.payload);
}

export async function probeGoogleMaps(): Promise<GoogleMapsProbeResult> {
  const startedAt = Date.now();
  const safeProbeAddress = "RAJB2706، الرياض، المملكة العربية السعودية";
  const search = await searchPlace(safeProbeAddress);
  const details = await readPlaceDetails(search.placeId);
  const verification = parseVerification(safeProbeAddress, details.payload);

  return {
    ok: true,
    service: "google-maps",
    operation: "places-search-details",
    upstreamStatus: { search: search.status, details: details.status },
    latencyMs: Date.now() - startedAt,
    checkedAt: new Date().toISOString(),
    verification: {
      status: verification.status,
      withinRiyadh: isWithinRiyadh(verification.latitude, verification.longitude),
    },
  };
}
