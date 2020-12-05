<script lang="ts">
  import { onMount } from 'svelte'
  import RouteSelector from './RouteSelector.svelte'
  import RouteViewer from './RouteViewer.svelte'
  import BackButton from './BackButton.svelte'
  import Communicator from './communicator'
  import routePageParser from './routePageParser'
  import type {DestinationRoute, RouteParser, RoutesData } from './FeasyInterfaces'
  let origin: RoutesData = <RoutesData>{}
  let destination: DestinationRoute = <DestinationRoute>{}
  let routesData: RoutesData[] = []
  let selectedRouteParser: RouteParser = <RouteParser>{}
  const objectIsEmpty = (obj: object): boolean => {
    return Object.keys(obj).length === 0 && obj.constructor === Object
  }
  let routeIsSelected: boolean = false
  const onBackButton = (_e) => {
    if (routeIsSelected && selectedRouteParser) {
      routeIsSelected = false
      selectedRouteParser = <RouteParser>{}
      destination = <DestinationRoute>{}
    }
    if (origin) {
      origin = <RoutesData>{}
    }
  }
  $: {
    console.log('Either origin or destination changed...')
    if (!objectIsEmpty(origin) && !objectIsEmpty(destination)) {
      routeIsSelected = true
    }
  }

  $: {
    console.log('App#Reacting  to something')
    if (routeIsSelected) {
      console.log('App#Reacting  routeIsSelected, get and parse route info...')
      Communicator.getRouteInfo(
        `${origin['travelRouteName']}-${destination['travelRouteName']}/${origin['code']}-${destination['code']}`
      ).then( response => {
        console.log('App#Reacting  got the response, parse it')
        selectedRouteParser = routePageParser(response)
      })
    }
  }
  onMount(async () => {
    console.log(`App#onMount`)
    if (routesData.length === 0 ) {
      Communicator.getAllRoutes().then( newRoutesData => {
        console.log(`App#onMount  got routes, set them as routesData...`)
        routesData = newRoutesData
      })
    }
  })
</script>

<style>
  :global(:root){
    --primary-color: #A5A1E0;
    --secondary-color-a: #E0CEAD;
    --secondary-color-b: #8B945C;
    --tertiary-color-a: #948A79;
    --tertiary-color-b: #D5E096;
    --light-primary:rgb(237,236,249);
    --background-color-dark: rgb(235,241,244);
    --background-color-light: rgb(255,255,255);
    --light-grey: rgb(135,152,173);
    --dark-grey: rgb(46,56,77);
    --display-font: 'Permanent Marker', cursive;
    --sans-serif-font: 'Poppins', sans-serif;
    --serif-font: 'Crete Round', serif;
  }

  header {
    background-color: var(--background-color-dark);
    color: var(--primary-color);
    font-family: var(--display-font);
    text-transform: uppercase;
    font-size: 12vw;
    text-align: center;
    margin: 0;
  }

  .root {
    font-family: var(--sans-serif-font);
    font-weight: 300;
    height: 100vh;
    width: 100vw;
    display: grid;
    grid-template-rows: 1fr 10fr
  }

  main {
    display: grid;
    place-items: center;
    background-color: var(--background-color-dark);
  }

  main section {
    height: 100%;
    width: 80%;
    border-radius: 0.15em;
    color: var(--dark-grey);
    background-color: var(--background-color-light);
  }
</style>

<div class="root">
  <header>
    Feasy Berries
  </header>
  <main>
    <section>
      {#if routeIsSelected && selectedRouteParser }
        <RouteViewer bind:selectedRouteParser on:backButton={onBackButton}/>
      {:else}
        <RouteSelector
          bind:routesData
          bind:origin
          bind:destination
          on:backButton={onBackButton}
        />
      {/if}
    </section>
  </main>
</div>