<script lang="ts">
  import { countdownStore } from '$lib/utils/countdownStore';

  const maxPercent = 30;
  const radius = 40;
  const circumference = Math.PI * (radius * 2);
  let percentFill;
  $: {
    percentFill = ($countdownStore > 0)
      ? circumference * (1 - ($countdownStore / maxPercent))
      : circumference / 2;
  }
</script>

<style>
  .refreshIcon {
    height: calc(var(--baseline) * 13);
    width: calc(var(--baseline) * 13);
    place-items: center;
    display: grid;
    background-color: var(--primary-color);
    margin: var(--baseline);
    border-radius: 50%;
    user-select: none;
    -webkit-user-select: none;
    justify-self: end;
  }

  svg {
    height: 100%;
    transform: rotate(-90deg);
  }

  circle {
    stroke: var(--highlight-color);
    stroke-width: calc(var(--baseline) * 2.25);
    transition: stroke-dashoffset 0.35s linear;
  }

  .spinner {
    animation: 0.75s linear 0s infinite normal none running rotate;
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

<div class="refreshIcon">
  <svg
    class:spinner={$countdownStore <= 0}
    viewBox="0 0 100 100"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      r={radius}
      cx="50"
      cy="50"
      fill="transparent"
      stroke-dasharray={circumference}
      stroke-dashoffset={percentFill}
    />
  </svg>
</div>
