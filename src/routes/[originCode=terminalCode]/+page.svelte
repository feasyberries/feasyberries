<script lang="ts">
	import TerminalSelect from '$lib/components/TerminalSelect.svelte';
	import { getApi } from '$lib/ApiContext';

	let api = getApi();
</script>

<TerminalSelect terminals={api.destinations_for_selected} />
