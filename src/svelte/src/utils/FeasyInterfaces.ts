interface CommunicatorObject {
  getAllPorts: () => Promise<Array<OriginPort>>
  getRouteInfo: (uri: string) => Promise<string>
}

interface DeparturesFunc {
  (): DeparturesList
}

interface RouteParser {
  departures: DeparturesFunc
}

interface SmallArea {
  code: string
  name: string
  sortOrder: number
  isBookable: boolean
}

interface Port {
  code: string
  name: string
  travelRouteName: string
  city: SmallArea
  isBookable: boolean
  geoGraphicalArea: SmallArea
  allowsWalkOnOptions: boolean
}

interface DestinationPort extends Port{
  destination: string
  isWalkOn: boolean
  motorcycleAllowed: boolean
  allowLivestock: boolean
  allowAdditionalPassengerTypes: boolean
  routeType: string
  limitedAvailability: boolean
}

interface OriginPort extends Port {
  destinationRoutes: Array<DestinationPort>
}

interface PastStatus {
  status: string
  time: number
}

interface FutureStatus {
  percentAvailable: number
}

interface Ferry {
  name: string
  url: string
}

interface DeckSpace {
  total: number
  standard?: number
  mixed?: number
}

interface FutureDeparture {
  time: number
  status: FutureStatus
  ferry: Ferry
  deckSpace: DeckSpace
}

interface PastDeparture {
  time: number
  status: PastStatus
}

interface DeparturesList {
  future: Array<FutureDeparture>
  past: Array<PastDeparture>
}

export type {
  CommunicatorObject,
  SmallArea,
  Port,
  DestinationPort,
  OriginPort,
  PastStatus,
  FutureStatus,
  DeparturesList,
  FutureDeparture,
  PastDeparture,
  RouteParser
}