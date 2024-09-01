export const vancouverTime = () => {
	const nowStr = new Date().toLocaleString('en-US', {
		timeZone: 'America/Vancouver'
	});

	return new Date(nowStr);
};

export function formatTime(time: number) {
	const date = new Date(time);
	return date.toLocaleTimeString('en', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	});
};

export function timeHasPassed(time: string) {
	let [hour, minute] = convertTime12to24(time);
	const van_time = vancouverTime();
	const van_hours = van_time.getHours();
	const van_minutes = van_time.getMinutes();
	return van_hours > hour || (van_hours === hour && van_minutes >= minute);
};

function convertTime12to24(time12h: string) {
	let [hours_str, minutes_str, period] = time12h.match(/(\d+|pm|am)/gi) || [];
	if (hours_str && minutes_str) {
		let [hours, minutes] = [hours_str, minutes_str].map((x) => parseInt(x));
		if (hours === 12) {
			hours = 0;
		}
		if (period.toLowerCase() === 'pm') {
			hours = hours + 12;
		}
		return [hours, minutes];
	}
	return [];
}
