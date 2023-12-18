import { FilterItems } from '../utils/FilterItems.js';
import { filterDatesWeekends } from '../helpers/filterDatesWeekends.js';
export default class SubjectDataPreparation {
	constructor(scope, byDate = false) {
		this.scope = scope;
		this.interpretatedData;
		this.items;
		this.byDate = byDate;
	}

	async getTableData(dateRange) {
		if (!this.items) await this.initializeItems();
		//filter by user pagination
		const filtered_items = await FilterItems.ByPagination(
			this.items,
			this.scope,
			dateRange
		);

		const interpretated_filtered_items =
			await this.getInterpretatedData(filtered_items);

		// get students_names from students_app
		const studentNameMapWithInterpretations =
			await this.getStudentNamesMapFromStudentsApp();

		//if interpretatedData = undefined, then take fake data (like demo view)
		const [uniqueDates, students_data] = await this.prepareTableData(
			interpretated_filtered_items,
			studentNameMapWithInterpretations,
			dateRange
		);

		return [uniqueDates, students_data, studentNameMapWithInterpretations];
	}

	async initializeItems() {
		const { journal_app_id, points_filters_list } =
			this.scope.field_model.data_model;

		if (!journal_app_id) {
			return;
		}

		let items = await gudhub.getItems(journal_app_id, false);
		items = await FilterItems.ByFilterSettings(
			items,
			this.scope,
			points_filters_list
		);
		this.items = items;
	}

	async getInterpretatedData(items) {
		const {
			journal_app_id,
			student_name_field_id,
			point_field_id,
			event_date_field_id,
			tag_field_id
		} = this.scope.field_model.data_model;

		if (
			!journal_app_id ||
			!student_name_field_id ||
			!point_field_id ||
			!event_date_field_id
		) {
			return;
		}

		const students_data = [];

		for (const item of items) {
			const { item_id } = item;

			if (item.fields.length === 0) continue;

			const student_name_field = item.fields.find(
				({ field_id }) => field_id == student_name_field_id
			);

			if (!student_name_field) continue;

			const studentNameRefId = student_name_field.field_value;
			const point = await gudhub.getInterpretationById(
				journal_app_id,
				item_id,
				point_field_id,
				'value'
			);
			const event_date = await gudhub.getInterpretationById(
				journal_app_id,
				item_id,
				event_date_field_id,
				'value'
			);
			const tag = await gudhub.getInterpretationById(
				journal_app_id,
				item_id,
				tag_field_id,
				'value'
			);

			// set hours, minutes, seconds to 0
			const date_without_time = new Date(event_date).setHours(0, 0, 0, 0);

			const student_values = {
				studentNameRefId,
				point,
				event_date: date_without_time,
				tag
			};

			students_data.push(student_values);
		}

		return students_data;
	}

	async prepareTableData(
		students_data,
		studentNameMapWithInterpretations,
		dateRange
	) {
		students_data.sort(
			(a, b) => new Date(a.event_date) - new Date(b.event_date)
		);

		const uniqueDatesSet = new Set();

		students_data.forEach((item) => {
			if (item.event_date) {
				uniqueDatesSet.add(item.event_date);
			}
			if (item.tag) {
				uniqueDatesSet.add(item.tag);
			}
		});

		let uniqueDates = this.byDate
			? insertMissingDates([...uniqueDatesSet], dateRange)
			: mergeSortedDateArrays(
					[...uniqueDatesSet],
					await getLessonsDatesFilteredByCurrentAppSubjectAndClass(
						this.scope,
						dateRange
					)
			  );
		uniqueDates = filterDatesWeekends(uniqueDates, this.scope);

		const twoDimensionalArray = [];

		// Iterate through each unique student name.
		studentNameMapWithInterpretations.forEach(
			(studentName, studentNameRefId) => {
				// Create a row with the student's name.
				const row = [studentNameRefId];

				// Iterate through each unique date.
				uniqueDates.forEach((date) => {
					let student;

					if (isNaN(date)) {
						student = students_data.find(
							(item) =>
								item.studentNameRefId === studentNameRefId &&
								item.tag === date
						);
					} else {
						// Find the student for the student and date combination.
						student = students_data.find(
							(item) =>
								item.studentNameRefId === studentNameRefId &&
								item.event_date === date &&
								!item.tag
						);
					}
					// Add the student to the row or an empty string if no student is found.
					row.push(student ? student.point : '');
				});
				twoDimensionalArray.push(row);
			}
		);

		return [uniqueDates, twoDimensionalArray];
	}

