import { get } from 'svelte/store';
import fsm from 'svelte-fsm';
import ports from '$lib/utils/portsStore';
import routeStatusFetcher from './routeStatusFetcher';
import { currentRouteStore } from "./currentRouteStore";
import { departureTime } from "./userInputStore";
import { startCountdownStore, stopCountdownStore } from './countdownStore';

const feasyStateMachine = fsm('loadPortList', {
  loadPortList: {
    _enter() {
      ports.subscribe((newPorts) => {
        if (newPorts.size > 0) {
          // @ts-ignore
          this.portListLoaded();
        }
      });
    },
    portListLoaded: 'awaitOrigin'
  },
  awaitOrigin: {
    originSelected: 'awaitDestination',
  },
  awaitDestination: {
    destinationSelected: 'loadTimetable',
    back: 'awaitOrigin'
  },
  loadTimetable: {
    _enter() {
      routeStatusFetcher().then(response => {
        currentRouteStore.set(response);
        // @ts-ignore:
        this.loadComplete();
      });
     },
    loadComplete: 'awaitTime',
  },
  awaitTime: {
    timeSelected: 'awaitExpiry',
    back() {
      currentRouteStore.reset();
      return 'awaitDestination';
    }
  },
  awaitExpiry: {
    _enter() {
      startCountdownStore(get(currentRouteStore).expires, () => {
          // @ts-ignore:
          this.dataExpired();
        }
      );
    },
    dataExpired: 'loadRefresh',
    back() {
      departureTime.set(0);
      stopCountdownStore();
      return 'awaitTime';
    }
  },
  loadRefresh: {
    _enter() {
      routeStatusFetcher().then(response => {
        currentRouteStore.set(response);
        // @ts-ignore:
        this.loadComplete();
      });
    },
    loadComplete: 'awaitExpiry',
    back() {
      departureTime.set(0);
      stopCountdownStore();
      return 'awaitTime';
    }
  }
});

export default feasyStateMachine;
