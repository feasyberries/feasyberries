<script lang="ts">
  import { formatTime } from '$lib/utils/timeUtils';

  /** @type {number} */
  export let time;

  const date = new Date(time);
  const formattedTime = formatTime(time);
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
