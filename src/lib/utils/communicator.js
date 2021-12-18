/** @typedef {import('./feasyInterfaces').CommunicatorObject} CommunicatorObject */

function wait(delay){
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// this seemed a better fetch-with-retry than mine, stolen from:
// https://stackoverflow.com/questions/46175660/fetch-retry-request-on-failure
function fetchRetry(url, delay, tries, fetchOptions = {}) {
  function onError(err){
    const triesLeft = tries - 1;
    if(!triesLeft){
      throw err;
    }
    return wait(delay).then(() => fetchRetry(url, delay, triesLeft, fetchOptions));
  }
  return fetch(url,fetchOptions).catch(onError);
}

/**
 *
 * @param {string} method
 * @param {string} url
 * @param {object} params
 * @returns {Promise<Response>}
 */
const request = async (method, url, params)  => {
  /** @type {object} */
  const fetch_options = {
    method: method,
    ...params
  };
  let response = await fetchRetry(url, 1000, 3, fetch_options)
  return response;
};

const host = (import.meta.env.VITE_ENVIRONMENT === 'development')
  ? 'http://localhost:3000'
  : 'https://feasyberries.herokuapp.com'

/** @type {CommunicatorObject} */
const Communicator = {
  getAllPorts: async () => {
    let response = await request('GET', `${host}/api/cc-route-info`, {});
    if (response.status === 200) {
      const parsedJson = await response.json();
      return parsedJson["page"];
    } else {
      return [];
    }
  },
  getRouteInfo: async (uri) => {
    let response = await request('GET', `${host}/api/current-conditions/${uri}`, {});
    if (response.status === 200) {
      const parsedJson = await response.json();
      return parsedJson["page"];
    } else {
      return '';
    }
  },
}

export default Communicator
