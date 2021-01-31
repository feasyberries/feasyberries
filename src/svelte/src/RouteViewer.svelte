<script lang="ts">
  import PastDepatureListView from './PastDepatureListView.svelte'
  import FutureDepartureListView from './FutureDepatureListView.svelte'
  import routeStaus from './utils/routeStatus'
  import scrollShadow from './utils/scrollShadow'
  import Clock from './Clock.svelte'
  import { fly } from 'svelte/transition'
  import CircleSpinner from './CircleSpinner.svelte'

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
    text-align: center;
    margin-top: 0.08em;
    margin-bottom: 0;
    font-size: 0.9em;
  }
  .spinnerContainer {
    position: absolute;
    top: 40%;
    left: calc(50% - 30px)
  }
</style>
<section class="routes" use:scrollShadow>
  {#await routeStatusPromise}
    <div class='spinnerContainer'>
      <CircleSpinner size={60}/>
    </div>
  {:then routeStatus}
    <div transition:fly={{y: 500}}>
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
    </div>
  {:catch error}
    <p>Something went wrong: {error.message}</p>
  {/await}
</section>
