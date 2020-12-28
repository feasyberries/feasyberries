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
    padding-right: 1em;
    margin-right: 1em;
    margin-left: 1em;
    border-radius: 0.25em;
    width: 5em;
    font-family: var(--lcd-font);
    color: var(--secondary-color-a);
    background-color: var(--light-grey);
    text-align: right;
    display: inline-block;
    user-select: none;
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
