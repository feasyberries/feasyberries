<script lang="ts">
  import BackButton from './BackButton.svelte'
  import PortList from './PortList.svelte'
  import RouteViewer from './RouteViewer.svelte'

  let originCode: string
  let destinationCode: string
  const onBackButton = (_e: CustomEvent) => {
    if (destinationCode) {
      destinationCode = ''
    } else {
      originCode = ''
    }
  }
</script>

<style>
  :global(:root) {
    --primary-color: #A5A1E0;
    --secondary-color-a: #E0CEAD;
    --secondary-color-b: #8B945C;
    --tertiary-color-a: #948A79;
    --tertiary-color-b: #D5E096;
    --light-primary:rgb(237,236,249);
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
    --medium-font-size: 1.18725em; /*calc(--small-font-size * 1.583);*/
    --medium-line-height: 1.97375em; /* calc(--small-line-height * 1.579); */
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
    font-size: var(--header-font-size);
    line-height: var(--header-line-height);
    text-align: center;
    font-family: var(--header-font);
    margin: 0;
    background-color: var(--background-color-light);
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
</style>

<div class="root">
  <header>
    Feasy Berries
  </header>
  <main>
    {#if originCode && destinationCode}
      <h1>When?</h1>
      <RouteViewer {originCode} {destinationCode} />
    {:else if originCode}
      <h1>Destination?</h1>
      <PortList
        filter={originCode}
        on:portSelected={(e) => destinationCode = e.detail}
      />
    {:else}
      <h1>Origin?</h1>
      <PortList on:portSelected={(e) => originCode = e.detail} />
    {/if}
    {#if originCode || destinationCode}
      <BackButton on:backButton={onBackButton}/>
    {/if}
  </main>
</div>