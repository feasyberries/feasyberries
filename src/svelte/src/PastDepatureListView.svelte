<script lang="ts">
  import Clock from './Clock.svelte'
import ProgressBar from './ProgressBar.svelte'
import type { PastDeparture } from './utils/FeasyInterfaces'
  export let departure: PastDeparture
  // departure = {time: number, status: {time: number, status: string}}
  const { time: departureTime, status: statusObj } = departure
  const { time: arrivalTime, status: statusStr } = statusObj
  const arrived = statusStr?.toUpperCase() === "ARRIVED"
  const nowStr = new Date().toLocaleString(
    "en-US",
    { timeZone: "America/Vancouver" }
  )
  const now = new Date(nowStr).getTime()
  const percentComplete =
    (now - departureTime) / (arrivalTime - departureTime) * 100

  console.log(`departureTime:${departureTime}, now:${now}, arrivalTime:${arrivalTime}, percentComplete:${percentComplete}`)
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
    flex-direction: row;
    color: var(--primary-color);
    background-color: var(--light-primary);
    border-radius: var(--baseline);
    height: calc(var(--baseline) * 8);
    margin: var(--baseline);
    justify-content: space-between;
  }
  .departure, .arrival {
    padding: 0.5em;
    font-family: var(--serif-font);
    font-size: var(--small-font-size);
    line-height: var(--small-line-height);
    height: inherit;
    text-align: center;
    box-sizing: border-box;
  }
  p {
    margin: 0 0 0.2em 0;
  }
  .progress {
    margin-top: calc(var(--baseline) * 2);
    flex: 0 1 33%;
    height: 1.5em;
    line-height: 2.1em;
  }
</style>

<li>
    <div class='departure'>
      <p>Departed</p>
      <Clock time={departureTime} />
    </div>
    <div class='progress'>
      <ProgressBar value={Math.round(percentComplete)} />
    </div>
    <div class='arrival'>
      <p>{arrived ? 'Arrived' : 'ETA'}</p>
      <Clock time={arrivalTime} />
    </div>
</li>

