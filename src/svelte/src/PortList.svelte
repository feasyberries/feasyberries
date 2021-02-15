<script lang="ts">
  import { fly } from 'svelte/transition';
  import PortListItem from './PortListItem.svelte'
  import { ports } from './utils/portsStore'
  import scrollShadow from './utils/scrollShadow'

  import type { Port } from './utils/FeasyInterfaces'

  export let filter: string = ''
  export let iconSender: Function

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

{#if $ports.size}
  <ul use:scrollShadow transition:fly={{y: 500}}>
    {#each sortedPorts as port, index (port)}
      <PortListItem
        {iconSender}
        {port}
        {index}
        on:portSelected
      />
    {/each}
  </ul>
{:else}
  <ul></ul>
{/if}
