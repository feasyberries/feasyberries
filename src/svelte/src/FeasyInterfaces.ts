interface CommunicatorObject {
  getAllRoutes: () => Promise<Array<RoutesData>>
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

interface DestinationRoute {
  destination: string
  code: string
  name: string
  travelRouteName: string
  isBookable: boolean
  isWalkOn: boolean
  motorcycleAllowed: boolean
  allowLivestock: boolean
  allowsWalkOnOptions: boolean
  allowAdditionalPassengerTypes: boolean
  routeType: string
  limitedAvailability: boolean
  geoGraphicalArea: SmallArea
  city: SmallArea
}

interface RoutesData {
  code: string
  name: string
  travelRouteName: string
  city: SmallArea
  geoGraphicalArea: SmallArea
  destinationRoutes: Array<DestinationRoute>
  isBookable: boolean
  allowsWalkOnOptions: boolean
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
  DestinationRoute,
  RoutesData,
  PastStatus,
  FutureStatus,
  DeparturesList,
  FutureDeparture,
  PastDeparture,
  RouteParser
}