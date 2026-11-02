const CACHE_PREFIX = "qbl-pwa-";
const CACHE_VERSION = `${CACHE_PREFIX}v2`;
const APP_SHELL = [
  "/",
  "/offline",
  "/services",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/manifest.webmanifest",
];

const PUBLIC_NAVIGATION_PATHS = new Set(["/", "/offline", "/services"]);
const PUBLIC_ASSET_PATHS = new Set([
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/manifest.webmanifest",
]);
const PUBLIC_ASSET_PREFIXES = ["/_next/static/"];
const PRIVATE_PATHS = [
  "/admin",
  "/api",
  "/brand",
  "/cold-chain-system/client-dashboard",
  "/cold-chain-system/driver-app",
  "/cold-chain-system/operations-dashboard",
  "/courier",
  "/login",
  "/ops",
  "/quote",
  "/t",
  "/team",
  "/track",
];

function matchesPathOrDescendant(pathname, path) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function isPrivatePath(pathname) {
  return PRIVATE_PATHS.some((path) => matchesPathOrDescendant(pathname, path));
}

function isPublicNavigation(url) {
  return url.search === "" && PUBLIC_NAVIGATION_PATHS.has(url.pathname);
}

function isPublicAsset(pathname) {
  return (
    PUBLIC_ASSET_PATHS.has(pathname) ||
    PUBLIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function canStore(requestUrl, response, kind) {
  const cacheControl = response.headers.get("cache-control")?.toLowerCase() ?? "";
  const vary = response.headers.get("vary") ?? "";

  if (
    !response.ok ||
    response.status === 206 ||
    response.type === "opaque" ||
    cacheControl.includes("no-store") ||
    cacheControl.includes("private") ||
    vary.includes("*")
  ) {
    return false;
  }

  if (!response.url) {
    return true;
  }

  const finalUrl = new URL(response.url, requestUrl);
  if (finalUrl.origin !== self.location.origin || isPrivatePath(finalUrl.pathname)) {
    return false;
  }

  return kind === "navigation"
    ? isPublicNavigation(finalUrl)
    : isPublicAsset(finalUrl.pathname);
}

async function precacheShell() {
  const cache = await caches.open(CACHE_VERSION);

  await Promise.all(
    APP_SHELL.map(async (path) => {
      const requestUrl = new URL(path, self.location.origin);
      const kind = PUBLIC_NAVIGATION_PATHS.has(requestUrl.pathname) ? "navigation" : "asset";
      const response = await fetch(path, { cache: "reload" });

      if (!canStore(requestUrl.href, response, kind)) {
        throw new Error(`Refusing to precache non-public response for ${path}`);
      }

      await cache.put(path, response);
    }),
  );
}

async function storeRuntimeResponse(cache, request, response, kind) {
  if (!canStore(request.url, response, kind)) {
    return;
  }

  try {
    await cache.put(request, response.clone());
  } catch {
    // A full or unavailable Cache Storage must not replace a valid network response with offline UI.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    precacheShell().then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (isPrivatePath(url.pathname)) {
    return;
  }

  if (request.mode === "navigate") {
    if (!isPublicNavigation(url)) {
      return;
    }

    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          try {
            const cache = await caches.open(CACHE_VERSION);
            await storeRuntimeResponse(cache, request, response, "navigation");
          } catch {
            // Cache Storage is optional while the network is healthy.
          }
          return response;
        } catch (networkError) {
          try {
            const cache = await caches.open(CACHE_VERSION);
            const cached = await cache.match(request);
            const offline = cached || (await cache.match("/offline"));
            if (offline) {
              return offline;
            }
          } catch {
            // Preserve the original network failure when no cache fallback is available.
          }
          throw networkError;
        }
      })(),
    );
    return;
  }

  if (!isPublicAsset(url.pathname)) {
    return;
  }

  event.respondWith(
    (async () => {
      const isImmutableAsset = PUBLIC_ASSET_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
      let cache;
      let cached;

      try {
        cache = await caches.open(CACHE_VERSION);
        cached = await cache.match(request);
      } catch {
        // Continue with the network when Cache Storage is unavailable or unreadable.
      }

      if (isImmutableAsset && cached) {
        return cached;
      }

      try {
        const response = await fetch(request);
        if (cache) {
          await storeRuntimeResponse(cache, request, response, "asset");
        }
        return response;
      } catch (error) {
        if (cached) {
          return cached;
        }
        throw error;
      }
    })(),
  );
});
