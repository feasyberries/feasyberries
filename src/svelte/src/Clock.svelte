<script lang="ts">
  export let time: number

  const formatTime = (time: number): string => {
    const date = new Date(time)
    return date.toLocaleTimeString(
      'en',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    )
  }
  const formattedTime = formatTime(time)
  const [hours, secondsAndMeridiem] = formattedTime.split(':')
</script>

<style>
  .clock {
    border-radius: 0.25em;
    width: 5em;
    font-family: var(--lcd-font);
    line-height: 1.45em;
    color: var(--secondary-color-a);
    background-color: var(--light-grey);
    text-align: center;
    display: inline-block;
    user-select: none;
    white-space: nowrap;
  }
  .blink {
    animation: blinker 1s step-start infinite;
  }

  @keyframes blinker {
    50% {
      opacity: 0;
    }
  }
</style>

<span class="clock">{hours}<span class="blink">:</span>{secondsAndMeridiem}</span>
