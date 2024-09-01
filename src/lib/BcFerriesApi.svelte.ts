import { createMachine } from "./stateMachine.svelte";

export default class BcFerriesApi {
	origin: BcFerries.TerminalCode | '' = $state('');
	destination: BcFerries.TerminalCode | '' = $state('');
	selected_route_code: BcFerries.RouteCode | '' = $state('');
	selected_sailing_index: number | undefined = $state();
	storage;

	constructor() {
		this.storage = createMachine();
		this.storage.machine.init();
	}

	get schedule() {
		return this.storage.value;
	}

	get expires() {
		return this.storage.expires;
	}

	get state() {
		return this.storage.state;
	}

	get refresh_rate() {
		return this.storage.refresh_rate;
	}

	clear_all() {
		this.origin = '';
		this.destination = '';
		this.selected_route_code = '';
		this.selected_sailing_index = undefined;
	}

	routes = $derived(this.schedule?.routes || []);

	selected_route = $derived(
		this.routes?.find(r => r.routeCode === this.selected_route_code)
	);

	selected_sailing = $derived(
		(this.selected_route && this.selected_sailing_index !== undefined)
			? this.selected_route.sailings?.[this.selected_sailing_index]
			: undefined
	);

	destinations_for(code: BcFerries.TerminalCode) {
		return this.routes
			.filter((route) => route.fromTerminalCode === code)
			.map((route) => route.toTerminalCode);
	}

	get destinations_for_selected() {
		if (this.origin) {
			return this.destinations_for(this.origin);
		} else {
			return [];
		}
	}

	get origin_terminals() {
		const origins = this.routes.map((route) => route.fromTerminalCode);
		const unique_origins = [...new Set(origins)];
		return unique_origins;
	}
}
