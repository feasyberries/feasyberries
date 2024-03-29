/** @typedef {import('./feasyInterfaces').CommunicatorObject} CommunicatorObject */

import fetchRetry from './fetchRetry';

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
    return request('GET', `${host}/api/cc-route-info`, {})
      .then(response => response.json())
      .then(data => data['page'])
      .catch(console.error);
  },
  getRouteInfo: async (uri) => {
    let response = await request('GET', `${host}/api/current-conditions/${uri}`, {});
    if (response.status === 200) {
      const parsedJson = await response.json();
      return parsedJson;
    } else {
      return '';
    }
  },
}

export default Communicator
