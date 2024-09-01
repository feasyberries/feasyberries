<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		radius = 5,
		stroke = 1,
		progress,
		children
	}: {
		radius?: number;
		stroke?: number;
		progress: number;
		children?: Snippet;
	} = $props();

	let normalizedRadius = $derived(radius - stroke * 2);
	let circumference = $derived(normalizedRadius * 2 * Math.PI);
	let strokeDashoffset = $derived(
		circumference - (progress / 100) * circumference
	);

	let [from_color, to_color] = $derived(
		progress < 75 ? ['cyan', 'yellow'] : ['yellow', 'orange']
	);

	let mix_percent = $derived(
		progress < 75 ? progress * 1.33 : (progress - 75) * 4
	);

	let stroke_color = $derived(
		`color-mix(in srgb, var(--${from_color}), var(--${to_color}) ${mix_percent}%)`
	);

	let rounded_progress = $derived(Math.round(progress));
</script>

<section
	style:height={`${radius * 2}em`}
	style:width={`${radius * 2}em`}
	style:color={stroke_color}
>
	<svg
		height={`${radius * 2}em`}
		width={`${radius * 2}em`}
		style:color={stroke_color}
	>
		<circle
			style:stroke={stroke_color}
			fill="transparent"
			style:stroke-dashoffset={`${strokeDashoffset}em`}
			stroke-width={`${stroke}em`}
			stroke-dasharray={`${circumference}em ${circumference}em`}
			r={`${normalizedRadius}em`}
			cx={`${radius}em`}
			cy={`${radius}em`}
		/>
	</svg>
	{#if children}
		{@render children()}
	{:else}
		<div style:font-size="{radius / 2}em">
			{rounded_progress}%
		</div>
	{/if}
</section>

<style>
	:root[data-theme='light'],
	:root:not([data-theme='dark']) {
		--orange: var(--orange-7);
		--cyan: var(--cyan-7);
		--yellow: var(--yellow-7);
	}

	@media only screen and (prefers-color-scheme: dark) {
		:root:not([data-theme='light']) {
			--orange: var(--orange-5);
			--cyan: var(--cyan-5);
			--yellow: var(--yellow-5);
		}
	}

	section {
		display: grid;
		place-items: center;
	}

	section > :global(*) {
		grid-area: 1 / 1;
	}

	section > * {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	circle {
		transform-origin: center;
		transform: rotate(-0.25turn);
		stroke-linecap: round;
	}
</style>
