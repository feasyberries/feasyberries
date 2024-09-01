<script lang="ts">
	import RightArrowIcon from './icons/RightArrowIcon.svelte';
	import { getApi } from '$lib/ApiContext';

	const api = getApi();
</script>

<section>
	{#if api.origin}
		<span class="terminal-pill">
			{api.origin}
		</span>

		{#if api.destination}
			<RightArrowIcon width="3rem" height="3rem" />
			<span class="terminal-pill">
				{api.destination}
			</span>
		{:else}
			<span></span>
			<h3>Destination?</h3>
		{/if}
	{:else}
		<h3>Origin?</h3>
	{/if}
</section>

<style>
	section {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		place-items: center;
		background-color: var(--pico-secondary);
		border-bottom-left-radius: var(--radius-2);
		border-bottom-right-radius: var(--radius-2);
		height: var(--size-9);
		min-height: var(--size-9);
		position: sticky;
		top: var(--size-11);
		color: var(--pico-primary-inverse);
		padding-left: 2rem;
		padding-right: 2rem;
	}
	h3 {
		color: var(--pico-primary-inverse);
		margin: 0;
	}
</style>
