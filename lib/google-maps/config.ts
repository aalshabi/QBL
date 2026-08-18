import "server-only";

export class GoogleMapsConfigurationError extends Error {
  constructor(public readonly variable: "GOOGLE_MAPS_API_KEY") {
    super(`Missing Google Maps server configuration: ${variable}`);
    this.name = "GoogleMapsConfigurationError";
  }
}

export function getGoogleMapsConfig(): { apiKey: string } {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) throw new GoogleMapsConfigurationError("GOOGLE_MAPS_API_KEY");
  return { apiKey };
}
