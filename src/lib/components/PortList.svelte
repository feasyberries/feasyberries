<script lang="ts">
  /** @typedef {import('../utils/feasyInterfaces').Port} Port */

  import { fly } from 'svelte/transition';
  import PortListItem from './PortListItem.svelte';
  import ports from '../utils/portsStore';
  import scrollShadow from '../utils/scrollShadow';

  /** @type {string} */
  export let filter = '';

  /** @type {Function} */
  export let iconSender;
  const portsSortOrder = ['LNG', 'HSB', 'NAN', 'DUK', 'TSA', 'SWB'];

  /**
   * @param {Port} a
   * @param {Port} b
   * @returns {number}
   */
  const portsSort = (a, b) =>
    portsSortOrder.indexOf(a.code) - portsSortOrder.indexOf(b.code);

  /** @type {Port[]} */
  let sortedPorts = [];

  $: {
    if (filter) {
      sortedPorts = $ports.get(filter).destinationRoutes.sort(portsSort);
    } else {
      /** @type {Port[]} */
      let allRoutes = Array.from($ports.values());
      sortedPorts = allRoutes.sort(portsSort);
    }
  }
</script>

<style>
  ul {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    align-content: end;
    align-items: center;
    list-style-type: none;
    padding: 0;
    margin: 0;
    overflow-y: scroll;
    height: 100%;
  }
</style>

<ul use:scrollShadow transition:fly={{y: 500}}>
  {#if $ports.size}
    {#each sortedPorts as port, index (port)}
      <PortListItem
        {iconSender}
        {port}
        {index}
        on:portSelected
      />
    {/each}
  {/if}
</ul>
