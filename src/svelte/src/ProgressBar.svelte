<script lang="ts">
  export let value: number = 0
  const progress = value > 100 ? 100 : value
</script>

<style>
/* progress {
  -webkit-appearance: none;
  appearance: none;
  border-radius: 2px;
  background-color: rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15) inset;
  border: none;
  height: 1em;
}

progress::-webkit-progress-bar {
  border-radius: 2px;
  background-color: rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15) inset;
  border: none;
}

progress::-webkit-progress-value {
  background-color: var(--primary-color);
  border-radius: 2px;
}

progress::-moz-progress-bar {
  background-color: var(--primary-color);
  border-radius: 2px;
} */

.progress {
  border-radius: 2px;
  background-color: rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15) inset;
  border: none;
  height: 1em;
  width: 100%;
  position: relative;
}

.progress .value:before {
  color: var(--dark-grey);
  content: attr(data-label);
  font-size: 0.8em;
  position: absolute;
  text-align: center;
  left: 0;
  right: 0;
  font-family: var(--sans-serif-font);
}

.progress .value {
  background-color: var(--primary-color);
  border-radius: 2px;
  display: inline-block;
  height: 100%;
  width: var(--progress-value, 0%);
  position: absolute;
  left: 0;
}

</style>

<div class="progress">
  <span
    class="value"
    style="--progress-value: {progress}%"
    data-label={value > 20 ? `${progress}%`: ''}
  ></span>
</div>
