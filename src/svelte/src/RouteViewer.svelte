<script lang="ts">
  import PastDepatureListView from './PastDepatureListView.svelte'
  import FutureDepartureListView from './FutureDepatureListView.svelte'
  import routeStaus from './utils/routeStatus'
  import scrollShadow from './utils/scrollShadow'
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
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .routes {
    display: flex;
    flex-direction: column;
    user-select: none;
    overflow-y: scroll;
    flex-basis: 0;
    flex-grow: 1;
    flex-shrink: 1;
  }
  .currentTime {
    margin-right: auto;
    margin-left: auto;
    margin-top: 0.08em;
    margin-bottom: 0;
    font-size: 0.9em;
  }
</style>

{#await routeStatusPromise}
  <section class="routes">
    <p>Awaiting Route data...</p>
  </section>
{:then routeStatus}
  <section class="routes" use:scrollShadow>
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
  </section>
{:catch error}
  <section class="routes">
    <p>Something went wrong: {error.message}</p>
  </section>
{/await}
