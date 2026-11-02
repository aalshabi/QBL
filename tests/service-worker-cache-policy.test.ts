import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

type Listener = (event: Record<string, unknown>) => void;

const serviceWorkerSource = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

function createHarness(
  options: {
    cachedResponse?: Response;
    cachedResponses?: Record<string, Response>;
    fetchError?: Error;
    fetchResponse?: Response;
    matchError?: Error;
    openError?: Error;
    putError?: Error;
  } = {},
) {
  const listeners = new Map<string, Listener>();
  const deletedCaches: string[] = [];
  const storedUrls: string[] = [];
  let claimCalls = 0;
  let fetchCalls = 0;

  const cache = {
    put: async (request: { url?: string } | string) => {
      if (options.putError) {
        throw options.putError;
      }
      storedUrls.push(typeof request === "string" ? request : (request.url ?? ""));
    },
    match: async (request: { url?: string } | string) => {
      if (options.matchError) {
        throw options.matchError;
      }
      const key = typeof request === "string" ? request : (request.url ?? "");
      return options.cachedResponses?.[key] ?? options.cachedResponse;
    },
  };

  const context = vm.createContext({
    URL,
    caches: {
      delete: async (key: string) => {
        deletedCaches.push(key);
        return true;
      },
      keys: async () => ["qbl-pwa-v1", "qbl-pwa-v2", "another-app-v1"],
      match: async () => {
        throw new Error("Service worker must not search caches outside the current QBL cache");
      },
      open: async () => {
        if (options.openError) {
          throw options.openError;
        }
        return cache;
      },
    },
    fetch: async () => {
      fetchCalls += 1;
      if (options.fetchError) {
        throw options.fetchError;
      }
      return options.fetchResponse ?? new Response("network", { status: 200 });
    },
    Response,
    self: {
      addEventListener: (name: string, listener: Listener) => listeners.set(name, listener),
      clients: {
        claim: async () => {
          claimCalls += 1;
        },
      },
      location: { origin: "https://qbl.sa" },
      skipWaiting: async () => undefined,
    },
  });

  vm.runInContext(serviceWorkerSource, context, { filename: "public/sw.js" });

  async function runLifecycle(name: "install" | "activate") {
    let completion: Promise<unknown> | undefined;
    listeners.get(name)?.({
      waitUntil: (promise: Promise<unknown>) => {
        completion = promise;
      },
    });
    assert.ok(completion, `${name} must register lifecycle work`);
    await completion;
  }

  async function runFetch(url: string, mode: string = "navigate") {
    let responsePromise: Promise<Response> | undefined;
    listeners.get("fetch")?.({
      request: { method: "GET", mode, url },
      respondWith: (promise: Promise<Response>) => {
        responsePromise = promise;
      },
    });
    return responsePromise ? await responsePromise : undefined;
  }

  return {
    deletedCaches,
    get claimCalls() {
      return claimCalls;
    },
    get fetchCalls() {
      return fetchCalls;
    },
    runFetch,
    runLifecycle,
    storedUrls,
  };
}

test("precache contains only the explicit public shell", async () => {
  const harness = createHarness();
  await harness.runLifecycle("install");

  assert.deepEqual(harness.storedUrls, [
    "/",
    "/offline",
    "/services",
    "/icons/icon-192.svg",
    "/icons/icon-512.svg",
    "/manifest.webmanifest",
  ]);
  assert.ok(!harness.storedUrls.includes("/quote"));
  assert.ok(!harness.storedUrls.includes("/track"));
});

test("activation removes the previous QBL cache without deleting unrelated caches", async () => {
  const harness = createHarness();
  await harness.runLifecycle("activate");

  assert.deepEqual(harness.deletedCaches, ["qbl-pwa-v1"]);
  assert.equal(harness.claimCalls, 1);
});

test("private, tracking, API, and non-allowlisted navigations bypass the cache", async () => {
  const harness = createHarness();
  const privatePaths = [
    "/quote",
    "/quote/new",
    "/track",
    "/track/private-token",
    "/admin",
    "/brand",
    "/cold-chain-system/client-dashboard",
    "/cold-chain-system/driver-app",
    "/cold-chain-system/operations-dashboard",
    "/courier",
    "/ops",
    "/login",
    "/api/quote",
    "/t",
    "/team",
    "/contact",
    "/?utm_source=private-campaign",
  ];

  for (const path of privatePaths) {
    assert.equal(await harness.runFetch(`https://qbl.sa${path}`), undefined, path);
  }

  assert.equal(harness.fetchCalls, 0);
  assert.deepEqual(harness.storedUrls, []);
});

test("allowlisted public navigation is fetched and stored", async () => {
  const harness = createHarness();
  const response = await harness.runFetch("https://qbl.sa/services");

  assert.equal(await response?.text(), "network");
  assert.equal(harness.fetchCalls, 1);
  assert.deepEqual(harness.storedUrls, ["https://qbl.sa/services"]);
});

