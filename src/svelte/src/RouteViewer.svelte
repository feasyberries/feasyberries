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
    display: flex;
    flex-direction: column;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  header {
    font-size: var(--header-font-size);
    text-align: center;
    font-family: var(--header-font);
    line-height: var(--header-line-height);
  }

  .routes {
    background-attachment: fixed;
    background-size: cover;
    background-image: url("/map.png");
    background-position: center center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    user-select: none;
  }
  .currentTime {
    margin-right: auto;
    margin-left: auto;
    margin-top: 0.08em;
    margin-bottom: 0;
    font-size: 0.9em;
  }
</style>

<section class="routeViewer">
  <header>When?</header>
  <section class="routes">
    {#await routeStatusPromise}
      <p>Awaiting Route data...</p>
    {:then routeStatus}
        <ul class="pastDepartures">
          {#each routeStatus.past as pastDeparture}
            <PastDepatureListView departure={pastDeparture} />
          {/each}
        </ul>
        <div class="currentTime">
          <Clock time={now}/>
        </div>
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