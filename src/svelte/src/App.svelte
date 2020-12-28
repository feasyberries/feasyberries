<script lang="ts">
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
    --display-font: 'Permanent Marker', cursive;
    --sans-serif-font: 'Poppins', sans-serif;
    --serif-font: 'Crete Round', serif;
    --lcd-font: 'lcd-clock', sans-serif;
    --baseline: 0.375em;
    --small-font-size: 0.75em; /*calc(--baseline * 2);      /* 0.75em */
    --medium-font-size: 1.5em; /* calc(--baseline * 4);     1.5em  */
    --header-font-size: 4.5em; /* calc(--baseline * 14) */  /* 5.25em */
  }

  header {
    background-color: var(--background-color-dark);
    color: var(--primary-color);
    font-family: var(--display-font);
    text-transform: uppercase;
    font-size: var(--header-font-size);
    text-align: center;
    margin: 0;
  }

  .root {
    font-family: var(--sans-serif-font);
    font-weight: 300;
    height: 100vh;
    width: 100vw;
    display: grid;
    grid-template-rows: 1fr 10fr;
    line-height: 1.4;
  }

  main {
    display: grid;
    place-items: center;
    background-color: var(--background-color-dark);
  }

  main section {
    height: 100%;
    width: 80%;
    border-radius: 0.15em;
    color: var(--dark-grey);
    background-color: var(--background-color-light);
  }
</style>

<div class="root">
  <header>
    Feasy Berries
  </header>
  <main>
    <section>
      {#if originCode && destinationCode}
        <RouteViewer {originCode} {destinationCode} on:backButton={onBackButton} />
      {:else if originCode}
        <PortList
          filter={originCode}
          title={'Destination?'}
          backButton
          on:portSelected={(e) => destinationCode = e.detail}
          on:backButton={onBackButton}
        />
      {:else}
        <PortList
          title={'Origin?'}
          on:portSelected={(e) => originCode = e.detail}
        />
      {/if}
    </section>
  </main>
</div>