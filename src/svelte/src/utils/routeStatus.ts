import Communicator from './communicator'
import routePageParser from './routePageParser'
import { ports } from './portsStore'
import type { OriginPort, DestinationPort } from './FeasyInterfaces'

const routeStatus = async (originCode: string, destinationCode: string) => {
  let origin: OriginPort = <OriginPort>{}
  console.log('routeStauts attempt to read from store...')
  ports.subscribe((value: Map<string, OriginPort>) => {
    console.log(`reading store value, looking for ${originCode}`, value)
    const wtf = value.get(originCode)
    console.log('wtf is wtf', wtf)
    origin = value.get(originCode) || <OriginPort>{}
    // - sort out the possibly undefined problem here
    // - get to finishing this stores rewrite
    // - try to get it back to where it was before but
    //   with a better codebase this time (hopefully)
    // - swing back around on the concept of baseline
    //   designing
  })
  console.log('origin should now be set:', origin)

  const destination = origin.destinationRoutes.find( destination =>
    destination.code == destinationCode
  ) || <DestinationPort>{}

  const routeStatusUrl =
    `${origin.travelRouteName}-${destination.travelRouteName}/${origin.code}-${destination.code}`

  const routeStatusPageString = await Communicator.getRouteInfo(routeStatusUrl)
  const parser = routePageParser(routeStatusPageString)
  const routeStatus = parser.departures()
  return routeStatus
}

export default routeStatus
