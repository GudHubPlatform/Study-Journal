export default class DatePagination {
	constructor(container, isEnabled, onChange) {
		this.container = container;
		this.onChange = onChange;

		this.dateRangeForToday = this.getRange28DaysToday();
		this.currentDateRange = this.dateRangeForToday;

		this.buttons_container;
		this.isEnabled = isEnabled;

		this.createElements();
		this.attachEventListeners();

		this.turnPagination();
	}

	createElements() {
		this.prevIconSpan = document.createElement('span');
		this.prevIconSpan.innerHTML =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M217.9 256L345 129c9.4-9.4 9.4-24.6 0-33.9-9.4-9.4-24.6-9.3-34 0L167 239c-9.1 9.1-9.3 23.7-.7 33.1L310.9 417c4.7 4.7 10.9 7 17 7s12.3-2.3 17-7c9.4-9.4 9.4-24.6 0-33.9L217.9 256z"></path></svg>';
		this.nextIconSpan = document.createElement('span');
		this.nextIconSpan.innerHTML =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M294.1 256L167 129c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.3 34 0L345 239c9.1 9.1 9.3 23.7.7 33.1L201.1 417c-4.7 4.7-10.9 7-17 7s-12.3-2.3-17-7c-9.4-9.4-9.4-24.6 0-33.9l127-127.1z"></path></svg>';

		this.prevButton = document.createElement('button');
		this.prevButton.classList.add('icon-button', 'pagination-button');
		this.prevButton.appendChild(this.prevIconSpan);

		this.nextButton = document.createElement('button');
		this.nextButton.classList.add('icon-button', 'pagination-button');
		this.nextButton.appendChild(this.nextIconSpan);

		this.todayButton = document.createElement('button');
		this.todayButton.classList.add('pagination-button');
		this.todayButton.textContent = 'Today';

		this.buttons_container = document.createElement('div');
		this.textSpan = document.createElement('span');

		this.container.appendChild(this.buttons_container);
		this.buttons_container.appendChild(this.prevButton);
		this.buttons_container.appendChild(this.nextButton);

		this.container.appendChild(this.textSpan);
		this.updateTextDate();

		this.container.appendChild(this.todayButton);
	}

	updateCurrentDateRange(dateRange) {
		this.currentDateRange = dateRange;
		this.updateTextDate();
	}

	updateTextDate() {
		this.textSpan.textContent = this.convertMillisecondsToDateText(
			this.currentDateRange
		);
	}

	attachEventListeners() {
		this.prevButton.addEventListener('click', () => this.handlePrevClick());
		this.nextButton.addEventListener('click', () => this.handleNextClick());
		this.todayButton.addEventListener('click', () =>
			this.handleTodayClick()
		);
	}

	handlePrevClick() {
		const newDateRange = this.calculateMonthRange(this.currentDateRange);
		this.updateCurrentDateRange(newDateRange);
		this.onChange();
	}

	handleNextClick() {
		const newDateRange = this.calculateMonthRange(
			this.currentDateRange,
			true
		);
		this.updateCurrentDateRange(newDateRange);
		this.onChange();
	}

	handleTodayClick() {
		const newDateRange = this.dateRangeForToday;
		this.updateCurrentDateRange(newDateRange);
		this.onChange();
	}

	handleClickOnOff(isEnabled) {
		this.isEnabled = isEnabled;

		this.turnPagination();

		this.onChange();
	}

	turnPagination() {
		if (this.isEnabled) {
			this.currentDateRange = this.dateRangeForToday;

			this.prevButton.classList.remove('disabled');
			this.nextButton.classList.remove('disabled');
			this.todayButton.classList.remove('disabled');

			this.container.classList.remove('display-none');
		} else {
			this.currentDateRange = null;

			this.prevButton.classList.add('disabled');
			this.nextButton.classList.add('disabled');
			this.todayButton.classList.add('disabled');

			this.container.classList.add('display-none');
		}
	}

	getRange28DaysToday() {
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		console.log(now);
		const currentDayOfWeek = now.getDay();
		const daysUntilSunday = 7 - currentDayOfWeek;
		const endDate = new Date(now);
		endDate.setDate(now.getDate() + daysUntilSunday);
		const startDate = new Date(endDate);
		startDate.setDate(endDate.getDate() - 28);
		const startMilliseconds = startDate.getTime();
		const endMilliseconds = endDate.getTime();

		return { start: startMilliseconds, end: endMilliseconds };
	}

	calculateMonthRange(range, addDays = false) {
		const startDate = new Date(range.start);
		const endDate = new Date(range.end);

		if (addDays) {
			startDate.setDate(startDate.getDate() + 28);

			endDate.setDate(endDate.getDate() + 28);
		} else {
			startDate.setDate(startDate.getDate() - 28);

			endDate.setDate(endDate.getDate() - 28);
		}

		const startMilliseconds = startDate.getTime();
		const endMilliseconds = endDate.getTime();

		return { start: startMilliseconds, end: endMilliseconds };
	}

	convertMillisecondsToDateText(dateRange) {
		const startMilliseconds = dateRange.start;
		const endMilliseconds = dateRange.end;

		const startDate = new Date(startMilliseconds);
		startDate.setHours(24);
		const endDate = new Date(endMilliseconds);

		const startOptions = { year: 'numeric', month: 'long', day: 'numeric' };
		const endOptions = { year: 'numeric', month: 'long', day: 'numeric' };

		const startDateText = startDate.toLocaleDateString(
			undefined,
			startOptions
		);
		const endDateText = endDate.toLocaleDateString(undefined, endOptions);

		return `${startDateText} - ${endDateText}`;
	}
}
