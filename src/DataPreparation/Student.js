import { FilterItems } from '../utils/FilterItems.js';
import { filterDatesWeekends } from '../helpers/filterDatesWeekends.js';

export default class StudentDataPreparation {
	constructor(scope) {
		this.scope = scope;
		this.interpretatedData;
		this.items;
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

		// collect subjectTitleMapRefIdAndInterpretation from journal_app
		const subjectTitleMapRefIdAndInterpretation =
			await this.getSubjectTitleMapRefIdAndInterpretation(filtered_items);

		const [uniqueDates, students_data] = this.prepareTableData(
			interpretated_filtered_items,
			subjectTitleMapRefIdAndInterpretation
		);

		return [
			uniqueDates,
			students_data,
			subjectTitleMapRefIdAndInterpretation
		];
	}

	async initializeItems() {
		const { journal_app_id, points_filters_list, student_name_field_id } =
			this.scope.field_model.data_model;
		const { appId, itemId } = this.scope;

		if (!journal_app_id) {
			return;
		}

		let items = await gudhub.getItems(journal_app_id, false);
		items = await FilterItems.ByFilterSettings(
			items,
			this.scope,
			points_filters_list
		);

		const appCurrentStudentFilter =
			await FilterItems.getFilterListAppCurrentStudentRefId(this.scope);

		items = await gudhub.filter(items, appCurrentStudentFilter);
		this.items = items;
	}

	async getInterpretatedData(items) {
		const {
			journal_app_id,
			subject_field_id,
			point_field_id,
			event_date_field_id,
			tag_field_id
		} = this.scope.field_model.data_model;

		if (
			!journal_app_id ||
			!subject_field_id ||
			!point_field_id ||
			!event_date_field_id
		) {
			return;
		}

		const students_data = [];

		for (const item of items) {
			const { item_id } = item;

			if (item.fields.length === 0) continue;

			const foundSubjectField = item.fields.find(
				(field) => field.field_id == subject_field_id
			);
			const subject = foundSubjectField
				? foundSubjectField.field_value
				: null;

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
				subject,
				point,
				event_date: date_without_time,
				tag
			};

			students_data.push(student_values);
		}

		return students_data;
	}

	async getSubjectTitleMapRefIdAndInterpretation(items) {
		const { journal_app_id, subject_field_id } =
			this.scope.field_model.data_model;
		const map = new Map();
		const promises = [];

		for (const item of items) {
			const foundField = item.fields.find(
				(field) => field.field_id == subject_field_id
			);
			if (!foundField) continue;
			if (!map.has(foundField.field_value)) {
				const promise = gudhub
					.getInterpretationById(
						journal_app_id,
						item.item_id,
						subject_field_id,
						'value'
					)
					.then((value) => map.set(foundField.field_value, value));

				promises.push(promise);
			}
		}

		await Promise.all(promises);

		return map;
	}

	prepareTableData(students_data, subjectTitleMapRefIdAndInterpretation) {
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

		let uniqueDates = [...uniqueDatesSet];
		uniqueDates = filterDatesWeekends(uniqueDates, this.scope);

		const twoDimensionalArray = [];

		// Iterate through each unique subject title.
		subjectTitleMapRefIdAndInterpretation.forEach(
			(subjectTitle, subjectRefId) => {
				// Create a row with the subject title.
				const row = [subjectRefId];

				// Iterate through each unique date.
				uniqueDates.forEach((date) => {
					let student;

					if (isNaN(date)) {
						student = students_data.find(
							(item) =>
								item.subject === subjectRefId &&
								item.tag === date
						);
					} else {
						// Find the student for the student and date combination.
						student = students_data.find((item) => {
							return (
								item.subject === subjectRefId &&
								item.event_date === date &&
								!item.tag
							);
						});
					}

					// Add the subject to the row or an empty string if no student is found.
					row.push(student ? student.point : '');
				});

				twoDimensionalArray.push(row);
			}
		);

		return [uniqueDates, twoDimensionalArray];
	}
}
