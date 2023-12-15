import { showWeekendModes } from '../data.js';

export function filterDatesWeekends(dates, scope) {
	const { showWeekends } = scope.field_model.data_model;

	const showDaysIndexes = [];

	switch (showWeekends) {
		case showWeekendModes.saturday:
			showDaysIndexes.push(6);
			break;
		case showWeekendModes.sunday:
			showDaysIndexes.push(0);
			break;
		case showWeekendModes.showBoth:
			showDaysIndexes.push(0, 6);
			break;
		default:
			break;
	}

	const filteredDates = filterDates(dates, showDaysIndexes);

	return filteredDates;
}

function filterDates(dates, weekdaysIndexes = []) {
	let result = [];

	// Додаємо порожній масив для визначення днів, які будуть показуватись
	const daysIndexesToShow = [1, 2, 3, 4, 5];

	daysIndexesToShow.push(...weekdaysIndexes);

	let prevNonStringDate = null; // Зберігаємо попередню нелітеровану дату

	const checkIsShown = (date) => {
		const dateDay = new Date(date).getDay();

		return daysIndexesToShow.includes(dateDay);
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
