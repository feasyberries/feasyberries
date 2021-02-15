<script lang="ts">
  import PastDepatureListView from './PastDepatureListView.svelte'
  import FutureDepartureListView from './FutureDepatureListView.svelte'
  import routeStaus from './utils/routeStatus'
  import scrollShadow from './utils/scrollShadow'
  import Clock from './Clock.svelte'
  import { blur, fly } from 'svelte/transition'
  import CircleSpinner from './CircleSpinner.svelte'

  export let originCode: string
  export let destinationCode: string
  let routeStatusPromise = routeStaus(originCode, destinationCode)
  const nowStr = new Date().toLocaleString(
    "en-US",
    { timeZone: "America/Vancouver" }
  )
  const now = new Date(nowStr).getTime()
  let section: HTMLElement
  const scrollToNow = () => {
    const pastDepartures = section.querySelector('.pastDepartures') as HTMLElement
    if (pastDepartures) {
      const listItems = pastDepartures.children
      const firstListItem = listItems.item(0) as HTMLElement
      const listItemHeight = firstListItem.offsetHeight
      const pastDeparturesBottom = pastDepartures.offsetHeight
      const scrollToNowPos = pastDeparturesBottom - (listItemHeight * 2)
      section.scroll({
        top: scrollToNowPos,
      })
    }
  }
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
    -webkit-user-select: none;
    overflow-y: scroll;
    flex-basis: 0;
    flex-grow: 1;
  }
  .currentTime {
    height: calc(4 * var(--baseline));
    margin-top: 0.08em;
    margin-bottom: 0;
    width: 90%;
    text-align: center;
    flex-shrink: 0;
    font-size: var(--medium-font-size);
    margin: 0 auto;
  }
  .spinnerContainer {
    position: absolute;
    top: 40%;
    left: calc(50% - 30px)
  }
</style>
{#await routeStatusPromise}
  <div
    class='spinnerContainer'
    in:blur={{duration: 200}}
    out:blur={{duration:100}}
  >
    <CircleSpinner size={60}/>
  </div>
{:then routeStatus}
  <section
    class="routes"
    use:scrollShadow
    bind:this={section}
    on:introstart={scrollToNow}
    transition:fly={{y: 500}}
  >
    <ul class="pastDepartures" >
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
  <p>Something went wrong: {error.message}</p>
{/await}
