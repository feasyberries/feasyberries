<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { DestinationRoute, RoutesData } from './FeasyInterfaces';
  const dispatchEvent = createEventDispatcher()
  const portSelected = (selectedPort) => {
    dispatchEvent('portSelected', selectedPort)
  }
  export let port: RoutesData | DestinationRoute
  const splitIndex = port.name.indexOf('(')
  const portTown = port.name.slice(0, splitIndex - 1)
  const portName = port.name.slice(splitIndex + 1, -1)
  const iconRight = {
    'LNG': false,
    'HSB': true,
    'NAN': false,
    'DUK': false,
    'TSA': true,
    'SWB': false
  }
</script>

<style>
  li {
    display:flex;
    color: var(--primary-color);
    background-color: var(--light-primary);
    border-radius: 10px;
    height: 4em;
    margin: 0.5em;
    align-items: center;
  }
  li.reversed {
    flex-direction: row-reverse;
  }
  .portCodeIcon {
    height: 2.5em;
    width: 2.5em;
    place-items: center;
    display: grid;
    background-color: var(--background-color-light);
    border-radius: 50%;
    border: 0.3em solid var(--primary-color);
    padding: 0.5em;
  }
  .portCode {
    color: var(--dark-grey);
    font-weight: 600;
    transform: scaleY(2.5);
  }
  .portDetails {
    margin-left: 1em;
    margin-right: 1em;
    display: flex;
    flex-direction: column;
  }
  .portName {
    font-family: var(--serif-font);
    font-size: 1.5em;
  }
  .portTown {
    font-size: 0.75em;
  }
</style>

<li
  on:click={ _ => portSelected(port) }
  class:reversed="{iconRight[port.code]}"
>
  <div class='portCodeIcon'>
    <span class='portCode'>{port.code}</span>
  </div>
  <div class='portDetails'>
    <span class='portName'>{portName}</span>
    <span class='portTown'>{portTown}</span>
  </div>
</li>
