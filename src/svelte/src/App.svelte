<script lang="ts">
  import BackButton from './BackButton.svelte'
  import PortIcon from './PortIcon.svelte'
  import PortList from './PortList.svelte'
  import RouteViewer from './RouteViewer.svelte'

  let originCode: string = ''
  let destinationCode: string = ''
  const onBackButton = (_e: CustomEvent) => {
    if (destinationCode) {
      destinationCode = ''
    } else {
      originCode = ''
    }
  }

  let title
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
    --primary-color: #6545a4;
    --secondary-color-a: #ead062;
    --secondary-color-b: #8B945C;
    --tertiary-color-a: #948A79;
    --tertiary-color-b: #D5E096;
    --light-primary: #e7daff;
    --background-color-dark: rgb(235,241,244);
    --background-color-light: rgb(255,255,255);
    --light-grey: rgb(135,152,173);
    --dark-grey: rgb(46,56,77);
    --header-font: 'Permanent Marker', cursive;
    --sans-serif-font: 'Poppins', sans-serif;
    --serif-font: 'Crete Round', serif;
    --lcd-font: 'lcd-clock', sans-serif;
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
    text-align: center;
    margin: 0;
  }

  .root {
    background-color: var(--background-color-dark);
    font-family: var(--sans-serif-font);
    font-weight: 300;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  h1 {
    font-size: var(--other-font-size);
    line-height: var(--header-line-height);
    text-align: center;
    font-family: var(--header-font);
    margin: 0;
  }

  main {
    width: 90%;
    margin: 0 auto;
    border-radius: 0.15em;
    color: var(--dark-grey);
    background-color: var(--background-color-light);
    display: flex;
    flex-direction: column;
    flex-basis: 100%;
    background-attachment: fixed;
    background-size: cover;
    background-image: url("/map.png");
    background-position: center center;
    background-repeat: no-repeat;
  }

  :global(.scroll-shadow:before) {
    content:'';
    display:block;
    position:absolute;
    width: 90%;
    height: 2em;
    transition: opacity 100ms linear;
    box-shadow: 0 1em 1.5em -1.5em black inset;
    opacity: 0;
  }

  :global(.scroll-shadow:after) {
    content:'';
    display:block;
    position:absolute;
    width: 90%;
    height: 2em;
    bottom: 0;
    /* transform: scaleY(-1); */
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
    display:flex;
    justify-content: space-between;
    background-color: var(--background-color-light);
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
  <main>
    <div class='titleContainer'>
      <div class='originIcon'>
        {#if originCode}
          <PortIcon text={originCode}/>
        {/if}
      </div>
      <h1>{title}</h1>
      <div class='destinationIcon'>
        {#if destinationCode}
          <PortIcon text={destinationCode}/>
        {/if}
      </div>
    </div>
    {#if originCode && destinationCode}
      <RouteViewer {originCode} {destinationCode} />
    {:else if originCode}
      <PortList
        filter={originCode}
        on:portSelected={(e) => destinationCode = e.detail}
      />
    {:else}
      <PortList on:portSelected={(e) => originCode = e.detail} />
    {/if}
    {#if originCode || destinationCode}
      <BackButton on:backButton={onBackButton}/>
    {/if}
  </main>
</div>