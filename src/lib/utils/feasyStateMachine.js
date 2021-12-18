import fsm from 'svelte-fsm';
import ports from '$lib/utils/portsStore';
import routeStatusFetcher from './routeStatusFetcher';
import { currentRouteStore } from "./currentRouteStore";

const feasyStateMachine = fsm('loadPortList', {
  loadPortList: {
    _enter() {
      ports.subscribe((newPorts) => {
        if (newPorts.size > 0) {
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
        this.timeTableLoaded();
      });
    },
    timeTableLoaded: 'awaitTime',
  },
  awaitTime: {
    timeSelected: 'awaitExpiry',
    back: 'awaitDestination'
  },
  awaitExpiry: {
    dataExpires: 'requestRefresh',
    back: 'awaitTime'
  },
  requestRefresh: {
    refreshArrives: 'awaitExpiry'
  }
});

export default feasyStateMachine;
