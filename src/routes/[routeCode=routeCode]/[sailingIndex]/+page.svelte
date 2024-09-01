<script lang="ts">
	import Sailing from '$lib/components/Sailing.svelte';
	import { getApi } from '$lib/ApiContext';

	let api = getApi();
	$inspect(api.selected_sailing).with((type, state) =>
		console.log(`api.selected_sailing: ${type}`, state)
	);
</script>

{#if api.selected_sailing}
	<Sailing sailing={api.selected_sailing} full />
{/if}
