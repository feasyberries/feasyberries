<script lang='ts'>
  export let text: string
</script>

<style>
  .portCodeIcon {
    height: calc(var(--baseline) * 6);
    width: calc(var(--baseline) * 6);
    place-items: center;
    display: grid;
    background-color: var(--background-color-light);
    border-radius: 50%;
    border: var(--baseline) solid var(--primary-color);
    padding: var(--baseline);
    user-select: none;
  }
  .portCode {
    color: var(--dark-grey);
    font-weight: 600;
    transform: scaleY(2);
  }
</style>

<div class='portCodeIcon'>
  <span class='portCode'>{text}</span>
</div>
