import { writable } from 'svelte/store';

const originCode = writable('');
const destinationCode = writable('');
const departureTime = writable(0);

export {
  originCode,
  destinationCode,
  departureTime
};
