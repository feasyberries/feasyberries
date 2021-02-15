<script lang="ts">
  import Clock from './Clock.svelte'
  import ProgressBar from './ProgressBar.svelte'
  import type { FutureDeparture } from './utils/FeasyInterfaces'
  export let departure: FutureDeparture
</script>

<style>
  li {
    display: grid;
    grid-template-columns: 1fr 2fr;
    color: var(--primary-color);
    background-color: var(--secondary-color);
    border-radius: var(--baseline);
    margin: var(--baseline);
    height: calc(var(--baseline) * 10);
    justify-content: space-between;
  }
  .departure {
    margin: var(--baseline);
    font-size: var(--medium-font-size);
    text-align: center;
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
  }
  .deckspace > span {
    display: grid;
    grid-template-columns: 1fr 3fr;
    text-align: end;
    margin-left: 0.25em;
  }
  .progress {
    height: 100%;
    width: 100%;
  }
</style>

<li>
  <div class='departure'>
    <Clock time={departure.time} />
  </div>
  <div class='deckspace'>
      <span>
        Total:
        <span class='progress'>
          <ProgressBar
            value={100 - departure.deckSpace.total}
            fullText="Full"
          />
        </span>
      </span>
    {#if Number.isInteger(departure.deckSpace.mixed)}
      <span>
        Mixed:
        <span class='progress'>
          <ProgressBar
            value={100 - (departure.deckSpace.mixed || 0) }
            fullText="Full"
          />
        </span>
      </span>
    {/if}
  </div>
</li>