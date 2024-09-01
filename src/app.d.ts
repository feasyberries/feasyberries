import type { CrossfadeParams, TransitionConfig } from "svelte/transition";

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	namespace BcFerries {
		export interface ApiResponse {
			routes?: (RoutesEntity)[] | null;
		}
		export interface RoutesEntity {
			routeCode: string;
			fromTerminalCode: TerminalCode;
			toTerminalCode: TerminalCode;
			sailingDuration: string;
			sailings?: (SailingsEntity)[] | null;
		}
		export interface SailingsEntity {
			time: string;
			arrivalTime: string;
			sailingStatus: string;
			fill: number;
			carFill: number;
			oversizeFill: number;
			vesselName: string;
			vesselStatus: string;
		}

		export type TerminalCode =
			'TSA' |
			'SWB' |
			'SGI' |
			'DUK' |
			'FUL' |
			'HSB' |
			'NAN' |
			'LNG' |
			'BOW';

		export type RouteCode =
			'SWBTSA' |
			'SWBSGI' |
			'TSASWB' |
			'NANHSB' |
			'TSADUK' |
			'HSBBOW' |
			'SWBFUL' |
			'TSASGI' |
			'HSBNAN' |
			'HSBLNG' |
			'DUKTSA' |
			'LNGHSB';
	};

	export type TransitionFunction = (
		node: any,
		params: CrossfadeParams & { key: any; }
	) => () => TransitionConfig;
}

export { };
