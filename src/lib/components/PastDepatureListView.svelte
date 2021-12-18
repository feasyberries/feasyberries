<script lang="ts">
  /** @typedef {import('../utils/feasyInterfaces').PastDeparture} PastDeparture */
  import Clock from './Clock.svelte';
  import ProgressBar from './ProgressBar.svelte';

  /** @type {PastDeparture} */
  export let departure;
  // departure = {time: number, status: {time: number, status: string}}

  const { time: departureTime, status: statusObj } = departure;
  const { time: arrivalTime, status: statusStr } = statusObj;
  const arrived = statusStr?.toUpperCase() === "ARRIVED";
  const nowStr = new Date().toLocaleString(
    "en-US",
    { timeZone: "America/Vancouver" }
  );
  const now = new Date(nowStr).getTime();
  const percentComplete =
    Math.round((now - departureTime) / (arrivalTime - departureTime) * 100);

  /** @param {number} time */
  const formatTime = (time) => {
    const date = new Date(time)
    return date.toLocaleTimeString(
      'en',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    )
  };
</script>

<style>
  li {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    color: var(--primary-color);
    background-color: var(--secondary-color);
    border-radius: var(--baseline);
    height: calc(var(--baseline) * 10);
    margin: var(--baseline);
    justify-content: space-between;
  }
  .departure, .arrival {
    margin: var(--baseline);
    text-align: center;
    font-size: var(--medium-font-size);
  }
  .progress {
    margin-top: calc(var(--baseline) * 2.5);
    flex: 0 1 33%;
    height: calc(var(--baseline) * 5);
    line-height: 2.1em;
  }
</style>

<li>
  <div class='departure'>
    <Clock time={departureTime} />
  </div>
  <div class='progress'>
    {#if percentComplete === 100}
      <span>Arrived</span>
    {:else}
      <ProgressBar value={Math.round(percentComplete)} fullText='Arrived' />
    {/if}
  </div>
  <div class='arrival'>
    <Clock time={arrivalTime} />
  </div>
</li>
