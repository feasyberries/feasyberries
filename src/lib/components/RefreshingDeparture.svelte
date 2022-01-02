<script lang="ts">
  import Clock from './Clock.svelte'
  import StackedProgressBar from './StackedProgressBar.svelte'
  import RefreshIcon from './RefreshIcon.svelte';
  import { departureTimeHistoryStore } from '$lib/utils/currentRouteStore';
  const newestIndex = $departureTimeHistoryStore.length - 1;
  const { departure } = $departureTimeHistoryStore[newestIndex];
  let totalValues, mixedValues;
  $: {
    totalValues = $departureTimeHistoryStore.map(departureTime =>
      100 - departureTime.departure.deckSpace.total
    );
  }

  $:{
    mixedValues = $departureTimeHistoryStore.map(departureTime =>
      100 - (departureTime.departure.deckSpace.mixed || 0)
    );
  }
</script>

<style>
  li {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    color: var(--primary-color);
    background-color: var(--secondary-color);
    border-radius: var(--baseline);
    padding: var(--baseline);
    margin: var(--baseline);
    height: calc(var(--baseline) * 30);
    justify-content: space-between;
  }
  .departure {
    margin: var(--baseline);
    font-size: var(--medium-font-size);
    text-align: center;
  }
  .deckspace {
    /* height: inherit; */
    grid-column: 1 / span 2;
    display: grid;
    font-family: var(--serif-font);
    font-size: var(--medium-font-size);
    line-height: var(--medium-line-height);
    align-items: center;
    box-sizing: border-box;
    padding-right: 0.5em;
    padding-top: 0.2em;
  }
  .deckspace > span {
    display: grid;
    grid-template-columns: 1fr 5fr;
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
  <RefreshIcon />
  <div class='deckspace'>
    <span>
      Total:
      <span class='progress'>
        <StackedProgressBar
          values={totalValues}
          fullText="Full"
        />
      </span>
    </span>
    {#if Number.isInteger(departure.deckSpace.mixed)}
      <span>
        Mixed:
        <span class='progress'>
          <StackedProgressBar
            values={mixedValues}
            fullText="Full"
          />
        </span>
      </span>
    {/if}
  </div>
</li>
