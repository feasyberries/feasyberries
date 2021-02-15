<script lang="ts">
  export let time: number

  const date = new Date(time)
  const formattedTime = date.toLocaleTimeString(
    'en',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
  )
</script>

<style>
  .clock {
    border-radius: 0.25em;
    font-family: var(--sans-serif-font);
    font-weight: 600;
    color: var(--highlight-color);
    background-color: var(--primary-color);
    text-align: center;
    user-select: none;
    -webkit-user-select: none;
    white-space: nowrap;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .clocktext {
    line-height: 100%;
    display: inline-block;
  }

  @keyframes blinker {
    50% {
      opacity: 0;
    }
  }
</style>

<div class="clock">
  <time datetime={date.toISOString()} class="clocktext">{formattedTime}</time>
</div>
