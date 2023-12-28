import GhHtmlElement from '@gudhub/gh-html-element';
import html from './studyjournal.html';
import './style.scss';

import { journalModes } from './data.js';

import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

import DatePagination from './DatePagination.js';

import createCellClickCallback from './click.js';
import StudentDataPreparation from './DataPreparation/Student.js';
import SubjectDataPreparation from './DataPreparation/Subject.js';

import { convertMsToDDMM } from './helpers/convertMsToDDMM.js';
import resizeElements from './utils/resizeComponent.js';
class GhStudyJournal extends GhHtmlElement {
	// Constructor with super() is required for native web component initialization

	constructor() {
		super();
		this.table;
		this.dataPreparation;
		this.datePagination;

		this.updateTableFunction;
	}

	// onInit() is called after parent gh-element scope is ready

	onInit() {
		super.render(html);

		const { journal_mode, journal_app_id, isPaginationEnabled } =
			this.scope.field_model.data_model;

		this.dataPreparation = chooseDataPreparationClass(
			journal_mode,
			this.scope
		);

		this.renderPagination(isPaginationEnabled);

		this.updateTableFunction = () => {
			this.dataPreparation.initializeItems().then(() => {
				this.updateTable();
			});
		};

		gudhub.on(
			'gh_items_update',
			{ journal_app_id },
			this.updateTableFunction
		);

		this.renderTable();
		resizeElements.subscribe();
	}

	// disconnectedCallback() is called after the component is destroyed 
	disconnectedCallback() {
		const { journal_app_id } = this.scope.field_model.data_model;

		gudhub.destroy(
			'gh_items_update',
			{ journal_app_id },
			this.updateTableFunction
		);

		resizeElements.destroy();
	}

	async renderPagination(isPaginationEnabled) {
		const container = this.querySelector('.pagination');

		const handleOnChangePagination = () => {
			this.updateTable();
		};

		this.datePagination = new DatePagination(
			container,
			isPaginationEnabled,
			handleOnChangePagination
		);
	}

	async renderTable() {
		const container = this.querySelector('.journal-table');

		const customCyrillicCompareFactory = function (sortOrder) {
			return function customCyrillicCompare(value, nextValue) {
				return (
					value.localeCompare(nextValue) *
					(sortOrder === 'asc' ? 1 : -1)
				);
			};
		};

		const updateColHeaderTH = (col, thElement) => {
			const spanElement = thElement.querySelector('.colHeader');
			if (spanElement) {
				const text = spanElement.textContent.trim();
				if (text.length > 5) {
					spanElement.textContent = text.split(' ').join('\n');
				}
			}
		};

		const clickCallback = createCellClickCallback.call(this);

		this.table = new Handsontable(container, {
			rowHeaders: true,
			width: '100%',
			height: 'auto',
			fixedColumnsStart: 1,
			fixedRowsTop: 0,
			columnHeaderHeight: 90,
			licenseKey: 'non-commercial-and-evaluation',
			selectionMode: 'single',
			afterOnCellMouseUp: function(event, coords, td) {
				if (event.which === 1) {
					clickCallback.call(this, event, coords);
					return;
				}

				var now = new Date().getTime();
				// check if dbl-clicked within 1/5th of a second
				if(!(td.lastClick && now - td.lastClick < 200)) {
					td.lastClick = now;
					return; // no double-click detected
				}
				// double-click
				clickCallback.call(this, event, coords);
			},
			afterGetColHeader: updateColHeaderTH,
			editor: false,
			columnSorting: {
				indicator: false,
				headerAction: false,
				compareFunctionFactory: (sortOrder) => {
					return customCyrillicCompareFactory(sortOrder);
				}
			}
		});

		// set table data after table creation
		this.updateTable();
	}

	async updateTable() {
		const dateRange = this.datePagination?.currentDateRange;
		const [
			uniqueDates,
			students_data,
			mapRowHeaderItemRefIdAndInterpretation
		] = await this.dataPreparation.getTableData(dateRange);

		if (
			!uniqueDates ||
			!students_data ||
			!mapRowHeaderItemRefIdAndInterpretation
		)
			return;

		const formated_dates = uniqueDates.map((date) => {
			if (isNaN(date)) {
				return date;
			} else {
				return convertMsToDDMM(date);
			}
		});

		// sets dates mm:dd in colHeaders
		this.table.updateSettings({
			colHeaders: ['', ...formated_dates]
		});

		this.table.loadData(students_data);

		// Iterate through rows and set rawData as metadata and interpretatedData as cellData for the first column
		const rowCount = this.table.countRows();

		for (let row = 0; row < rowCount; row++) {
			const rowData = this.table.getDataAtCell(row, 0);

			const metadata = rowData;

			this.table.setDataAtCell(
				row,
				0,
				mapRowHeaderItemRefIdAndInterpretation.get(rowData)
			);
			this.table.setCellMeta(row, 0, 'metadata', metadata);
		}

		this.sortTable(this.scope.field_model.data_model.sorting_type);

		// sets date in milliseconds as metadata in first row
		uniqueDates.map((date, col) => {
			this.table.setCellMeta(0, col + 1, 'metadata', date);
		});
	}

	sortTable(sortOrder) {
		const options = {
			column: 0,
			sortOrder: sortOrder === '' ? 'asc' : sortOrder
		};
		this.table.getPlugin('columnSorting').sort(options);
	}
}

function chooseDataPreparationClass(journalMode, scope) {
	let dataPreparation;

	switch (journalMode) {
		case journalModes.subject.byDate:
			dataPreparation = new SubjectDataPreparation(scope, true);
			break;
		case journalModes.subject.byLessons:
			dataPreparation = new SubjectDataPreparation(scope);
			break;
		case journalModes.student:
			dataPreparation = new StudentDataPreparation(scope);
			break;
		default:
			console.error('Unknown journal mode');
			break;
	}

	return dataPreparation;
}

// Register web component only if it is not registered yet

if (!customElements.get('gh-study-journal')) {
	customElements.define('gh-study-journal', GhStudyJournal);
}
