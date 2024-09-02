<script lang="ts">
	import ProgressRing from './ProgressRing.svelte';
	import CarIcon from './icons/CarIcon.svelte';
	import TruckIcon from './icons/TruckIcon.svelte';
	import BoatIcon from './icons/BoatIcon.svelte';
	import TextIcon from './icons/TextIcon.svelte';
	import CheckIcon from './icons/CheckIcon.svelte';
	import ZoomIcon from './icons/ZoomIcon.svelte';
	import PopOver from './PopOver.svelte';
	import { timeHasPassed } from '$lib/timeStuff';
	import { getApi } from '$lib/ApiContext';
	import WakeLock from './WakeLock.svelte';
	import { base } from '$app/paths';

	let {
		sailing,
		next_to_sail = false,
		full = false,
		index
	}: {
		sailing: BcFerries.SailingsEntity;
		next_to_sail?: boolean;
		full?: boolean;
		index?: number | undefined;
	} = $props();
	let api = getApi();

	let root_elm: HTMLElement | undefined = $state();

	$effect(() => {
		if (next_to_sail) {
			requestAnimationFrame(() => {
				root_elm?.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
			});
		}
	});

	let zoom_href = `${base}/${api.selected_route_code}/${index}`;
</script>

{#snippet sailing_future(sailing: BcFerries.SailingsEntity)}
	<ProgressRing progress={sailing.fill} stroke={0.75} />
	<span class="stack others">
		<ProgressRing progress={sailing.carFill} radius={3} stroke={0.5}>
			<CarIcon x="38%" y="38%" width="2em" height="2em" />
		</ProgressRing>
		<ProgressRing progress={sailing.oversizeFill} radius={3} stroke={0.5}>
			<TruckIcon x="36%" y="38%" width="2em" height="2em" />
		</ProgressRing>
	</span>
{/snippet}

{#snippet button_content()}
	<TextIcon />
{/snippet}

{#snippet sailing_past(sailing: BcFerries.SailingsEntity)}
	{#if timeHasPassed(sailing.arrivalTime)}
		<CheckIcon width="2em" height="2em" />
	{:else}
		<BoatIcon width="2em" height="2em" />
	{/if}
	<h3>{sailing.arrivalTime}</h3>
{/snippet}

<article
	class:past={timeHasPassed(sailing.time)}
	bind:this={root_elm}
	class:full
>
	<div
		class:muted={timeHasPassed(sailing.arrivalTime) ||
			sailing.vesselName === '(Tomorrow)'}
		class:past={sailing.sailingStatus === 'past' ||
			sailing.sailingStatus === 'current'}
	>
		<span class="time stack big space-between">
			{#if sailing.sailingStatus === 'future' && !full}
				<a href={zoom_href}>
					<ZoomIcon width="3em" height="3em" />
				</a>
			{/if}
			<h3>
				{sailing.time}
			</h3>
			{#if full}
				<WakeLock />
			{/if}
		</span>
		{#if sailing.sailingStatus === 'past' || sailing.sailingStatus === 'current'}
			{@render sailing_past(sailing)}
		{:else}
			{@render sailing_future(sailing)}
		{/if}
	</div>
	<footer>
		<span>
			<small>{sailing.vesselName}</small>
			<small style:color={'var(--orange-6)'}>
				{sailing.vesselStatus}
			</small>
		</span>
		<PopOver {button_content}>
			<pre>{JSON.stringify(sailing, null, 2)}</pre>
		</PopOver>
	</footer>
</article>

<style>
	.big {
		height: 100%;
		width: 100%;
	}

	h3 {
		font-size: 1.5em;
	}

	article.full {
		flex-grow: 1;
		font-size: 6.5vw;
		justify-content: space-between;
	}

	article.full div {
		grid-template-columns: none;
		justify-content: flex-start;
	}

	article.full :global(.others) {
		display: flex;
		flex-direction: row;
	}

	article.full h3 {
		padding-left: var(--size-3);
	}

	article.full .time {
		flex-direction: row;
	}

	.space-between {
		justify-content: space-between;
	}

	article {
		display: flex;
		flex-direction: column;
	}

	article span {
		display: grid;
	}

	article div {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.5fr);
		align-items: center;
		justify-items: center;
	}

	article div.past {
		grid-template-columns: minmax(0, 1fr) minmax(0, 0.5fr) minmax(0, 1fr);
	}

	footer {
		display: flex;
		justify-content: space-between;
	}

	.muted h3 {
		color: var(--pico-muted-color);
	}

	.stack {
		display: flex;
		flex-direction: column;
	}
</style>
