<script lang="ts">
  import type { PastDeparture } from './FeasyInterfaces'
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
    justify-content: space-between;
    height: 4em;
  }
</style>

<li>
    <span class="start">{formatTime(departureTime)}</span>
    {#if arrived}
      <span class="percentComplete">100</span>
    {:else}
      <span class="percentComplete">{Math.round(percentComplete)}%</span>
    {/if}
    <span class="end">{formatTime(arrivalTime)}</span>
</li>

