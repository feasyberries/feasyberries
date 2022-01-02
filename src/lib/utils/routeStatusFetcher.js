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
  /** @type {OriginPort} */
  let origin = portsMap.get(originCodeString);

  /** @type {DestinationPort} */ // @ts-ignore:
  const destination = origin.destinationRoutes.find(
    /** @param {DestinationPort} destination */
    destination => destination.code == destinationCodeString
  ) || {};

  const routeStatusUrl = `${origin.code}-${destination.code}`;

  const routeStatusPageString = await Communicator.getRouteInfo(routeStatusUrl);
  const parser = routePageParser(routeStatusPageString);
  const routeStatus = parser.departures();
  return routeStatus;
};

export default routeStatusFetcher;
