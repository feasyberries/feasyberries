export interface CommunicatorObject {
  getAllPorts: () => Promise<Array<OriginPort>>
  getRouteInfo: (uri: string) => Promise<{page: string, expires: number}>
}

export interface DeparturesFunc {
  (): DeparturesList
}

export interface RouteParser {
  departures: DeparturesFunc
}

export interface SmallArea {
  code: string
  name: string
  sortOrder: number
  isBookable: boolean
}

export interface Port {
  code: string
  name: string
  travelRouteName: string
  city: SmallArea
  isBookable: boolean
  geoGraphicalArea: SmallArea
  allowsWalkOnOptions: boolean
}

export interface DestinationPort extends Port{
  destination: string
  isWalkOn: boolean
  motorcycleAllowed: boolean
  allowLivestock: boolean
  allowAdditionalPassengerTypes: boolean
  routeType: string
  limitedAvailability: boolean
}

export interface OriginPort extends Port {
  destinationRoutes: Array<DestinationPort>
}

export interface PastStatus {
  status: string
  time: number
}

export interface FutureStatus {
  cancelled?: boolean,
  percentAvailable: number
}

export interface Ferry {
  name: string
  url: string
}

export interface DeckSpace {
  total?: number
  standard?: number
  mixed?: number
}

export interface FutureDeparture {
  time: number
  status: FutureStatus
  ferry: Ferry
  deckSpace: DeckSpace
}

export interface PastDeparture {
  time: number
  status: PastStatus
}

export interface DeparturesList {
  future: Array<FutureDeparture>
  past: Array<PastDeparture>
  expires: number
}

// export type {
//   CommunicatorObject,
//   SmallArea,
//   Port,
//   DestinationPort,
//   OriginPort,
//   PastStatus,
//   FutureStatus,
//   DeparturesList,
//   FutureDeparture,
//   PastDeparture,
//   RouteParser
// }
