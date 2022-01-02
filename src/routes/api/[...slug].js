import { createClient } from 'redis';
import fetchRetry from '$lib/utils/fetchRetry';
import { getEpoch } from "$lib/utils/timeUtils";

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }) {
  const { slug } = params;
  const redisClientOptions =
    (import.meta.env.VITE_REDIS_URL === 'redis://redis:6379/0')
    ? { url: import.meta.env.VITE_REDIS_URL }
    : {
      url: import.meta.env.VITE_REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false,
      }
    }
  // @ts-ignore
  const redis = createClient(redisClientOptions);
  redis.on('error', (err) => console.error(err));
  const expire_seconds = 30;

  await redis.connect();
  let redis_cache = await redis.get(slug);
  const now = getEpoch();

  if (!redis_cache) {
    const response = await net_request(slug);
    const processed_response = slug.startsWith('current-conditions')
      ? await response.text()
      : await response.json();
    const payload_object = {
      page: processed_response,
      expires: now + expire_seconds
    };
    const payload = JSON.stringify(payload_object);
    await redis.set(slug, payload, {
      EX: expire_seconds,
    });
    redis_cache = payload;
  } else {
    if (import.meta.env.VITE_ENVIRONMENT === 'development') {
      console.log(`REDIS - found in cache: ${slug}`)
    }
  }

  if (redis_cache) {
    const ttl = await redis.ttl(slug);
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
