<script lang="ts">
	import ProgressRing from './ProgressRing.svelte';
	import CarIcon from './icons/CarIcon.svelte';
	import TruckIcon from './icons/TruckIcon.svelte';
	import BoatIcon from './icons/BoatIcon.svelte';
	import TextIcon from './icons/TextIcon.svelte';
	import CheckIcon from './icons/CheckIcon.svelte';
	import ZoomIcon from './icons/ZoomIcon.svelte';
	import PopOver from './PopOver.svelte';
	import { page } from '$app/stores';

	import { timeHasPassed } from '$lib/timeStuff';
	import { getApi } from '$lib/ApiContext';
	import Sailing from './Sailing.svelte';

	let api = getApi();
	let next_sailing_index = $derived(
		api.selected_route?.sailings?.findIndex((s) => s.sailingStatus !== 'past')
	);

	let sailing_elms: HTMLElement[] = $state([]);

	$effect(() => {
		if (next_sailing_index) {
			requestAnimationFrame(() => {
				sailing_elms[next_sailing_index]?.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
			});
		}
	});
</script>

{#snippet text_icon()}
	<TextIcon />
{/snippet}

{#snippet sailing_future(sailing: BcFerries.SailingsEntity)}
	<ProgressRing progress={sailing.fill} stroke={0.75} />
	<span class="stack">
		<ProgressRing progress={sailing.carFill} radius={3} stroke={0.5}>
			<CarIcon x="38%" y="38%" width="2em" height="2em" />
		</ProgressRing>
		<ProgressRing progress={sailing.oversizeFill} radius={3} stroke={0.5}>
			<TruckIcon x="36%" y="38%" width="2em" height="2em" />
		</ProgressRing>
	</span>
{/snippet}

{#snippet sailing_past(sailing: BcFerries.SailingsEntity)}
	{#if timeHasPassed(sailing.arrivalTime)}
		<CheckIcon width="2em" height="2em" />
	{:else}
		<BoatIcon width="2em" height="2em" />
	{/if}
	<h3>{sailing.arrivalTime}</h3>
{/snippet}

<section>
	{#if api.selected_route?.sailings}
		<ul>
			{#each api.selected_route.sailings as sailing, index}
				<li bind:this={sailing_elms[index]}>
					<Sailing {sailing} {index} />
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	@media (max-width: 440px) {
		ul {
			padding-left: 0;
		}
	}

	li {
		list-style: none;
	}

	h3 {
		font-size: var(--size-8);
		margin-bottom: 0;
		/* align-self: end; */
		white-space: nowrap;
	}

	.stack {
		display: flex;
		flex-direction: column;
	}
</style>
