/** @typedef {import('./feasyInterfaces.d').OriginPort} OriginPort */

import { writable } from 'svelte/store';
import Communicator from './communicator';

/** @type {Map<string, OriginPort>} */
const initialValue = new Map;

/**
 * @returns {Promise<void>}
 */
const fetchPorts = async (set) => {
  Communicator.getAllPorts().then( newPortsData => {
    const finalData = newPortsData.reduce((memo, route) => {
      memo.set(route.code, route);
      return memo;
    }, initialValue);
    set(finalData);
  });
}

const portStore = writable(initialValue, fetchPorts);

const refreshPorts = () => fetchPorts(portStore.set);

const ports = {
  subscribe: portStore.subscribe,
  set: portStore.set,
  refresh: refreshPorts
};

export default ports;
