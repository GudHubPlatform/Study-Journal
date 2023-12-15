import { showWorkdaysOptions } from '../data.js';

export function filterDatesWeekends(dates, scope) {
	const { showWorkdays } = scope.field_model.data_model;

	const showDaysIndexes = [1, 2, 3, 4, 5];

	switch (showWorkdays) {
		case showWorkdaysOptions.monFri:
			break;
		case showWorkdaysOptions.monSat:
			showDaysIndexes.push(6);
			break;
		case showWorkdaysOptions.monSun:
			showDaysIndexes.push(6, 0);
			break;
		default:
			break;
	}

	console.log(showDaysIndexes);

	const filteredDates = filterDates(dates, showDaysIndexes);

	return filteredDates;
}

function filterDates(dates, weekdaysIndexesToShow = []) {
	let result = [];

	let prevNonStringDate = null; // Зберігаємо попередню нелітеровану дату

	const checkIsShown = (date) => {
		const dateDay = new Date(date).getDay();

		return weekdaysIndexesToShow.includes(dateDay);
	};

	// Проходимося по датам
	for (let i = 0; i < dates.length; i++) {
		const date = dates[i];

		if (typeof date === 'number') {
			const isShown = checkIsShown(date);
			if (isShown) {
				result.push(date);
				prevNonStringDate = date;
			} else {
				prevNonStringDate = null;
			}
		} else if (typeof date === 'string') {
			if (!prevNonStringDate) continue;

			const isShown = checkIsShown(prevNonStringDate);

			if (isShown) result.push(date);
		}
	}

	return result;
}
