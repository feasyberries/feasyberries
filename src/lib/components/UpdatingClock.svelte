<script lang="ts">
  import { onMount } from 'svelte';
  import Clock from './Clock.svelte';
  import { vancouverTime } from '$lib/utils/timeUtils';
  let time = vancouverTime();
  onMount(() => {
    const intervalId = setInterval(() => {
      time = vancouverTime();
    }, 10000);

    return () => clearInterval(intervalId);
  });
</script>

{#key time}
  <Clock time={time} />
{/key}
