import Redis from 'ioredis';
import fetchRetry from '$lib/utils/fetchRetry';
import { getEpoch } from "$lib/utils/timeUtils";
import { URL } from 'url';

const REDIS_URL = String(import.meta.env.VITE_REDIS_URL);
const redis_uri = new URL(REDIS_URL);

let redis_options = {}
if (redis_uri.protocol == "rediss:") {
  console.log('this piece of shit wants tls redis:', REDIS_URL);
  redis_options = { tls: { rejectUnauthorized: false }}
}
console.log('okay you piece of shit, lets connect to redis:');
console.log(`redis = new Redis(${REDIS_URL}, ${JSON.stringify(redis_options, null, 2)})`);
const redis = new Redis(REDIS_URL, redis_options);

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }) {
  console.log('[...slug].js: request for ', params.slug);
  const { slug } = params;

  const expire_seconds = 30;

  let redis_cache = await redis.get(slug);
  const now = getEpoch();

  if (!redis_cache) {
    console.log('there was no cache, request from web...');
    const response = await net_request(slug)
    console.log('after request, i bet it crashes here');
    const parsedResponse = (slug.startsWith('current-conditions'))
      ? await response.text()
      : await response.json();

    console.log('got past it!');
    const didIt = slug.startsWith('current-conditions');
    console.log(`parsed as text? ${didIt} heres the raw bullshit:`, parsedResponse);
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
    console.log('returning api response here its definitely a JSON string:', typeof(redis_cache));
    console.log('why wont this piece of shit parse?:', redis_cache);
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
