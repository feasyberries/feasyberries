<script lang="ts">
	import LockOpenIcon from './icons/LockOpenIcon.svelte';
	import LockClosedIcon from './icons/LockClosedIcon.svelte';
	import ProgressRing from './ProgressRing.svelte';
	import { tweened } from 'svelte/motion';
	import { linear as easing } from 'svelte/easing';
	import { getApi } from '$lib/ApiContext';

	let api = getApi();

	const refresh_rate_ms = api.refresh_rate * 1000;
	const interval_update_ms = 1000;

	let now = $state(Date.now());
	let wake_lock_available = $state(false);
	let wake_lock: WakeLockSentinel | undefined = $state();
	let interval_id: number | undefined = $state();

	let time_remaining_ms = $derived(api.expires ? api.expires - now : 0);
	let progress_percent = $derived((time_remaining_ms / refresh_rate_ms) * 100);

	let progress_tweened = tweened(
		(api.expires ? api.expires - Date.now() : 0 / refresh_rate_ms) * 100,
		{ duration: interval_update_ms, easing }
	);

	function update_now() {
		now = Date.now();
	}

	function clear_interval() {
		if (interval_id) {
			clearInterval(interval_id);
			interval_id = undefined;
		}
	}

	$effect(() => {
		progress_tweened.set(progress_percent);
	});

	$effect(() => {
		interval_id = setInterval(update_now, interval_update_ms);
		return clear_interval;
	});

	$effect(() => {
		if (progress_percent <= 0) {
			clear_interval();
		}
	});

	$effect(() => {
		wake_lock_available = 'wakeLock' in navigator;
	});

	async function onclick() {
		if (wake_lock) {
			wake_lock.release().then(() => {
				wake_lock = undefined;
			});
		} else {
			try {
				wake_lock = await navigator.wakeLock.request('screen');
			} catch (err) {
				// The Wake Lock request has failed - usually system related, such as battery.
				wake_lock = undefined;
			}
		}
	}
</script>

<button {onclick} disabled={!wake_lock_available}>
	<ProgressRing progress={$progress_tweened} stroke={0.3} radius={2}>
		{#if wake_lock_available}
			<div>
				{#if wake_lock}
					<LockClosedIcon width="1em" height="1em" />
				{:else}
					<LockOpenIcon width="1em" height="1em" />
				{/if}
			</div>
		{/if}
	</ProgressRing>
</button>

<style>
	button {
		background-color: unset;
		border: unset;
		box-shadow: unset;
	}
</style>
