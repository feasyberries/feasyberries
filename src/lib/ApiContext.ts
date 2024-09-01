import { setContext, getContext } from 'svelte';
import BcFerriesApi from './BcFerriesApi.svelte';

export function initApi() {
	setContext('api', new BcFerriesApi());
}

export function getApi() {
	let api: BcFerriesApi = getContext('api');
	return api;
}
