<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { linear as easing } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	let {
		end_time,
		total_time,
		size = 1.0
	}: { end_time: number; total_time?: number; size?: number } = $props();

	let initial_now = total_time ? end_time - total_time * 1000 : Date.now();
	let now = $state(Date.now());
	let end = end_time;
	let countdown = (end_time - initial_now) / 1000;

	let count = $derived(Math.round((end - now) / 1000));
	// let h = $derived(Math.floor(count / 3600));
	// let m = $derived(Math.floor((count - h * 3600) / 60));
	// let s = $derived(count - h * 3600 - m * 60);

	function updateTimer() {
		now = Date.now();
	}

	let interval: number | undefined = $state();

	$effect(() => {
		interval = setInterval(updateTimer, 1000);
		return () => {
			if (interval) {
				clearInterval(interval);
				interval = undefined;
			}
		};
	});

	$effect(() => {
		if (count === 0 && interval) {
			clearInterval(interval);
			interval = undefined;
		}
	});

	const duration = 1000;

	let offset = tweened(Math.max(count - 1, 0) / countdown, {
		duration,
		easing
	});
	let rotation = tweened((Math.max(count - 1, 0) / countdown) * 360, {
		duration,
		easing
	});

	$effect(() => {
		offset.set(Math.max(count - 1, 0) / countdown);
	});

	$effect(() => {
		rotation.set((Math.max(count - 1, 0) / countdown) * 360);
	});

	function padValue(value: number, targetLength = 2, char = '0') {
		const { length: currentLength } = value.toString();
		if (currentLength >= targetLength) return value.toString();
		return `${char.repeat(targetLength - currentLength)}${value}`;
	}
</script>

<section>
	<svg in:fly={{ y: -5 }} viewBox="-50 -50 100 100" width="250" height="250">
		<title>Remaining seconds: {count}</title>
		<g fill="none" stroke="currentColor" stroke-width={2 * size}>
			<circle stroke="currentColor" r="46" />
			<path
				stroke="hsl(208, 100%, 50%)"
				d="M 0 -46 a 46 46 0 0 0 0 92 46 46 0 0 0 0 -92"
				pathLength="1"
				stroke-dasharray="1"
				stroke-dashoffset={$offset}
			/>
		</g>
		<g fill="hsl(208, 100%, 50%)" stroke="none">
			<g transform="rotate({$rotation})">
				<g transform="translate(0 -46)">
					<circle r={2 * size} />
				</g>
			</g>
		</g>

		<!-- <g fill="currentColor" text-anchor="middle" dominant-baseline="baseline" font-size="13">
			<text x="-3" y="6.5">
				{#each Object.entries({ h, m, s }) as [key, value], i}
					{#if countdown >= 60 ** (2 - i)}
						<tspan dx="3" font-weight="bold">{padValue(value)}</tspan><tspan dx="0.5" font-size="7"
							>{key}</tspan
						>
					{/if}
				{/each}
			</text>
		</g> -->
	</svg>
</section>

<style>
	section {
		width: 6rem;
		z-index: 5;
		padding: 0rem 1rem;
	}

	section > svg {
		overflow: visible;
		width: 100%;
		height: auto;
		display: block;
	}
</style>
