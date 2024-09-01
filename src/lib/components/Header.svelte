<script lang="ts">
	// import Timer from './Timer.svelte';
	// import PopOver from './PopOver.svelte';
	// import Debug from './Debug.svelte';
	import TextIcon from './icons/TextIcon.svelte';
	import { getApi } from '$lib/ApiContext';
	import ThemeSwitch from './ThemeSwitch.svelte';

	let api = getApi();
</script>

{#snippet button_content()}
	<TextIcon />
{/snippet}

<header class:throb={api.state === 'fetching'}>
	<a href="/">
		<h1>
			<span class="feasy">Feasy</span>
			<span class="berries">Berries</span>
		</h1>
	</a>
	<!-- {#if api.expires}
		{#key api.expires}
			<Timer end_time={api.expires} total_time={60} size={4} />
		{/key}
	{/if} -->
	<ThemeSwitch />
	<!-- <PopOver {button_content}>
		<Debug />
	</PopOver> -->
</header>

<style>
	:root[data-theme='light'],
	:root:not([data-theme='dark']) {
		span.feasy {
			color: var(--pink-6);
			text-shadow: var(--indigo-3) var(--size-1) var(--size-1) var(--size-1);
		}
		span.berries {
			color: var(--indigo-6);
			text-shadow: var(--indigo-3) var(--size-1) var(--size-1) var(--size-1);
		}
	}

	@media only screen and (prefers-color-scheme: dark) {
		:root:not([data-theme='light']) {
			span.feasy {
				color: var(--pink-2);
				text-shadow: var(--indigo-5) var(--size-1) var(--size-1) var(--size-1);
			}

			span.berries {
				color: var(--indigo-2);
				text-shadow: var(--indigo-5) var(--size-1) var(--size-1) var(--size-1);
			}
		}
	}

	header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		background: var(--gradient-29);
		background-color: var(--pico-background-color);
		padding: var(--size-5);
		background-size: 200% 200%;
		background-position: 0% 100%;
		animation-duration: 0.5s;
		position: sticky;
		top: 0;
		height: var(--size-11);
		white-space: nowrap;
	}

	.throb {
		animation-name: backgroundslide;
		animation-iteration-count: infinite;
		animation-timing-function: linear;
		animation-direction: alternate;
	}

	@keyframes backgroundslide {
		from {
			background-position: 0% 100%;
		}
		to {
			background-position: 100% 0%;
		}
	}

	h1 {
		text-shadow: var(--shadow-3);
		font-family: 'Titan One', system-ui;
		font-size: var(--size-7);
	}

	@media (min-width: 460px) {
		h1 {
			font-size: var(--size-8);
		}
	}

	a {
		text-decoration: none;
	}
</style>
