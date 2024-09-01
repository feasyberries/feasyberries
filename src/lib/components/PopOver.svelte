<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		button_content
	}: { children: Snippet; button_content?: Snippet } = $props();

	let open = $state(false);

	const id = Math.random().toString();

	function ontoggle(event: ToggleEvent) {
		open = !open;
	}
</script>

<button popovertarget={id} popovertargetaction="toggle">
	{#if button_content}
		{@render button_content()}
	{:else}
		{'Popover'}
	{/if}
</button>
<section {id} popover="auto" {ontoggle}>
	{#if open}
		{@render children()}
	{/if}
</section>

<style>
	button {
		background-color: transparent;
		color: var(--pico-h3-color);
		border: none;
	}
</style>
