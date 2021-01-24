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
  }

  header {
    font-size: var(--header-font-size);
    line-height: var(--header-line-height);
    text-align: center;
    font-family: var(--header-font);
  }

  ul {
    display: grid;
    align-content: end;
    list-style-type: none;
    padding: 0;
    margin: 0;
    background-image: url("/map.png");
    background-attachment: fixed;
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
  }
</style>

<section class="portList">
  <header>{title}</header>
  <ul>
    {#each sortedPorts as port}
      <PortListItem {port} on:portSelected/>
    {/each}
  </ul>
</section>