import Redis from 'ioredis';
import fetchRetry from '$lib/utils/fetchRetry';
import { getEpoch } from "$lib/utils/timeUtils";
import { URL } from 'url';

const REDIS_URL = String(import.meta.env.VITE_REDIS_URL);
const redis_uri = new URL(REDIS_URL);

let redis_options = {}
if (redis_uri.protocol == "rediss:") {
  redis_options = { tls: { rejectUnauthorized: false }}
}
const redis = new Redis(REDIS_URL, redis_options);

redis.flushdb();

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }) {
  const { slug } = params;

  const expire_seconds = 30;

  let redis_cache = await redis.get(slug);
  const now = getEpoch();

  if (!redis_cache) {
    const response = await net_request(slug)
    const parsedResponse = (slug.startsWith('current-conditions'))
      ? await response.text()
      : await response.json();

    const payload_object = {
      page: parsedResponse,
      expires: now + expire_seconds
    };

    const payload = JSON.stringify(payload_object);
    await redis.set(slug, payload, 'ex', expire_seconds);
    redis_cache = payload;
  } else {
    if (import.meta.env.VITE_ENVIRONMENT === 'development') {
      console.log(`REDIS - found in cache: ${slug}`)
    }
  }

  if (redis_cache) {
    return {
      body: redis_cache,
    };
  }
}

const net_request = async (slug) => {
  const root_url = 'https://www.bcferries.com/';
  const full_url = root_url + slug;
  const response = await fetchRetry(full_url, 1000, 3, { method: 'GET' })
  return response;
}