test("only allowlisted static assets are intercepted", async () => {
  const harness = createHarness();

  await harness.runFetch("https://qbl.sa/_next/static/chunks/app.js", "no-cors");
  assert.equal(await harness.runFetch("https://qbl.sa/private-export.pdf", "no-cors"), undefined);

  assert.equal(harness.fetchCalls, 1);
  assert.deepEqual(harness.storedUrls, ["https://qbl.sa/_next/static/chunks/app.js"]);
});

test("fixed-name public assets revalidate while hashed assets stay cache-first", async () => {
  const cached = new Response("cached", { status: 200 });
  const fresh = new Response("fresh", { status: 200 });
  const harness = createHarness({ cachedResponse: cached, fetchResponse: fresh });

  const manifest = await harness.runFetch("https://qbl.sa/manifest.webmanifest", "no-cors");
  assert.equal(await manifest?.text(), "fresh");
  assert.equal(harness.fetchCalls, 1);

  const hashed = await harness.runFetch("https://qbl.sa/_next/static/chunks/app.js", "no-cors");
  assert.equal(await hashed?.text(), "cached");
  assert.equal(harness.fetchCalls, 1);
});

test("private redirects and explicitly non-cacheable responses are never stored", async () => {
  const redirected = new Response("login", { status: 200 });
  Object.defineProperty(redirected, "url", { value: "https://qbl.sa/login" });
  const redirectHarness = createHarness({ fetchResponse: redirected });

  await redirectHarness.runFetch("https://qbl.sa/services");
  assert.deepEqual(redirectHarness.storedUrls, []);

  const noStoreHarness = createHarness({
    fetchResponse: new Response("public", {
      status: 200,
      headers: { "cache-control": "private, no-store" },
    }),
  });
  await noStoreHarness.runFetch("https://qbl.sa/services");
  assert.deepEqual(noStoreHarness.storedUrls, []);
});

test("precache fails closed on private redirects and non-cacheable responses", async () => {
  const redirected = new Response("login", { status: 200 });
  Object.defineProperty(redirected, "url", { value: "https://qbl.sa/login" });
  const redirectHarness = createHarness({ fetchResponse: redirected });
  await assert.rejects(redirectHarness.runLifecycle("install"), /Refusing to precache/);
  assert.deepEqual(redirectHarness.storedUrls, []);

  const noStoreHarness = createHarness({
    fetchResponse: new Response("public", {
      status: 200,
      headers: { "cache-control": "no-store" },
    }),
  });
  await assert.rejects(noStoreHarness.runLifecycle("install"), /Refusing to precache/);
  assert.deepEqual(noStoreHarness.storedUrls, []);
});

test("runtime cache write failures do not hide successful network responses", async () => {
  const navigationHarness = createHarness({ putError: new Error("quota exceeded") });
  const navigation = await navigationHarness.runFetch("https://qbl.sa/services");
  assert.equal(await navigation?.text(), "network");

  const assetHarness = createHarness({ putError: new Error("quota exceeded") });
  const asset = await assetHarness.runFetch("https://qbl.sa/manifest.webmanifest", "no-cors");
  assert.equal(await asset?.text(), "network");
});

test("runtime cache open and match failures do not hide successful network responses", async () => {
  const navigationHarness = createHarness({ openError: new Error("cache unavailable") });
  const navigation = await navigationHarness.runFetch("https://qbl.sa/services");
  assert.equal(await navigation?.text(), "network");

  const assetHarness = createHarness({ openError: new Error("cache unavailable") });
  const asset = await assetHarness.runFetch("https://qbl.sa/manifest.webmanifest", "no-cors");
  assert.equal(await asset?.text(), "network");

  const matchHarness = createHarness({ matchError: new Error("cache unreadable") });
  const hashed = await matchHarness.runFetch("https://qbl.sa/_next/static/chunks/app.js", "no-cors");
  assert.equal(await hashed?.text(), "network");
});

test("failed public navigation falls back to the matching cached page", async () => {
  const harness = createHarness({
    fetchError: new Error("network unavailable"),
    cachedResponses: {
      "https://qbl.sa/services": new Response("cached services", { status: 200 }),
    },
  });

  const response = await harness.runFetch("https://qbl.sa/services");
  assert.equal(await response?.text(), "cached services");
});

test("failed public navigation falls back to the offline shell", async () => {
  const harness = createHarness({
    fetchError: new Error("network unavailable"),
    cachedResponses: {
      "/offline": new Response("offline shell", { status: 200 }),
    },
  });

  const response = await harness.runFetch("https://qbl.sa/services");
  assert.equal(await response?.text(), "offline shell");
});

test("failed public navigation preserves the network error without a readable fallback", async () => {
  const networkError = new Error("network unavailable");
  const noFallback = createHarness({ fetchError: networkError });
  await assert.rejects(noFallback.runFetch("https://qbl.sa/services"), networkError);

  const unreadableCache = createHarness({
    fetchError: networkError,
    matchError: new Error("cache unreadable"),
  });
  await assert.rejects(unreadableCache.runFetch("https://qbl.sa/services"), networkError);
});
