<script lang="ts">
  import { fly } from 'svelte/transition';
  import PortListItem from './PortListItem.svelte'
  import { ports } from './utils/portsStore'
  import scrollShadow from './utils/scrollShadow'

  import type { Port } from './utils/FeasyInterfaces'

  export let filter: string = ''

  const portsSortOrder = ['LNG', 'HSB', 'NAN', 'DUK', 'TSA', 'SWB']
  const portsSort = (a:Port, b: Port): number =>
    portsSortOrder.indexOf(a.code) - portsSortOrder.indexOf(b.code)

  let sortedPorts: Port[] = []
  $: {
    if (filter) {
      sortedPorts = $ports.get(filter).destinationRoutes.sort(portsSort)
    } else {
      let allRoutes = Array.from($ports.values()) as Port[]
      sortedPorts = allRoutes.sort(portsSort)
    }
  }
</script>

<style>
  ul {
    display: flex;
    flex-direction: column;
    align-content: end;
    list-style-type: none;
    padding: 0;
    margin: 0;
    flex-basis: 0;
    flex-grow: 1;
    flex-shrink: 1;
    overflow-y: scroll;
  }
</style>

{#if $ports.size}
  <ul use:scrollShadow transition:fly={{y: 500}}>
    {#each sortedPorts as port, index (port)}
      <PortListItem
        {port}
        {index}
        on:portSelected
      />
    {/each}
  </ul>
{:else}
  <ul></ul>
{/if}
