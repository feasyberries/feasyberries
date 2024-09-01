<script lang="ts">
	import { getApi } from '$lib/ApiContext';
	let api = getApi();
</script>

<ul>
	<details>
		<summary>api.selected_sailing</summary>
		<pre>{JSON.stringify(api.selected_sailing, null, 2)}</pre>
	</details>
	<details>
		<summary>api.selected_sailing_index</summary>
		{api.selected_sailing_index}
	</details>
	<details>
		<summary>api.selected_route</summary>
		<pre>{JSON.stringify(api.selected_route, null, 2)}</pre>
	</details>
	<details>
		<summary>api.selected_route_code</summary>
		{api.selected_route_code}
	</details>
	<details>
		<summary>api.origin</summary>
		{api.origin}
	</details>
	<details>
		<summary>api.destination</summary>
		{api.destination}
	</details>
	<details>
		<summary>api.value</summary>
		<pre>{JSON.stringify(api.schedule, null, 2)}</pre>
	</details>
</ul>
