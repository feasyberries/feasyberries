<script lang="ts">
  import { blur, crossfade } from 'svelte/transition';
  import BackButton from './BackButton.svelte';
  import PortIcon from './PortIcon.svelte';
  import PortList from './PortList.svelte';
  import RouteViewer from './RouteViewer.svelte';
  import feasyStateMachine from '$lib/utils/feasyStateMachine';
  import { originCode, destinationCode, departureTime } from '$lib/utils/userInputStore';
  import CircleSpinner from './CircleSpinner.svelte';

  const [originSend, originReceive] = crossfade({duration: 150});
  const [destinationSend, destinationReceive] = crossfade({duration: 150});

  /** @param {CustomEvent} _event */
  const onBackButton = (_event) => {
    feasyStateMachine.back();
  };

  /** @param {CustomEvent} _event */
  const setOriginCode = (event) => {
    const newOriginCode = event.detail;
    originCode.set(newOriginCode);
    feasyStateMachine.originSelected();
  };

  /** @param {CustomEvent} _event */
  const setDesitationCode = (event) => {
    const newDestinationCode = event.detail;
    destinationCode.set(newDestinationCode);
    feasyStateMachine.destinationSelected();
  };

  /** @param {CustomEvent} _event */
  const setDepartureTime = (event) => {
    if ($feasyStateMachine == "awaitTime") {
      const newTime = event.detail;
      departureTime.set(newTime);
      feasyStateMachine.timeSelected();
    }
  };

  /** @type {string} */
  let title = 'Origin?';

  $: {
    switch ($feasyStateMachine) {
      case 'loadPortList' || 'awaitOrigin':
        title = 'Origin?';
        break;
      case 'awaitDestination':
        title = 'Destination?';
        break;
      case 'loadTimeTable' || 'awaitTime':
        title = 'When?';
        break;
    }
  }
</script>

<style>
  :global(:root) {
    --primary-color: #465075;
    --secondary-color: #c6cffa;
    --highlight-color: #d3a518;
    --background-color: #f1f1e6;
    --white: #fff;
    --grey: rgb(221, 221, 221);
    --header-font: 'Permanent Marker', cursive;
    --sans-serif-font: 'Poppins', sans-serif;
    --serif-font: 'Crete Round', serif;
    --baseline: 0.375em;
    --small-font-size: 0.75em; /*calc(--baseline * 2);      /* 0.75em */
    --small-line-height: 1.25em;
    --smedium-font-size: 0.9375em;
    --smedium-line-height: 1.5em;
    --medium-font-size: 1.18725em; /*calc(--small-font-size * 1.583);*/
    --medium-line-height: 1.97375em; /* calc(--small-line-height * 1.579); */
    --other-font-size: 1.5625em;
    --header-line-height: 1.935em; /* calc(--small-line-height * 1.548); */
    --header-font-size: 1.93725em; /* calc(--small-font-size * 2.583); */
  }

  header {
    color: var(--primary-color);
    font-family: var(--header-font);
    text-transform: uppercase;
    font-size: var(--header-font-size);
    line-height: var(--header-line-height);
    text-shadow: 2px 2px 0 var(--highlight-color);
    text-align: center;
    margin: 0;
  }

  h1 {
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: var(--other-font-size);
    line-height: var(--header-line-height);
    text-align: center;
    font-family: var(--header-font);
    margin: 0;
  }

  main {
    margin: 0 auto;
    border-radius: 0.15em;
    color: var(--primary-color);
    background-color: var(--background-color);
    display: flex;
    flex-direction: column;
    flex-basis: 100%;
    width: 100%;
  }

  :global(.scroll-shadow:before) {
    content:'';
    display:block;
    position:absolute;
    height: 2em;
    width: 100%;
    transition: opacity 100ms linear;
    box-shadow: 0 1em 1.5em -1.5em black inset;
    opacity: 0;
  }

  :global(.scroll-shadow:after) {
    content:'';
    display:block;
    position:absolute;
    height: 2em;
    width: 100%;
    bottom: 0;
    transition: opacity 100ms linear;
    box-shadow: 0 -1em 1em -1em black inset;
    opacity: 0;
  }

  :global(.scroll-shadow-top:before) {
    opacity: 1;
  }

  :global(.scroll-shadow-bottom:after) {
    opacity: 1;
  }

  :global(html) {
    height: 100%;
  }

  :global(body) {
    height: 100%;
    margin: 0;
  }

  .titleContainer {
    height: calc(var(--baseline) * 10);
    flex-shrink: 0;
    color: var(--primary-color);
    display:flex;
    justify-content: space-between;
    background-color: white;
  }

  .originIcon, .destinationIcon {
    min-width: calc(var(--baseline) * 10);
  }

  .originIcon {
    margin-left: var(--baseline);
  }

  .destinationIcon {
    margin-right: var(--baseline);
  }
  .spinnerContainer {
    position: absolute;
    top: 40%;
    left: calc(50% - 30px)
  }
</style>

<header>
  Feasy Berries
</header>
<div class='titleContainer'>
  <div class='originIcon'>
    {#if !['loadPortList', 'awaitOrigin'].includes($feasyStateMachine)}
      <div in:originReceive|local={{key: $originCode}}>
        <PortIcon text={$originCode}/>
      </div>
    {/if}
  </div>
  <h1>{title}</h1>
  <div class='destinationIcon'>
    {#if !['loadPortList', 'awaitOrigin', 'awaitDestination'].includes($feasyStateMachine)}
      <div in:destinationReceive|local={{key: $destinationCode}}>
        <PortIcon text={$destinationCode}/>
      </div>
    {/if}
  </div>
</div>
<main>
  { #if ['loadPortList', 'loadTimetable'].includes($feasyStateMachine)}
    <div
      class='spinnerContainer'
      in:blur={{duration: 200}}
      out:blur={{duration: 100}}
    >
      <CircleSpinner size={60}/>
    </div>
  { :else if $feasyStateMachine == 'awaitOrigin' }
    <PortList
      iconSender={originSend}
      on:portSelected={setOriginCode}
    />
  { :else if $feasyStateMachine == 'awaitDestination' }
    <PortList
      filter={$originCode}
      iconSender={destinationSend}
      on:portSelected={setDesitationCode}
    />
  { :else if ['awaitTime', 'awaitExpiry', 'loadRefresh'].includes($feasyStateMachine) }
    <RouteViewer on:timeSelected={setDepartureTime} />
  { /if }
  {#if ['awaitDestination', 'awaitTime', 'awaitExpiry'].includes($feasyStateMachine)}
    <BackButton on:backButton={onBackButton}/>
  {/if}
</main>
