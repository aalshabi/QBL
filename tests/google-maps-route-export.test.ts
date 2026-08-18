import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildVerifiedRouteCsv,
  RouteExportBlockedError,
} from "@/lib/google-maps/route-export";

test("exports only verified Riyadh coordinates in the optimizer column format", () => {
  const csv = buildVerifiedRouteCsv([
    {
      tracking: "QBL-1",
      address: "RAJB2706",
      location: {
        ok: true,
        status: "VERIFIED",
        latitude: 24.8697238,
        longitude: 46.6427238,
        formattedAddress: "RAJB2706، 2706 شارع القصر، الرياض",
      },
    },
  ]);

  assert.match(csv, /^\uFEFFTracking,Address,Latitude,Longitude/);
  assert.match(csv, /QBL-1/);
  assert.match(csv, /24\.8697238,46\.6427238/);
});

test("fails closed when any selected location still needs review", () => {
  assert.throws(
    () =>
      buildVerifiedRouteCsv([
        {
          tracking: "QBL-2",
          address: "حي النرجس، الرياض",
          location: { ok: true, status: "NEEDS_REVIEW", latitude: 24.8, longitude: 46.6 },
        },
      ]),
    (error: unknown) => error instanceof RouteExportBlockedError && error.blockedCount === 1,
  );
});
