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
    display: flex;
    color: var(--primary-color);
    background-color: var(--light-primary);
    border-radius: var(--baseline);
    margin: var(--baseline);
    height: calc(var(--baseline) * 8);
    justify-content: space-between;
  }
  .departure {
    padding: 0.5em;
    font-family: var(--serif-font);
    font-size: var(--small-font-size);
    line-height: var(--small-line-height);
    height: inherit;
    text-align: center;
    box-sizing: border-box;
  }
  .deckspace {
    height: inherit;
    display: grid;
    font-family: var(--serif-font);
    font-size: var(--small-font-size);
    line-height: var(--small-line-height);
    align-items: center;
    box-sizing: border-box;
    padding-right: 0.5em;
    padding-top: 0.2em;
    width: 70%;
  }
  .deckspace > span {
    display: grid;
    grid-template-columns: 1fr 3fr;
    text-align: end;
    margin-left: 0.25em;
  }
  p {
    margin: 0 0 0.2em 0;
  }
  .progress {
    height: 100%;
    width: 100%;
  }
</style>

<li>
  <div class='departure'>
    <p>Departs</p>
    <Clock time={departure.time} />
  </div>
  <div class='deckspace'>
      <span>
        Total:
        <span class='progress'>
          <ProgressBar value={100 - departure.status.percentAvailable} />
        </span>
      </span>
    {#if departure.deckSpace.mixed}
      <span>
        Mixed:
        <span class='progress'>
          <ProgressBar value={100 - departure.deckSpace.mixed} />
        </span>
      </span>
    {/if}
  </div>
</li>