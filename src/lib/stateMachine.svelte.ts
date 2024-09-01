
import svelteFsm from 'svelte-fsm';
import useLocalStorage from './useLocalStorage.svelte';
import useFetcher from './useFetcher.svelte';

type MyStates =
	'off' |
	'fetching' |
	'fetch_success' |
	'fetch_error' |
	'fetch_error_await_retry' |
	'data_loaded' |
	'data_saved' |
	'loading_from_storage' |
	'await_expire';
type MyEvents =
	'load_from_storage' |
	'save_to_storage' |
	'set_expire_timeout' |
	'set_retry_timeout' |
	'on_retry' |
	'on_expire' |
	'success' |
	'fail' |
	'init';

type ScheduleStorage = {
	schedule?: BcFerries.ApiResponse;
	expires?: number;
}

export function createMachine() {
	const url = 'https://www.bcferriesapi.ca/v2/capacity/';
	let local_storage = useLocalStorage('bcferriesapiresponse', '');
	let storage_parsed: ScheduleStorage = $derived.by(() => {
		const empty: ScheduleStorage = {};
		if (local_storage.value) {
			let parsed: ScheduleStorage;
			try {
				parsed = JSON.parse(local_storage.value);
				return parsed;
			} catch (_e) { }
		}
		return empty;
	});

	const refresh_rate = 60;

	let schedule = $derived(storage_parsed?.schedule);
	let expires = $derived(storage_parsed?.expires);

	let from_fetch = useFetcher(url);

	function load_from_storage() {
		return local_storage.load();
	}

	function seconds_from_now(seconds: number) {
		const now_ms = new Date().getTime();
		const seconds_ms = seconds * 1000;
		return now_ms + seconds_ms;
	}

	function save_to_storage() {
		let newValue: ScheduleStorage = {
			schedule: from_fetch.data,
			expires: seconds_from_now(refresh_rate)
		}

		local_storage.value = JSON.stringify(newValue);
	}

	let timeout_id: number | undefined = $state();
	function set_expire_timeout(callback: () => void) {
		if (timeout_id) {
			clearTimeout(timeout_id);
			timeout_id = undefined;
		}
		let expires_ut = expires;
		if (expires_ut) {
			let now_ms = new Date().getTime();
			let time_remaining_ms = expires_ut - now_ms
			timeout_id = setTimeout(() => {
				callback()
			}, time_remaining_ms);
		}
	}

	async function fetch_data() {
		return await from_fetch.fetch_data();
	}

	function set_retry_timeout(callback: () => void) {
		$effect(() => {
			const ten_seconds_ms = 10 * 1000;
			let timeout_id = setTimeout(() => {
				callback()
			}, ten_seconds_ms);

			return () => {
				clearTimeout(timeout_id);
			}
		});
	}

	const f = svelteFsm('off', {
		off: {
			init: 'loading_from_storage'
		},
		loading_from_storage: {
			_enter(params) {
				let success = load_from_storage();
				// @ts-ignore
				return success ? this.success() : this.fail()
			},
			success: 'data_saved',
			fail: 'fetching'
		},
		fetching: {
			async _enter() {
				return await fetch_data()
					// @ts-ignore
					.then((success) => success ? this.success() : this.fail())
					// @ts-ignore
					.catch(() => this.fail())
			},
			success: 'fetch_success',
			fail: 'fetch_error'
		},
		fetch_success: {
			_enter() {
				save_to_storage();
				// @ts-ignore
				return this.save_to_storage();
			},
			save_to_storage: 'data_saved'
		},
		fetch_error: {
			_enter() {
				// @ts-ignore
				set_retry_timeout(() => { this.on_retry() });
				// @ts-ignore
				this.set_retry_timeout();
			},
			set_retry_timeout: 'fetch_error_await_retry',
			on_retry: 'fetching'
		},
		fetch_error_await_retry: {
			on_retry: 'fetching'
		},
		data_loaded: {
			_enter() {
				save_to_storage();
				// @ts-ignore
				this.save_to_storage();
			},
			save_to_storage: 'data_saved'
		},
		data_saved: {
			_enter() {
				// @ts-ignore
				set_expire_timeout(() => { this.on_expire() });
				// @ts-ignore
				this.set_expire_timeout();
			},
			set_expire_timeout: 'await_expire',
			on_expire: 'fetching'
		},
		await_expire: {
			on_expire: 'fetching'
		},
	});

	let state: MyStates = $state('off');

	f.subscribe((new_state) => {
		state = new_state;
	});

	let final = {
		get state() {
			return state;
		},
		machine: f,
		get value() {
			return schedule;
		},
		get expires() {
			return expires;
		},
		refresh_rate
	}
	type MyStateMachine = typeof final;

	return final;
}

