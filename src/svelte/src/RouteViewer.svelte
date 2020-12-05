<script lang="ts">
  import BackButton from "./BackButton.svelte"
  import PastDepatureListView from "./PastDepatureListView.svelte"
  import FutureDepartureListView from "./FutureDepatureListView.svelte"
  import type { DeparturesList, RouteParser } from "./FeasyInterfaces";
  export let selectedRouteParser: RouteParser
  let departures: DeparturesList
  $: {
    if (typeof(selectedRouteParser.departures) === 'function') {
      departures = selectedRouteParser.departures()
    }
  }
</script>

<style>
  .routeViewer {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  header {
    font-size: calc(100% + 8vw);
    text-align: center;
    font-family: var(--display-font);
  }
  .routes {
    height: 100%;
    background-image: url("/map.png");
    background-size: auto 100%;
    background-position: center center;
  }
</style>

<section class="routeViewer">
  <header>When?</header>
  {#if selectedRouteParser && departures }
    <BackButton on:backButton />
    <section class="routes">
      <ul class="pastDepartures">
        {#each departures.past as pastDeparture}
          <PastDepatureListView departure={pastDeparture} />
        {/each}
      </ul>
      <hr>
      <ul class="futureDepartures">
        {#each departures.future as futureDeparture}
          <FutureDepartureListView departure={futureDeparture} />
        {/each}
      </ul>
    </section>
  {:else}
    Awaiting Route data...
  {/if}
</section>