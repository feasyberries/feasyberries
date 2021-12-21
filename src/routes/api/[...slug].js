import { createClient } from 'redis';

// import.meta.env.VITE_ENVIRONMENT
/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }) {
  console.log('slug.json: ', params);
  const { slug } = params;
  const redis = createClient({
    url: import.meta.env.VITE_REDIS_URL
  });
  redis.on('error', (err) => console.error(err));
  const expire_seconds = 120;

  await redis.connect();
  console.log('redis connected');
  let redis_cache = await redis.get(params.slug);
  // let redis_cache = '';
  const now = Date.now();

  if (!redis_cache) {
    const response = await net_request(slug);
    const processed_response = slug.startsWith('current-conditions')
      ? await response.text()
      : await response.json();
    const payload = JSON.stringify({
      page: processed_response,
      expires: now + expire_seconds
    });
    // await redis.setEx(slug, expire_seconds, payload);
    redis_cache = payload;
  } else {
    console.log('found in redis cache: ', params.slug);
  }
  if (redis_cache) {
    return { body: redis_cache };
  }
}

const net_request = async (slug) => {
  const root_url = 'https://www.bcferries.com/';
  const full_url = root_url + slug;
  console.log('net_request ', full_url);
  const response = await fetchRetry(full_url, 1000, 3, { method: 'GET' })
  return response;
}

function wait(delay){
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// this seemed a better fetch-with-retry than mine, stolen from:
// https://stackoverflow.com/questions/46175660/fetch-retry-request-on-failure
function fetchRetry(url, delay, tries, fetchOptions = {}) {
  console.log('[slug].js fetchRetry', url);
  function onError(err){
    const triesLeft = tries - 1;
    if(!triesLeft){
      throw err;
    }
    return wait(delay).then(() => fetchRetry(url, delay, triesLeft, fetchOptions));
  }
  return fetch(url, fetchOptions).catch(onError);
}

