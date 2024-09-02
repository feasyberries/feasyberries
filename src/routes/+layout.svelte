<script lang="ts">
	import '@picocss/pico';
	import '@fontsource/titan-one';
	import '@fontsource/fira-sans';
	import 'open-props/open-props.min.css';
	import 'open-props/buttons.min.css';
	import 'open-props/colors-hsl.min.css';
	import 'open-props/colors.min.css';
	import Header from '$lib/components/Header.svelte';
	import RouteStatus from '$lib/components/RouteStatus.svelte';
	import { initApi, getApi } from '$lib/ApiContext';
	import { route_code_to_names } from '$lib/codesToNames';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';

	let { children } = $props();

	initApi();
	let api = getApi();

	onNavigate(() => {
		api.clear_all();
	});

	$effect(() => {
		if ($page.params.originCode) {
			const originCode = $page.params.originCode as BcFerries.TerminalCode;
			api.origin = originCode;
		}
	});

	$effect(() => {
		if ($page.params.routeCode) {
			const route_code = $page.params.routeCode as BcFerries.RouteCode;
			[api.origin, api.destination] = route_code_to_names(route_code);
			api.selected_route_code = route_code;
		}
	});

	$effect(() => {
		if ($page.params.sailingIndex) {
			api.selected_sailing_index = Number($page.params.sailingIndex);
		}
	});

	// $inspect(api.state).with((type, state) =>
	// 	console.log(`api.state: ${type}`, state)
	// );
</script>

<Header />
<main>
	<RouteStatus />
	{@render children()}
</main>

<style>
	main {
		height: calc(100dvh - var(--size-11));
		overflow: auto;
		display: flex;
		flex-direction: column;
	}
	:root {
		--pico-font-family: 'Fira Sans', sans-serif;
		font-size: 1.25rem;
	}

	@media (max-width: 769px) {
		:root {
			font-size: 1rem;
		}
	}

	/* @media (max-width: 545px) {
		:root {
			font-size: 0.75rem;
		}
	} */

	@media (max-width: 360px) {
		:root {
			font-size: 0.65rem;
		}
	}

	:root[data-theme='light'],
	:root:not([data-theme='dark']) {
		--pico-text-selection-color: hsl(var(--indigo-4-hsl) / 25%);
		--pico-primary: var(--indigo-4);
		--pico-primary-background: var(--indigo-4);
		--pico-primary-underline: hsl(var(--indigo-4-hsl) / 50%);
		--pico-primary-hover: var(--indigo-3);
		--pico-primary-hover-background: var(--indigo-4);
		--pico-primary-focus: hsl(var(--indigo-4-hsl) / 50%);
		--pico-primary-inverse: var(--gray-1);
	}

	@media only screen and (prefers-color-scheme: dark) {
		:root:not([data-theme='light']) {
			--pico-text-selection-color: hsl(var(--pink-4-hsl) / 18.75%);
			--pico-primary: var(--pink-4);
			--pico-primary-background: var(--pink-4);
			--pico-primary-underline: hsl(var(--pink-4-hsl) / 50%);
			--pico-primary-hover: var(--pink-3);
			--pico-primary-hover-background: var(--pink-4);
			--pico-primary-focus: hsl(var(--pink-4-hsl) / 37.5%);
			--pico-primary-inverse: var(--gray-10);
			--pico-background-color: #252a33;
		}
	}

	main {
		padding-left: 1rem;
		padding-right: 1rem;
	}

	main :global(.terminal-pill) {
		width: 8ch;
		background-color: var(--pico-primary-inverse);
		color: var(--pico-primary-hover-background);
		border-radius: var(--radius-round);
		display: grid;
		place-items: center;
		height: var(--size-8);
	}

	main :global(ul) {
		padding-left: 0;
	}
</style>
