<script lang="ts">
	import LinkAsButton from './LinkAsButton.svelte';
	import { terminal_code_to_name } from '$lib/codesToNames';
	import { getApi } from '$lib/ApiContext';

	let { terminals }: { terminals: BcFerries.TerminalCode[] } = $props();
	let api = getApi();

	function get_href(terminal: BcFerries.TerminalCode) {
		if (api.origin) {
			return `${api.origin}${terminal}`;
		} else {
			return terminal;
		}
	}
</script>

<ul>
	{#each terminals.sort() as terminal (terminal)}
		<li>
			<LinkAsButton href={`/${get_href(terminal)}`}>
				<span class="terminal-pill">
					{terminal}
				</span>
				<span class="fullname">{terminal_code_to_name(terminal)}</span>
			</LinkAsButton>
		</li>
	{/each}
</ul>

<style>
	li {
		list-style: none;
	}
	ul {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}
	span {
		display: inline;
	}
</style>
