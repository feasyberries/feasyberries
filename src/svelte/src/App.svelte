<script lang="ts">
  import { crossfade } from 'svelte/transition'
  import BackButton from './BackButton.svelte'
  import PortIcon from './PortIcon.svelte'
  import PortList from './PortList.svelte'
  import RouteViewer from './RouteViewer.svelte'

  const [originSend, originReceive] = crossfade({
  })
  const [destinationSend, destinationReceive] = crossfade({
  })

  let originCode: string = ''
  let destinationCode: string = ''
  const onBackButton = (_e: CustomEvent) => {
    if (destinationCode) {
      destinationCode = ''
    } else {
      originCode = ''
    }
  }

  let title: string
  $: {
    if (originCode && destinationCode) {
      title = 'When?'
    } else if (originCode) {
      title = 'Destination?'
    } else {
      title = 'Origin?'
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

  .root {
    background-color: var(--background-color);
    font-family: var(--sans-serif-font);
    font-weight: 300;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
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
</style>

<div class="root">
  <header>
    Feasy Berries
  </header>
  <div class='titleContainer'>
    <div class='originIcon'>
      {#if originCode}
        <div in:originReceive|local={{key: originCode}}>
          <PortIcon text={originCode}/>
        </div>
      {/if}
    </div>
    <h1>{title}</h1>
    <div class='destinationIcon'>
      {#if destinationCode}
        <div in:destinationReceive|local={{key: destinationCode}}>
          <PortIcon text={destinationCode}/>
        </div>
      {/if}
    </div>
  </div>
  <main>
    {#if originCode && destinationCode}
      <RouteViewer {originCode} {destinationCode} />
    {:else if originCode}
      <PortList
        filter={originCode}
        iconSender={destinationSend}
        on:portSelected={(e) => destinationCode = e.detail}
      />
    {:else}
      <PortList
        iconSender={originSend}
        on:portSelected={(e) => originCode = e.detail}
      />
    {/if}
    {#if originCode || destinationCode}
      <BackButton on:backButton={onBackButton}/>
    {/if}
  </main>
</div>