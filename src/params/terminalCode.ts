
export function match(param: string): param is BcFerries.TerminalCode {
	return /^(TSA|SWB|SGI|DUK|FUL|HSB|NAN|LNG|BOW)$/.test(param);
}
