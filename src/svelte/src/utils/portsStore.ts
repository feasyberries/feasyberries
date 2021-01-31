import { readable } from 'svelte/store'
import Communicator from './communicator'
import type { OriginPort } from './FeasyInterfaces'

const initialValue: Map<string, OriginPort> = new Map

const createPortsStore = () => {
  const dataStore = readable(initialValue, createOnSubscribe())
  return {
    subscribe: dataStore.subscribe,
    refresh: () => { /* can we somehow update the readable store from here? */ }
  }
}

const fetchData = async (set:(data:any) => void): Promise<void> => {
  Communicator.getAllPorts().then( newPortsData => {
    const finalData = newPortsData.reduce((memo, route) => {
      memo.set(route.code, route)
      return memo
    }, initialValue)
    set(finalData)
  })
}

const createOnSubscribe = () => {
  return (set:(data:any) => void) => {
    fetchData(set)
    return unsubscribe
  }
}

const unsubscribe = () => {}

export const ports = createPortsStore();
