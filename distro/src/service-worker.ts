import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

const PUBLIC_PATH = process.env.PUBLIC_PATH ?? '/';

const fileExtensionRegexp = /\/[^/?]+\.[^/]+$/;
registerRoute(
  ({ request, url }: { request: Request; url: URL }) => {
    if (request.mode !== 'navigate') {
      return false;
    }
    if (url.pathname.startsWith('/_')) {
      return false;
    }
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }
    return true;
  },
  createHandlerBoundToURL(`${PUBLIC_PATH}index.html`),
);

const CACHE_MAX_AGE = 7 * 24 * 60 * 60;

const createCacheStrategy = (cacheName: string, maxEntries: number) =>
  new StaleWhileRevalidate({
    cacheName,
    plugins: [
      new ExpirationPlugin({
        maxEntries,
        maxAgeSeconds: CACHE_MAX_AGE,
      }),
    ],
  });

registerRoute(
  ({ url }) => url.pathname.startsWith('/bahmni_config/'),
  createCacheStrategy('bahmni-config-cache-v1', 50),
);

const metadataEndpoints = [
  '/openmrs/ws/rest/v1/idgen/identifiertype',
  '/openmrs/ws/rest/v1/ordertype',
  '/openmrs/ws/rest/v1/bahmnicore/config/bahmniencounter',
  '/openmrs/ws/rest/v1/bahmniie/form/latestPublishedForms',
  '/openmrs/ws/rest/v1/personattributetype',
  '/openmrs/ws/rest/v1/relationshiptype',
];

registerRoute(
  ({ url }) =>
    metadataEndpoints.some((endpoint) => url.pathname.includes(endpoint)) ??
    url.pathname.match(/\/openmrs\/ws\/rest\/v1\/form\/[^/]+/) !== null,
  createCacheStrategy('bahmni-metadata-cache-v1', 100),
);

const conceptEndpoints = ['/openmrs/ws/rest/v1/concept?s=byFullySpecifiedName'];

registerRoute(
  ({ url }) =>
    conceptEndpoints.some((endpoint) => url.pathname.includes(endpoint)),
  createCacheStrategy('bahmni-concepts-cache-v1', 200),
);
