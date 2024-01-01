export default class DatePagination {
	constructor(container, isEnabled, onChange) {
		this.container = container;
		this.onChange = onChange;

		this.dateRangeLength = 28;

		this.dateRangeForToday = this.getRangeDaysToday(this.dateRangeLength);
		this.currentDateRange = this.dateRangeForToday;

		this.buttons_container;
		this.isEnabled = isEnabled;

		this.createElements();
		this.attachEventListeners();

		this.turnPagination();
	}

	createElements() {
		this.left = this.container.querySelector('.left');
		this.right = this.container.querySelector('.right');

		this.prevIconSpan = document.createElement('span');
		this.prevIconSpan.innerHTML =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M217.9 256L345 129c9.4-9.4 9.4-24.6 0-33.9-9.4-9.4-24.6-9.3-34 0L167 239c-9.1 9.1-9.3 23.7-.7 33.1L310.9 417c4.7 4.7 10.9 7 17 7s12.3-2.3 17-7c9.4-9.4 9.4-24.6 0-33.9L217.9 256z"></path></svg>';
		this.nextIconSpan = document.createElement('span');
		this.nextIconSpan.innerHTML =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M294.1 256L167 129c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.3 34 0L345 239c9.1 9.1 9.3 23.7.7 33.1L201.1 417c-4.7 4.7-10.9 7-17 7s-12.3-2.3-17-7c-9.4-9.4-9.4-24.6 0-33.9l127-127.1z"></path></svg>';

		this.buttons_container = this.container.querySelector('.buttons-container');

		this.prevButton = document.createElement('button');
		this.prevButton.classList.add('icon-button', 'pagination-button');
		this.prevButton.appendChild(this.prevIconSpan);

		this.nextButton = document.createElement('button');
		this.nextButton.classList.add('icon-button', 'pagination-button');
		this.nextButton.appendChild(this.nextIconSpan);

		this.todayButton = this.container.querySelector('.today-button');

		this.textSpan = this.container.querySelector('.dateRange');

		this.monthButton = document.createElement('button');
		this.monthButton.textContent = 'month';
		this.monthButton.classList.add('selected');
		this.weekButton = document.createElement('button');
		this.weekButton.textContent = 'week';
		this.dayButton = document.createElement('button');
		this.dayButton.textContent = 'day';

		this.buttons_container.appendChild(this.prevButton);
		this.buttons_container.appendChild(this.nextButton);
		this.right.appendChild(this.monthButton);
		this.right.appendChild(this.weekButton);
		this.right.appendChild(this.dayButton);

		if (window.isMobile) {
			this.right.appendChild(this.buttons_container);
			this.right.appendChild(this.todayButton);
			this.right.appendChild(this.monthButton);
			this.right.appendChild(this.weekButton);
			this.right.appendChild(this.dayButton);
		}

		this.updateTextDate();

		this.rangeButtonsMap = {
			28: this.monthButton,
			7: this.weekButton,
			1: this.dayButton
		};
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

		for (const [daysLength, button] of Object.entries(this.rangeButtonsMap)) {
			button.addEventListener('click', () => this.handleSelectRange(daysLength));
		}
	}

	handlePrevClick() {
		const newDateRange = this.calculateRangeMove(this.currentDateRange);
		this.updateCurrentDateRange(newDateRange);
		this.onChange();
	}

	handleNextClick() {
		const newDateRange = this.calculateRangeMove(
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

	handleSelectRange(daysLength) {
		Object.values(this.rangeButtonsMap).forEach((button) => {
			button.classList.remove('selected');
		});
		this.rangeButtonsMap[daysLength].classList.add('selected');

		this.dateRangeLength = +daysLength;

		const newDateRange = this.getRangeDaysToday(this.dateRangeLength);
		this.dateRangeForToday = newDateRange;
		this.updateCurrentDateRange(newDateRange);

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

	getRangeDaysToday(dateRangeLength) {
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const currentDayOfWeek = now.getDay();
		const endDate = new Date(now);
		if (dateRangeLength > 1) {
			const daysUntilSunday = 7 - currentDayOfWeek;
			endDate.setDate(now.getDate() + daysUntilSunday);
		}
		const startDate = new Date(endDate);
		startDate.setDate(endDate.getDate() - (dateRangeLength - 1));
		const startMilliseconds = startDate.getTime();
		endDate.setHours(23, 59)
		const endMilliseconds = endDate.getTime();

		return { start: startMilliseconds, end: endMilliseconds };
	}

	calculateRangeMove(range, addDays = false) {
		const startDate = new Date(range.start);
		const endDate = new Date(range.end);
		const getDMY = (ms) => {
			const date = new Date(ms);
			return `${date.getDate()}:${date.getMonth()}:${date.getFullYear()}`;
		};

		if (addDays) {
			startDate.setDate(startDate.getDate() + this.dateRangeLength);

			endDate.setDate(endDate.getDate() + this.dateRangeLength);
		} else {
			startDate.setDate(startDate.getDate() - this.dateRangeLength);

			endDate.setDate(endDate.getDate() - this.dateRangeLength);
		}

		const startMilliseconds = startDate.getTime();
		const endMilliseconds = endDate.getTime();

		return { start: startMilliseconds, end: endMilliseconds };
	}

	convertMillisecondsToDateText(dateRange) {
		const startMilliseconds = dateRange.start;
		const endMilliseconds = dateRange.end;

		const startDate = new Date(startMilliseconds);
		const endDate = new Date(endMilliseconds);

		const startOptions = { year: 'numeric', month: 'long', day: 'numeric' };
		const endOptions = { year: 'numeric', month: 'long', day: 'numeric' };

		const startDateText = startDate.toLocaleDateString(
			undefined,
			startOptions
		);
		const endDateText = endDate.toLocaleDateString(undefined, endOptions);

		const cutMonthName = (dateStr) => {
			const splitted = dateStr.split(' ');
			splitted[0] = splitted[0].slice(0, 3);
			const result = splitted.join(' ');

			return result;
		};

		return `${cutMonthName(startDateText)} - ${cutMonthName(endDateText)}`;
	}
}
