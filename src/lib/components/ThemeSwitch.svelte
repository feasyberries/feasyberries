<script lang="ts">
	import { browser } from '$app/environment';
	import MoonIcon from './icons/MoonIcon.svelte';
	import SunIcon from './icons/SunIcon.svelte';

	let theme = $state(true);

	$effect(() => {
		if (browser) {
			document.documentElement.dataset.theme = theme ? 'dark' : 'light';
		}
	});
</script>

<label>
	{#if theme}
		<MoonIcon width="2em" height="2em" />
	{:else}
		<SunIcon width="2em" height="2em" />
	{/if}
	<input type="checkbox" bind:checked={theme} />
</label>

<style>
	input {
		appearance: none;
		background-color: unset;
		border: unset;
		box-shadow: unset;
		width: 0;
		margin: 0;
	}
	label {
		padding-top: var(--size-3);
		color: var(--pico-primary);
	}
</style>
