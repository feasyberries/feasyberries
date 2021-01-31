<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { Port } from './utils/FeasyInterfaces';
  const dispatchEvent = createEventDispatcher()
  const portSelected = (selectedPort: Port) => {
    dispatchEvent('portSelected', selectedPort.code)
  }
  export let port: Port
  export let index: number

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
    height: calc(var(--baseline) * 10);
    margin: var(--baseline);
    align-items: center;
  }
  li.reversed {
    flex-direction: row-reverse;
  }
  .portCodeIcon {
    height: calc(var(--baseline) * 6);
    width: calc(var(--baseline) * 6);
    place-items: center;
    display: grid;
    background-color: var(--background-color-light);
    border-radius: 50%;
    border: var(--baseline) solid var(--primary-color);
    padding: var(--baseline);
  }
  .portCode {
    color: var(--dark-grey);
    font-weight: 600;
    transform: scaleY(2);
  }
  .portDetails {
    margin-left: calc(var(--baseline) * 4);
    margin-right: calc(var(--baseline) * 4);
    height: inherit;
  }
  .portName {
    margin-top: 0.55em;
    margin-bottom: 0;
    font-family: var(--serif-font);
    font-size: var(--medium-font-size);
    line-height: 1.3em;
    font-weight: 300;
  }
  .portTown {
    font-weight: 300;
    margin: 0;
    font-size: var(--small-font-size);
    line-height: var(--small-line-height);
  }
  .first {
    margin-top: auto;
  }
</style>

<li
  on:click={ _ => portSelected(port) }
  class:reversed={iconRight[port.code]}
  class:first={index === 0}
>
  <div class='portCodeIcon'>
    <span class='portCode'>{port.code}</span>
  </div>
  <div class='portDetails'>
    <p class='portName'>{portName}</p>
    <p class='portTown'>{portTown}</p>
  </div>
</li>
