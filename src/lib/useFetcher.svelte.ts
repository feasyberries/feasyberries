type Options = { [key: string]: any };
type ErrorMessage = string | null;

export const useFetcher = (initialUrl: string, options?: Options | undefined) => {
	let url = $state<string>(initialUrl);
	let data = $state<any>(null);
	let loading = $state<boolean>(true);
	let error = $state<ErrorMessage>();

	const setLoading = (isLoading: boolean = true) => {
		loading = isLoading;
		if (isLoading === true) {
			error = null;
			data = null;
		}
	};

	const fetchData = async (): Promise<[ErrorMessage, any]> => {
		try {
			const res = await fetch(url, options);
			if (!res.ok) throw new Error(`Unexpected error occurred (status ${res.status})`);

			const data = await res.json();
			return [null, data];
		} catch (e: any) {
			const { errorMessage = 'Unexpected error eccurred' } = e;
			return [errorMessage, null];
		}
	};

	const fetch_data = async () => {
		setLoading(true);

		const [err, response] = await fetchData();

		if (err) {
			setLoading(false);
			error = err;
			return false;
		}

		setLoading(false);
		data = response;
		return true;
	};

	return {
		get data() {
			return data;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get url() {
			return url;
		},
		set url(newUrl: any) {
			if (url !== newUrl) url = newUrl;
		},
		fetch_data
	};
};

export default useFetcher;