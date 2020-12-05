<script lang="ts">
  import type { FutureDeparture } from './FeasyInterfaces'
  export let departure: FutureDeparture
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
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 4em;
  }

</style>

<li>
  <span class="depatureTime">{formatTime(departure.time)}</span>
  <span class="ferry" data-url={departure.ferry.url}>
    {departure.ferry.name}
  </span>
  <span
    class="deckSpace"
    data-standard-available={departure.deckSpace?.standard}
    data-mixed-available={departure.deckSpace?.mixed}
  >
    {departure.deckSpace.total}%
  </span>
</li>