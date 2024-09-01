import { browser } from "$app/environment";
const useLocalStorage = (key: string, initialValue: any) => {
	let value = $state<any>(initialValue);

	const load = () => {
		if (!browser) {
			return false;
		}
		const currentValue = localStorage.getItem(key);
		if (currentValue) {
			value = JSON.parse(currentValue);
			return true;
		}
		return false;
	}

	const save = () => {
		if (browser) {
			if (value) {
				localStorage.setItem(key, JSON.stringify(value));
			} else {
				localStorage.removeItem(key);
			}
		}
	};

	return {
		get value() {
			return value;
		},
		set value(v: string) {
			value = v;
			save();
		},
		load
	};
};

export default useLocalStorage;