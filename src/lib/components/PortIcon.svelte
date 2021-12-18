<script lang='ts'>
  /** @type {string} */
  export let text;
</script>

<style>
  .portCodeIcon {
    height: calc(var(--baseline) * 6);
    width: calc(var(--baseline) * 6);
    place-items: center;
    display: grid;
    background-color: var(--background-color);
    border-radius: 50%;
    border: var(--baseline) solid var(--highlight-color);
    padding: var(--baseline);
    user-select: none;
    -webkit-user-select: none;
  }
  .portCode {
    color: var(--primary-color);
    font-weight: 600;
    transform: scaleY(2);
  }
</style>

<div class='portCodeIcon'>
  <span class='portCode'>{text}</span>
</div>
