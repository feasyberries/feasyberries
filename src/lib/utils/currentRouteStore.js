/** @typedef {import('./feasyInterfaces.d').DeparturesList} DeparturesList */
/** @typedef {import('./feasyInterfaces.d').FutureDeparture} FutureDeparture */
/** @typedef {import('./feasyInterfaces.d').PastDeparture} PastDeparture */

import { derived, writable, get } from 'svelte/store';
import { departureTime } from '$lib/utils/userInputStore';

/** @type {DeparturesList} */
const initialValue = {past: [], future: [], expires: 0};
const currentRoute = writable(initialValue);

const currentRouteStore = {
  ...currentRoute,
  reset() { currentRouteStore.set(initialValue); }
}

const initialUpdateHistory = [];
const maxHistorySize = 5;

const routeUpdateHistoryStore = derived(
  [currentRoute],
  ([$currentRoute], set) => {
    if ($currentRoute.expires) {
      const prev = get(routeUpdateHistoryStore);
      if (prev.find(h => h.expires == $currentRoute.expires)) {
        return;
      }
      const newHistory = (prev.length == maxHistorySize)
        ? [...(prev.slice(0, 1)), $currentRoute]
        : [...prev, $currentRoute];
      set(newHistory);
    }
  },
  initialUpdateHistory
);

const departureTimeHistoryStore = derived(
  [routeUpdateHistoryStore, departureTime],
  ([$routeUpdateHistoryStore, $departureTime], set) => {
    if ($departureTime) {
      const filteredHistory = $routeUpdateHistoryStore.map(update => {
        /** @type {FutureDeparture|PastDeparture} */
        let departure = update.future.find(dep => dep.time == $departureTime);
        if (!departure) {
          departure = update.past.find(dep => dep.time == $departureTime);
        }
        return {
          departure,
          expires: update.expires
        };
      });
      set(filteredHistory);
    }
  }
);

export {
  currentRouteStore,
  routeUpdateHistoryStore,
  departureTimeHistoryStore
};
