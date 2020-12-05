import type { CommunicatorObject } from './FeasyInterfaces'

const request = async (
  method: string,
  url: string,
  params: object
): Promise<Response> => {
  console.log(`Communicator#request`)
  const fetch_options: object = {
    method: method,
    ...params
  }
  console.log(`Communicator#request  request: ${method}: ${url}`, fetch_options)
  // return fetch(url, fetch_options)
  let response = await fetch(url, fetch_options)
  let networkAttempts = 0
  while (networkAttempts < 5) {
    console.log(`Communicator#request  Requesting...`)
    if (response.status !== 200) {
      networkAttempts = networkAttempts + 1
      console.log(`Communicator#request  Error detected, retry #${networkAttempts}`)
      response = await request(method, url, params)
    } else {
      console.log(`Communicator#request  Reponse valid`)
      break
    }
  }
  return response
}

const Communicator: CommunicatorObject = {
  getAllRoutes: async () => {
    console.log(`Communicator#getAllRoutes  Contacting berries...`)
    let response = await request('GET', '/api/small', {})
    if (response.status === 200) {
      console.log(`Communicator#getAllRoutes  Results valid, returning restults`)
      const parsedJson = await response.json()
      return JSON.parse(parsedJson["page"])
    } else {
      console.log(`Communicator#getAllRoutes  Something wrong, return empty array`)
      return []
    }
  },
  getRouteInfo: async (uri) => {
    console.log(`Communicator#getRouteInfo  fetching route: ${uri}`)
    let response = await request('GET', `/api/current-conditions/${uri}`, {})
    if (response.status === 200) {
      console.log(`Communicator#getRouteInfo  Results valid, returning restults`)
      const parsedJson = await response.json()
      return parsedJson["page"]
    } else {
      console.log(`Communicator#getRouteInfo  Something wrong, return empty array`)
      return ''
    }
  }
}
export default Communicator