	async getStudentNamesMapFromStudentsApp() {
		const { students_app_id, students_filters_list } =
			this.scope.field_model.data_model;

		let students = await gudhub.getItems(students_app_id, false);
		students = await FilterItems.ByFilterSettings(
			students,
			this.scope,
			students_filters_list
		);

		const { students_app_name_field_id } =
			this.scope.field_model.data_model;

		const studentsNamesMap = new Map();

		for (const student of students) {
			const raw_student_name = `${students_app_id}.${student.item_id}`;
			const student_name = await gudhub.getInterpretationById(
				students_app_id,
				student.item_id,
				students_app_name_field_id,
				'value'
			);

			studentsNamesMap.set(raw_student_name, student_name);
		}

		return studentsNamesMap;
	}
}

function insertMissingDates(dateArray, dateRange) {
	const resultArray = [];

	if (dateRange) {
		if (dateArray[0] !== dateRange.start) {
			dateArray.unshift(dateRange.start + 86400000);
		}
		if (dateArray[dateArray.length - 1] !== dateRange.end) {
			dateArray.push(dateRange.end);
			console.log(dateRange.end);
		}
	}
	
	const isDateString = (date) => typeof date === 'string';

	for (let i = 0; i < dateArray.length; i++) {
		if (isDateString(dateArray[i])) {
			// Пропускаємо стрічки, додаючи їх без змін
			resultArray.push(dateArray[i]);
		} else {
			resultArray.push(dateArray[i]);

			// Перевіряємо чи є пропущені дати і додаємо їх, якщо потрібно
			if (i < dateArray.length - 1) {
				const currentTimestamp = dateArray[i];
				const nextTimestamp = dateArray[i + 1];
				const diff = nextTimestamp - currentTimestamp;

				if (diff > 86400000) {
					// 86400000 мілісекунд у добі
					const numberOfDays = Math.floor(diff / 86400000);

					for (let j = 1; j < numberOfDays; j++) {
						const missingDate = currentTimestamp + j * 86400000;
						resultArray.push(missingDate);
					}
				}
			}
		}
	}

	return resultArray;
}

async function getLessonsDatesFilteredByCurrentAppSubjectAndClass(
	scope,
	dateRange
) {
	const { appId, itemId, fieldId } = scope;
	const { lessons_filters_list, lessons_date_field_id } =
		scope.field_model.data_model;
	const modifiedFilterList = await gudhub.prefilter(lessons_filters_list, {
		element_app_id: fieldId,
		item_id: itemId,
		app_id: appId
	});
	const lessonItems = await gudhub.getItems(appId);
	const filteredByPagination = await FilterItems.ByPagination(
		lessonItems,
		scope,
		dateRange
	);
	const filteredItems = await gudhub.filter(
		filteredByPagination,
		modifiedFilterList
	);

	const lessonsDates = new Set();

	filteredItems.forEach((item) => {
		const { fields } = item;
		const foundField = fields.find(
			(field) => field.field_id == lessons_date_field_id
		);

		if (!foundField) return;

		const { field_value } = foundField;

		if (isNaN(+field_value)) return;

		const date = new Date(+field_value);
		const dateWithout_time = date.setHours(0, 0, 0, 0);

		lessonsDates.add(dateWithout_time);
	});

	return [...lessonsDates].sort((a, b) => new Date(a) - new Date(b));
}

function mergeSortedDateArrays(dataArray, additionalArray) {
	if (dataArray.length === 0) return additionalArray.slice();
	if (additionalArray.length === 0) return dataArray.slice();

	const resultArray = [];
	let dataIndex = 0;
	let additionalIndex = 0;

	while (
		dataIndex < dataArray.length &&
		additionalIndex < additionalArray.length
	) {
		const dataElement = dataArray[dataIndex];
		const additionalElement = additionalArray[additionalIndex];

		if (
			typeof dataElement === 'string' &&
			typeof additionalElement === 'string'
		) {
			// Both elements are strings
			resultArray.push(dataElement);
			dataIndex++;
		} else if (typeof dataElement === 'string') {
			// Only dataElement is a string
			resultArray.push(dataElement);
			dataIndex++;
		} else if (typeof additionalElement === 'string') {
			// Only additionalElement is a string
			resultArray.push(additionalElement);
			additionalIndex++;
		} else {
			// Both elements are numbers (dates)
			if (dataElement === additionalElement) {
				resultArray.push(dataElement);
				dataIndex++;
				additionalIndex++;
			} else if (dataElement < additionalElement) {
				resultArray.push(dataElement);
				dataIndex++;
			} else {
				resultArray.push(additionalElement);
				additionalIndex++;
			}
		}
	}

	// Add remaining elements from dataArray
	while (dataIndex < dataArray.length) {
		const dataElement = dataArray[dataIndex];
		if (!resultArray.includes(dataElement)) {
			resultArray.push(dataElement);
		}
		dataIndex++;
	}

	// Add remaining elements from additionalArray
	while (additionalIndex < additionalArray.length) {
		const additionalElement = additionalArray[additionalIndex];
		if (!resultArray.includes(additionalElement)) {
			resultArray.push(additionalElement);
		}
		additionalIndex++;
	}

	return resultArray;
}
