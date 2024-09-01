const terminal_code_to_name_lookup: Record<BcFerries.TerminalCode, string> = {
	TSA: 'Tsawwassen',
	SWB: 'Swartz Bay',
	SGI: 'Southern Gulf Islands',
	DUK: 'Duke Point',
	FUL: 'Fulford Harbour',
	HSB: 'Horseshoe Bay',
	NAN: 'Departure Bay',
	LNG: 'Langdale',
	BOW: 'Bowen Island',
};

export const terminal_codes: BcFerries.TerminalCode[] = [
	'TSA',
	'SWB',
	'SGI',
	'DUK',
	'FUL',
	'HSB',
	'NAN',
	'LNG',
	'BOW',
];

export function terminal_code_to_name(code: BcFerries.TerminalCode) {
	return terminal_code_to_name_lookup[code];
}

export function route_code_to_names(route_code: BcFerries.RouteCode) {
	const [origin, destination] = [
		route_code.slice(0, 3) as BcFerries.TerminalCode,
		route_code.slice(3) as BcFerries.TerminalCode
	];

	return [origin, destination];
}

