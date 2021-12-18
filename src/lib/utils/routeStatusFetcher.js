/** @typedef {import('./feasyInterfaces').OriginPort} OriginPort */
/** @typedef {import('./feasyInterfaces').DestinationPort} DestinationPort */
import { get } from 'svelte/store';

import Communicator from './communicator';
import routePageParser from './routePageParser';
import ports from './portsStore';
import { originCode, destinationCode } from './userInputStore';

const routeStatusFetcher = async () => {
  const originCodeString = get(originCode);
  const destinationCodeString = get(destinationCode);
  const portsMap = get(ports);
  console.log('this fuckin portsmap', portsMap);
  /** @type {OriginPort} */
  let origin = portsMap.get(originCodeString);
  const destination = origin.destinationRoutes.find(
    /** @param {DestinationPort} destination */
    destination => destination.code == destinationCodeString
  ) || (/** @type {DestinationPort} */ {});
  // console.log(`grabbing the destination port ${originCodeString} and its:`, destination);

  const routeStatusUrl = `${origin.code}-${destination.code}`;

  const routeStatusPageString = await Communicator.getRouteInfo(routeStatusUrl);
  const parser = routePageParser(routeStatusPageString);
  const routeStatus = parser.departures();
  return routeStatus;
};

export default routeStatusFetcher;
