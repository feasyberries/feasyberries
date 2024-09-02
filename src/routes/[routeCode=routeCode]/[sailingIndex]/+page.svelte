<script lang="ts">
	import Sailing from '$lib/components/Sailing.svelte';
	import { getApi } from '$lib/ApiContext';

	let api = getApi();
</script>

{#if api.selected_sailing}
	<Sailing sailing={api.selected_sailing} full />
{/if}
