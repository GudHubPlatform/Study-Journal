export default class DatePagination {
    constructor(container, onChange, onClickOnOff) {
        this.container = container;
        this.onChange = onChange;

        this.dateRangeForToday = this.getRange28DaysToday();
        this.currentDateRange = this.dateRangeForToday;

        this.buttons_container;
        this.isEnabled = true;

        this.createElements();
        this.attachEventListeners();
    }
    
    createElements() {
        this.prevButton = document.createElement('button');
        this.prevButton.textContent = '<';

        this.nextButton = document.createElement('button');
        this.nextButton.textContent = '>';

        this.todayButton = document.createElement('button');
        this.todayButton.textContent = 'Today';

        this.buttons_container = document.createElement('div');
        this.textSpan = document.createElement('span');

        this.onOffRadioButton = document.createElement('input');
        this.onOffRadioButton.type = 'radio';
        this.onOffRadioButton.checked = true;

        this.container.appendChild(this.buttons_container);
        this.buttons_container.appendChild(this.prevButton);
        this.buttons_container.appendChild(this.nextButton);

        this.container.appendChild(this.textSpan);
        this.updateTextDate();

        this.container.appendChild(this.todayButton);

        this.container.appendChild(this.onOffRadioButton);
    }

    updateCurrentDateRange(dateRange) {
        console.log(dateRange);
        this.currentDateRange = dateRange;
        this.updateTextDate();
    }

    updateTextDate() {
        this.textSpan.textContent = this.convertMillisecondsToDateText(this.currentDateRange);
    }

    attachEventListeners() {
        this.prevButton.addEventListener('click', () => this.handlePrevClick());
        this.nextButton.addEventListener('click', () => this.handleNextClick());
        this.todayButton.addEventListener('click', () => this.handleTodayClick());
        this.onOffRadioButton.addEventListener('click', () => this.handleClickOnOff());
    }

    handlePrevClick() {
        const newDateRange = this.calculateMonthRange(this.currentDateRange);
        this.updateCurrentDateRange(newDateRange);
        this.onChange();
    }

    handleNextClick() {
        const newDateRange = this.calculateMonthRange(this.currentDateRange, true);
        this.updateCurrentDateRange(newDateRange);
        this.onChange();
    }

    handleTodayClick() {
        const newDateRange = this.dateRangeForToday;
        this.updateCurrentDateRange(newDateRange);
        this.onChange();
    }

    handleClickOnOff() {
        this.isEnabled = !this.isEnabled;
        this.onOffRadioButton.checked = this.isEnabled;

        if (this.isEnabled) {
            this.currentDateRange = this.dateRangeForToday;
        } else {
            this.currentDateRange = null;
        }

        this.onChange();
    }

    getRange28DaysToday() {
        const now = new Date();
        now.setHours(23, 59, 59, 0);
        const currentDayOfWeek = now.getDay();
        const daysUntilSunday = 7 - currentDayOfWeek;
        const endDate = new Date(now);
        endDate.setDate(now.getDate() + daysUntilSunday);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 28);
        // endDate.setDate(endDate.getDate() + 1);
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
        
        const startDateText = startDate.toLocaleDateString(undefined, startOptions);
        const endDateText = endDate.toLocaleDateString(undefined, endOptions);
        
        return `${startDateText} - ${endDateText}`;
    }
}