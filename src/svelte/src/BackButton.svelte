<script lang="ts">
  import { fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import PortIcon from "./PortIcon.svelte"
  const dispatchEvent = createEventDispatcher()
  const backButton = (_: Event) => {
    dispatchEvent('backButton')
  }
</script>

<style>
  div {
    position: absolute;
    left:calc(var(--baseline) * -3);
    bottom: calc(var(--baseline) * 6.5);
  }
</style>

<div transition:fly={{x: -100}} on:click={backButton}>
  <PortIcon text="<" />
</div>
