<script lang='ts'>
  // taken from:
  // https://github.com/Schum123/svelte-loading-spinners/blob/12f187e2c3290ad1d3db30403a8bdb1d33828c82/src/Circle.svelte
  export let size = 60;
  export let unit = "px";
  export let duration = "0.75s";
</script>
<style>
  .circle {
    height: var(--size);
    width: var(--size);
    border-color: var(--primary-color) transparent var(--primary-color) var(--primary-color);
    border-width: calc(var(--size) / 15);
    border-style: solid;
    border-image: initial;
    border-radius: 50%;
    animation: var(--duration) linear 0s infinite normal none running rotate;
  }
  @keyframes rotate {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
<div class="circle" style="--size: {size}{unit}; --duration: {duration}"></div>