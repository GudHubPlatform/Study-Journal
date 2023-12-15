export function convertMsToDDMM(milliseconds) {
	const date_separator = '/';

	const date = new Date(milliseconds);
	const day = date.getDate();
	const month = date.getMonth() + 1;

	return [day, month].join(date_separator);
}