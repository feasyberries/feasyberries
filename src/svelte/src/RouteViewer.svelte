<script lang="ts">
  import BackButton from './BackButton.svelte'
  import PastDepatureListView from './PastDepatureListView.svelte'
  import FutureDepartureListView from './FutureDepatureListView.svelte'
  import routeStaus from './utils/routeStatus'
import Clock from './Clock.svelte'

  export let originCode: string
  export let destinationCode: string
  let routeStatusPromise = routeStaus(originCode, destinationCode)
  const nowStr = new Date().toLocaleString(
    "en-US",
    { timeZone: "America/Vancouver" }
  )
  const now = new Date(nowStr).getTime()
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
    font-size: var(--header-font-size);
    text-align: center;
    font-family: var(--display-font);
  }

  .routes {
    height: 100%;
    background-image: url("/map.png");
    background-size: auto 100%;
    background-position: center center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    align-items: center;
    user-select: none;
  }
</style>

<section class="routeViewer">
  <header>When?</header>
  <BackButton on:backButton />
  <section class="routes">
    {#await routeStatusPromise}
      <p>Awaiting Route data...</p>
    {:then routeStatus}
        <ul class="pastDepartures">
          {#each routeStatus.past as pastDeparture}
            <PastDepatureListView departure={pastDeparture} />
          {/each}
        </ul>
          <Clock time={now}/>
        <ul class="futureDepartures">
          {#each routeStatus.future as futureDeparture}
            <FutureDepartureListView departure={futureDeparture} />
          {/each}
        </ul>
    {:catch error}
      <p>Something went wrong: {error.message}</p>
    {/await}
  </section>
</section>