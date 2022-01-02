<script lang="ts">
  /** @type {number} */
  export let values = [0];
  /** @type {string} */
  export let fullText = '100';

  const validatedValues = values.map(v => (v > 100) ? 100 : v).sort().reverse();

  const progress = [...new Set(validatedValues)];
  let labelText = '';
  if (progress[0] > 15 && progress[0] < 100) {
    labelText = `${progress[0]}%`;
  } else if (progress[0] === 100) {
    labelText = fullText;
  }
</script>

<style>
.progress {
  border-radius: 0.125em;
  background-color: rgba(0, 0, 0, 0.05);
  box-shadow: 0 0.125em 0.3125em rgba(0, 0, 0, 0.15) inset;
  border: none;
  width: 100%;
  position: relative;
  height: inherit;
}

.progress .value:before {
  color: var(--highlight-color);
  content: attr(data-label);
  font-size: var(--small-font-size);
  position: absolute;
  text-align: center;
  left: 0;
  right: 0;
  font-family: var(--sans-serif-font);
}

.progress .value {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 2px;
  display: inline-block;
  width: var(--progress-value, 0%);
  position: absolute;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.value.overlay {
  background-color: hsla(0, 0%, 0%, 0);
  border-right: 0.125em solid var(--highlight-color);
}
.value.overlay:before {
  content: none;
}
</style>

<div class="progress">
  {#each progress as progVal, i}
    {#if i == 0}
      <span
        class="value"
        style="--progress-value: {progVal}%"
        data-label={labelText}
      />
    {:else}
      <span
        class="value overlay"
        style="--progress-value: {progVal}%"
      />
    {/if}
  {/each}
</div>
