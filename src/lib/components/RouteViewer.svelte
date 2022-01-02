<script lang="ts">
  import PastDepatureListView from './PastDepatureListView.svelte';
  import FutureDepartureListView from './FutureDepatureListView.svelte';
  import scrollShadow from '../utils/scrollShadow';
  import UpdatingClock from './UpdatingClock.svelte';
  import { fly } from 'svelte/transition';
  import { currentRouteStore } from '$lib/utils/currentRouteStore';
  import RefreshingDeparture from './RefreshingDeparture.svelte';
  import { departureTime } from '$lib/utils/userInputStore';

  /** @type {number} */

  /** @type {HTMLElement} */
  let section;

  const scrollToNow = () => {
    /** @type {HTMLElement} */
    const pastDepartures = section.querySelector('.pastDepartures');
    if (pastDepartures) {
      const listItems = pastDepartures.children;
      /** @type {HTMLElement} */
      const firstListItem = listItems.item(0);
      const listItemHeight = firstListItem.offsetHeight;
      const pastDeparturesBottom = pastDepartures.offsetHeight;
      const scrollToNowPos = pastDeparturesBottom - (listItemHeight * 2);
      section.scroll({
        top: scrollToNowPos,
      });
    }
  };
</script>

<style>
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .routes {
    display: flex;
    flex-direction: column;
    user-select: none;
    -webkit-user-select: none;
    overflow-y: scroll;
    flex-basis: 0;
    flex-grow: 1;
  }
  .currentTime {
    height: calc(4 * var(--baseline));
    margin-top: 0.08em;
    margin-bottom: 0;
    width: 90%;
    text-align: center;
    flex-shrink: 0;
    font-size: var(--medium-font-size);
    margin: 0 auto;
  }
</style>

<section
  class="routes"
  bind:this={section}
  use:scrollShadow
  on:introstart={scrollToNow}
  transition:fly={{y: 500}}
>
  <ul class="pastDepartures" >
    {#each $currentRouteStore.past as pastDeparture}
      <PastDepatureListView departure={pastDeparture} />
    {/each}
  </ul>
  <div class="currentTime">
    <UpdatingClock />
  </div>
  <ul class="futureDepartures">
    {#each $currentRouteStore.future as futureDeparture}
      {#if futureDeparture.time == $departureTime}
        <RefreshingDeparture />
      {:else}
        <FutureDepartureListView departure={futureDeparture} on:timeSelected />
      {/if}
    {/each}
  </ul>
</section>
