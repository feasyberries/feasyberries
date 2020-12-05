<script lang="ts">
  import BackButton from "./BackButton.svelte"
  import PortMapView from "./PortMapView.svelte"
  import type { DestinationRoute, RoutesData } from './FeasyInterfaces'
  export let routesData: RoutesData[]
  export let origin: RoutesData
  export let destination: DestinationRoute
  const portsSort = ['LNG', 'HSB', 'NAN', 'DUK', 'TSA', 'SWB']
  let sortedPorts: RoutesData[] = []
  $: {
    if (routesData.length > 0) {
      sortedPorts = routesData.sort((a:RoutesData, b: RoutesData): number =>
        portsSort.indexOf(a.code) - portsSort.indexOf(b.code)
      )
    }
  }

  if (routesData.length > 0) {
  } else {
    sortedPorts.length = 0
  }
  console.log('dafuq these ports ', sortedPorts)
  const objectIsEmpty = (obj: object): boolean => {
    return Object.keys(obj).length === 0 && obj.constructor === Object
  }
  const originSelected = event => {
    console.log('RouteSelector# setting a new origin port:', event.detail)
    origin = event.detail
  }
  const destinationSelected = event => { destination = event.detail }
</script>

<style>
  .routeSelector {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  header {
    font-size: calc(100% + 8vw);
    text-align: center;
    font-family: var(--display-font);
  }

  ul {
    display: grid;
    align-content: end;
    height: 100%;
    list-style-type: none;
    padding: 0;
    margin: 0;
    background-image: url("/map.png");
    background-size: auto 100%;
    background-position: center center;
  }
</style>

<section class="routeSelector">
  {#if objectIsEmpty(origin)}
    <header>Origin?</header>
    <ul>
      {#each sortedPorts as port}
        <PortMapView {port} on:portSelected={originSelected}/>
      {/each}
    </ul>
  {:else}
    <header>Destination?</header>
    <BackButton on:backButton />
    <ul>
      {#each origin.destinationRoutes as port}
        <PortMapView {port} on:portSelected={destinationSelected} />
      {/each}
    </ul>
  {/if}
</section>