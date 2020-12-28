<script lang="ts">
  import Clock from './Clock.svelte'
import ProgressBar from './ProgressBar.svelte'
  import type { FutureDeparture } from './utils/FeasyInterfaces'
  export let departure: FutureDeparture
  console.log(`FutureDeparture`, departure)
  // departure = {
  //   time: number,
  //   status: {
  //     percentAvailable: number
  //   },
  //   ferry: {
  //     name: string,
  //     url: string
  //   },
  //   deckSpace: {
  //     total: number,
  //     standard: number,
  //     mixed: number
  //   }
  // }

  const formatTime = (time: number): string => {
    const date = new Date(time)
    return date.toLocaleTimeString(
      'en',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    )
  }

</script>

<style>
  li {
    display: grid;
    grid-template-columns: 1fr 3fr;
    color: var(--primary-color);
    background-color: var(--light-primary);
    border-radius: 0.5em;
    align-items: center;
    margin: 0.5em;
    height: 4em;
    width: 28em;
  }
  .departure {
    display: flex;
    flex-direction: column;
    place-items: center;
    font-family: var(--serif-font);
  }
  .deckspace {
    display: grid;
    font-family: var(--serif-font);
    font-size: 1em;
    align-items: center;
    justify-items: stretch;
  }
  .deckspace > span {
    display: grid;
    grid-template-columns: 1fr 3fr;
    text-align: end;
    margin: 0.25em;
  }
</style>

<li>
  <div class='departure'>
    Departs
    <Clock time={departure.time} />
  </div>
  <div class='deckspace'>
      <span>Total: <ProgressBar value={100 - departure.status.percentAvailable} /></span>
    {#if departure.deckSpace.mixed}
      <span>Mixed: <ProgressBar value={100 - departure.deckSpace.mixed} /></span>
    {/if}
  </div>

  <!-- <span class="ferry" data-url={departure.ferry.url}>
    {departure.ferry.name}
  </span> -->
  <!-- <span
    class="deckSpace"
    data-standard-available={departure.deckSpace?.standard}
    data-mixed-available={departure.deckSpace?.mixed}
  >
    {departure.deckSpace.total || departure.status.percentAvailable}%
  </span> -->
</li>