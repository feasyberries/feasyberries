
<script lang="ts">
  /** @typedef {import('./feasyInterfaces.d').FutureDeparture} FutureDeparture */

  import Clock from './Clock.svelte'
  import ProgressBar from './ProgressBar.svelte'
  import { createEventDispatcher } from 'svelte';

  /** @type {FutureDeparture} */
  export let departure

  const dispatchEvent = createEventDispatcher()

  const selectTime = (_) => {
    if (!departure.status.cancelled) {
      dispatchEvent('timeSelected', departure.time);
    }
  }
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
  .cancelled {
    background-color: #fac6c6;
  }
</style>

<li on:click={selectTime} class:cancelled={departure.status.cancelled}>
  <div class='departure'>
    <Clock time={departure.time} />
  </div>
  <div class='deckspace'>
      <span>
        Total:
        <span class='progress'>
          {#if (departure.status.cancelled)}
            <ProgressBar value={100} fullText="Cancelled" />
          {:else}
            <ProgressBar
              value={100 - departure.deckSpace.total}
              fullText="Full"
            />
          {/if}
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
