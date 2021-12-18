import { writable } from 'svelte/store';

const originCode = writable('');
const destinationCode = writable('');
const time = writable('');

export {
  originCode,
  destinationCode,
  time
};
