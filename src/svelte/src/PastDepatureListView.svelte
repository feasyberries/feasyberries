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
    border-radius: 0.5em;
    height: 4em;
    margin: 0.5em;
    align-items: center;
    justify-content: space-between;
    height: 4em;
    width: 28em;
  }
  .departure, .arrival {
    display: flex;
    flex-direction: column;
    place-items: center;
    font-family: var(--serif-font);
  }
</style>

<li>
    <div class='departure'>
      Departed
      <Clock time={departureTime} />
    </div>
    <ProgressBar value={Math.round(percentComplete)} />
    <div class='arrival'>
      {arrived ? 'Arrived' : 'ETA'}
      <Clock time={arrivalTime} />
    </div>
</li>

