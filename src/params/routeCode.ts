
export function match(param: string): param is BcFerries.RouteCode {
	return /^(SWBTSA|SWBSGI|TSASWB|NANHSB|TSADUK|HSBBOW|SWBFUL|TSASGI|HSBNAN|HSBLNG|DUKTSA|LNGHSB)$/.test(param);
}

