<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatchEvent = createEventDispatcher()
  const backButton = (_e) => {
    dispatchEvent('backButton')
  }
</script>

<style>
  button {
    margin: 0
  }
</style>

<button class="backButton" on:click={backButton}>{`<`}</button>
