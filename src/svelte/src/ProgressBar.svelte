<script lang="ts">
  export let value: number = 0
  export let fullText: string = '100'
  const progress = value > 100 ? 100 : value
  let labelText = ''
  if (progress > 30 && progress < 100) {
    labelText = `${progress}%`
  } else if (progress === 100) {
    labelText = fullText
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

</style>

<div class="progress">
  <span
    class="value"
    style="--progress-value: {progress}%"
    data-label={labelText}
  ></span>
</div>
