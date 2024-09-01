<script lang="ts">
	import type { Snippet } from 'svelte';

	let { href, children }: { href: string; children: Snippet } = $props();
</script>

<a {href}>{@render children()}</a>

<style>
	a {
		text-decoration: none;
		display: block;
		--pico-background-color: var(--pico-primary-background);
		--pico-border-color: var(--pico-primary-border);
		--pico-color: var(--pico-primary-inverse);
		--pico-box-shadow: var(--pico-button-box-shadow, 0 0 0 rgba(0, 0, 0, 0));
		padding: var(--pico-form-element-spacing-vertical) var(--pico-form-element-spacing-horizontal);
		border: var(--pico-border-width) solid var(--pico-border-color);
		border-radius: var(--pico-border-radius);
		outline: 0;
		background-color: var(--pico-background-color);
		box-shadow: var(--pico-box-shadow);
		color: var(--pico-color);
		font-weight: var(--pico-font-weight);
		font-size: 1rem;
		line-height: var(--pico-line-height);
		text-align: center;
		text-decoration: none;
		cursor: pointer;
		-webkit-user-select: none;
		-moz-user-select: none;
		user-select: none;
		transition:
			background-color var(--pico-transition),
			border-color var(--pico-transition),
			color var(--pico-transition),
			box-shadow var(--pico-transition);

		min-width: 100%;
		box-shadow: var(--shadow-4);
		transition: box-shadow 200ms;
		display: grid;
		grid-template-columns: 1fr 3fr;
		justify-items: left;
		gap: 0.25em;
		align-items: center;
	}

	a:active,
	a:hover {
		color: var(--pico-primary-inverse);
		box-shadow: var(--shadow-2);
		transform: translate(0, var(--size-1));
	}
</style>
