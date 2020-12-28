<script lang="ts">
  import BackButton from './BackButton.svelte'
  import PortListItem from './PortListItem.svelte'
  import { ports } from './utils/portsStore'
  import type { Port } from './utils/FeasyInterfaces'

  export let filter: string = ''
  export let title: string = ''
  export let backButton: boolean = false

  const portsSortOrder = ['LNG', 'HSB', 'NAN', 'DUK', 'TSA', 'SWB']
  const portsSort = (a:Port, b: Port): number =>
    portsSortOrder.indexOf(a.code) - portsSortOrder.indexOf(b.code)

  let sortedPorts: Port[] = []
  $: {
    if (filter) {
      sortedPorts = $ports.get(filter).destinationRoutes.sort(portsSort)
    } else {
      console.log('PortList#no filter sortem', $ports)
      let allRoutes = Array.from($ports.values()) as Port[]
      sortedPorts = allRoutes.sort(portsSort)
    }
  }
</script>

<style>
  .portList {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  header {
    font-size: var(--header-font-size);
    text-align: center;
    font-family: var(--display-font);
  }

  ul {
    display: grid;
    align-content: end;
    height: 100%;
    list-style-type: none;
    padding: 0;
    margin: 0;
    background-image: url("/map.png");
    background-size: auto 100%;
    background-position: center center;
    background-repeat: no-repeat;
  }
</style>

<section class="portList">
  <header>{title}</header>
  {#if backButton}
    <BackButton on:backButton />
  {/if}
  <ul>
    {#each sortedPorts as port}
      <PortListItem {port} on:portSelected/>
    {/each}
  </ul>
</section>