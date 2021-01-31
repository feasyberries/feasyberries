<script lang="ts">
  import { fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  const dispatchEvent = createEventDispatcher()
  const backButton = (_: Event) => {
    dispatchEvent('backButton')
    console.log('back')
  }
</script>

<style>
  div {
    position: absolute;
    left:calc(var(--baseline) * -3);
    bottom: calc(var(--baseline) * 6.5);
    height: calc(var(--baseline) * 6);
    width: calc(var(--baseline) * 6);
    place-items: center;
    display: grid;
    background-color: var(--background-color-light);
    border-radius: 50%;
    border: var(--baseline) solid var(--primary-color);
    padding: var(--baseline);
  }
  span {
    color: var(--dark-grey);
    font-weight: 600;
    transform: scaleY(2);
  }
</style>

<div transition:fly={{x: -100}} on:click={backButton}>
  <span>{`<`}</span>
</div>
