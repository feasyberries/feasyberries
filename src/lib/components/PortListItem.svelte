<script lang="ts">
  /** @typedef {import('../utils/feasyInterfaces').Port} Port */

  import { createEventDispatcher } from 'svelte';
  import PortIcon from './PortIcon.svelte';

  const dispatchEvent = createEventDispatcher();
  /** @param {Port} selectedPort */
  const portSelected = (selectedPort) => {
    dispatchEvent('portSelected', selectedPort.code)
  };

  /** @type {Port} */
  export let port;
  /** @type {number} */
  export let index;
  /** @type {Function} */
  export let iconSender;

  let showIcon = true;

  const splitIndex = port.name.indexOf('(');
  const portTown = port.name.slice(0, splitIndex - 1);
  const portName = port.name.slice(splitIndex + 1, -1);
  const iconRight = {
    'LNG': false,
    'HSB': true,
    'NAN': false,
    'DUK': false,
    'TSA': true,
    'SWB': false
  };

  /** @param {Event} _ */
  const clickHandler = (_) => {
    showIcon = false;
    portSelected(port);
  }
</script>

<style>
  li {
    display:flex;
    color: var(--primary-color);
    background-color: var(--secondary-color);
    border-radius: 10px;
    height: calc(var(--baseline) * 10);
    min-height: calc(var(--baseline) * 10);
    margin: var(--baseline);
    align-items: center;
    width: 90%;
  }
  li.reversed {
    flex-direction: row-reverse;
  }

  .portDetails {
    margin-left: calc(var(--baseline) * 3);
    margin-right: calc(var(--baseline) * 3);
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
  on:click={clickHandler}
  class:reversed={iconRight[port.code]}
  class:first={index === 0}
>
  {#if showIcon}
    <div out:iconSender|local={{key: port.code}}>
      <PortIcon text={port.code}/>
    </div>
  {/if}
  <div class='portDetails'>
    <p class='portName'>{portName}</p>
    <p class='portTown'>{portTown}</p>
  </div>
</li>
