import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";

const root = process.cwd();

test("client components never reference the Google server key", async () => {
  const clientFiles = [
    "components/admin/integrations-view.tsx",
    "components/admin/orders-view.tsx",
    "components/maps/mock-map.tsx",
  ];
  const sources = await Promise.all(clientFiles.map((file) => readFile(join(root, file), "utf8")));
  assert.equal(sources.some((source) => source.includes("GOOGLE_MAPS_API_KEY")), false);
  assert.equal(sources.some((source) => /AIza[A-Za-z0-9_-]{20,}/.test(source)), false);
});

test("operations link keeps browser-map traffic on the approved qbl.sa referrer", async () => {
  const source = await readFile(join(root, "components/admin/integrations-view.tsx"), "utf8");
  assert.match(source, /https:\/\/www\.qbl\.sa\/route-optimizer\/login/);
  assert.equal(source.includes("maps.googleapis.com/maps/api/js"), false);
});
