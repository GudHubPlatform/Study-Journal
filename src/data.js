import './studyjournal.webcomponent.js';

export const journalModes = {
	subject: {
		byDate: 'subjectByDate',
		byLessons: 'subjectByLessons'
	},
	student: 'student'
};

export const showWorkdaysOptions = {
	monFri: '5',
	monSat: '6',
	monSun: '7'
};

export default class GhStudyJournalData {
	/*------------------------------- FIELD TEMPLATE --------------------------------------*/

	getTemplate() {
		return {
			constructor: 'field',
			name: 'Study Journal',
			icon: 'text_icon',
			model: {
				field_id: 0,
				field_name: 'Study Journal',
				field_value: '',
				data_type: 'study_journal',
				data_model: {
					journal_mode: journalModes.subject.byDate,
					showWorkdays: showWorkdaysOptions.monFri,
					lessons_app_id: null,
					lessons_date_field_id: null,
					lessons_filters_list: null,
					students_app_id: null,
					students_app_name_field_id: null,
					students_filters_list: [],
					journal_app_id: null,
					student_name_field_id: null,
					fieldForReference: null,
					subject_field_id: null,
					point_field_id: null,
					event_date_field_id: null,
					tag_field_id: null,
					isPaginationEnabled: 0,
					points_filters_list: [],
					sorting_type: 'asc',
					view_id: null,
					fieldToFieldOptions: [],
					interpretation: [
						{
							src: 'form',
							id: 'default',
							settings: {
								editable: 1,
								show_field_name: 1,
								show_field: 1
							},
							style: { position: 'beetwen' }
						}
					]
				}
			}
		};
	}

	/*------------------------------- INTERPRETATION --------------------------------------*/

	getInterpretation(gudhub, value, appId, itemId, field_model) {
		return [
			{
				id: 'default',
				name: 'Default',
				content: () =>
					'<gh-study-journal app-id="{{appId}}" item-id="{{itemId}}" field-id="{{fieldId}}"></gh-study-journal>'
			},
			{
				id: 'value',
				name: 'Value',
				content: () => value
			}
		];
	}

	/*--------------------------  SETTINGS --------------------------------*/

	getSettings(scope) {
		return [
			{
				title: 'Options',
				type: 'general_setting',
				icon: 'menu',
				columns_list: [
					[
						{
							type: 'ghElement',
							property: 'data_model.view_id',
							onInit: function (settingScope, fieldModel) {
								settingScope.$watch(
									function () {
										return fieldModel.data_model
											.journal_app_id;
									},
									function (newValue) {
										settingScope.field_model.data_model.app_id =
											newValue;
									}
								);
							},
							data_model: function (fieldModel) {
								return {
									data_model: {
										app_id: fieldModel.data_model
											.journal_app_id
									},
									field_name: 'View name',
									name_space: 'view_name',
									data_type: 'view_list'
								};
							}
						},
						{
							type: 'ghElement',
							property: 'data_model.journal_mode',
							data_model() {
								return {
									field_name: 'Journal mode',
									name_space: 'journal_mode',
									data_type: 'text_opt',
									data_model: {
										options: [
											{
												name: 'Subject by lessons',
												value: journalModes.subject
													.byLessons
											},
											{
												name: 'Subject by dates',
												value: journalModes.subject
													.byDate
											},
											{
												name: 'Student',
												value: journalModes.student
											}
										]
									}
								};
							}
						},
						{
							type: 'ghElement',
							property: 'data_model.showWorkdays',
							data_model() {
								return {
									field_name: 'Show workdays',
									name_space: 'show_workdays',
									data_type: 'text_opt',
									data_model: {
										options: [
											{
												name: 'Show Mon - Fri',
												value: showWorkdaysOptions.monFri,
											},
											{
												name: 'Show Mon - Sat',
												value: showWorkdaysOptions.monSat
											},
											{
												name: 'Show Mon - Sun',
												value: showWorkdaysOptions.monSun
											}
										]
									}
								};
							}
						},
						{
							showIf: `data_model.journal_mode === '${journalModes.subject.byLessons}'`,
							title: 'Lessons Settings',
							type: 'header'
						},
						{
							showIf: `data_model.journal_mode === '${journalModes.subject.byLessons}'`,
							type: 'ghElement',
							property: 'data_model.lessons_app_id',
							data_model: function () {
								return {
									data_type: 'app',
									field_name: 'Lessons App',
									name_space: 'lessons_app',
									data_model: {
										current_app: false,
										interpretation: [
											{
												src: 'form',
												id: 'with_text',
												settings: {
													editable: 1,
													show_field_name: 1,
													show_field: 1
												}
											}
										]
									}
								};
							}
						},
						{
							showIf: `data_model.journal_mode === '${journalModes.subject.byLessons}'`,
							type: 'ghElement',
							property: 'data_model.lessons_date_field_id',
							data_model: function (fieldModel) {
								return {
									data_type: 'field',
									field_name: 'Student Full Name',
									name_space: 'student_full_name',
									data_model: {
										app_id: fieldModel.data_model
											.lessons_app_id
									}
								};
							},
							onInit: function (settingScope, fieldModel) {
								settingScope.$watch(
									function () {
										return fieldModel.data_model
											.lessons_app_id;
									},
									function (newValue) {
										settingScope.field_model.data_model.app_id =
											newValue;
									}
								);
							}
						},
						{
							showIf: `data_model.journal_mode === '${journalModes.subject.byLessons}'`,
							title: 'Lessons Filter',
							type: 'header'
						},
						{
							showIf: `data_model.journal_mode === '${journalModes.subject.byLessons}'`,
							type: 'html',
							onInit: function (settingScope) {
								settingScope.$watch(
									function () {
										return settingScope.fieldModel
											.data_model.lessons_app_id;
									},
									function (newValue) {
										settingScope.field_model.data_model.app_id =
											newValue;
									}
								);
							},
							data_model: function (fieldModel) {
								return {
									recipient: {
										app_id: fieldModel.data_model
											.lessons_app_id
									}
								};
							},
							control:
								'<gh-filter gh-filter-data-model="field_model" filter-list="fieldModel.data_model.lessons_filters_list" gh-mode="variable"></gh-filter>'
						}
					],
					[
						{
							title: 'Students Settings',
							type: 'header'
						},
						{
							type: 'ghElement',
							property: 'data_model.students_app_id',
							data_model: function () {
								return {
									data_type: 'app',
									field_name: 'Students App',
									name_space: 'students_app',
									data_model: {
										current_app: false,
										interpretation: [
											{
												src: 'form',
												id: 'with_text',
												settings: {
													editable: 1,
													show_field_name: 1,
													show_field: 1
												}
											}
										]
									}
								};
							}
						},
						{
							type: 'ghElement',
							property: 'data_model.students_app_name_field_id',
							data_model: function (fieldModel) {
								return {
									data_type: 'field',
									field_name: 'Student Full Name',
									name_space: 'student_full_name',
									data_model: {
										app_id: fieldModel.data_model
											.students_app_id
									}
								};
							},
							onInit: function (settingScope, fieldModel) {
								settingScope.$watch(
									function () {
										return fieldModel.data_model
											.students_app_id;
									},
									function (newValue) {
										settingScope.field_model.data_model.app_id =
											newValue;
									}
								);
							}
						},
						{
							title: 'Students Filter',
							type: 'header'
						},
						{
							type: 'html',
							onInit: function (settingScope) {
								settingScope.$watch(
									function () {
										return settingScope.fieldModel
											.data_model.students_app_id;
									},
									function (newValue) {
										settingScope.field_model.data_model.app_id =
											newValue;
									}
								);
							},
							data_model: function (fieldModel) {
								return {
									recipient: {
										app_id: fieldModel.data_model
											.students_app_id
									}
								};
							},
							control:
								'<gh-filter gh-filter-data-model="field_model" filter-list="fieldModel.data_model.students_filters_list" gh-mode="variable"></gh-filter>'
						}
					],
					[
						{
							title: 'Journal Settings',
							type: 'header'
						},
						{
							type: 'ghElement',
							property: 'data_model.journal_app_id',
							data_model: function () {
								return {
									data_type: 'app',
									field_name: 'Journal App',
									name_space: 'journal_app',
									data_model: {
										current_app: false,
										interpretation: [
											{
												src: 'form',
												id: 'with_text',
												settings: {
													editable: 1,
													show_field_name: 1,
													show_field: 1
												}
											}
										]
									}
								};
							}
						},
						{
							type: 'ghElement',
							property: 'data_model.student_name_field_id',
							data_model: function (fieldModel) {
								return {
									data_type: 'field',
									field_name: 'Student Name',
									name_space: 'student_name',
									data_model: {
										app_id: fieldModel.data_model
											.journal_app_id
									}
								};
							},
							onInit: function (settingScope, fieldModel) {
								settingScope.$watch(
									function () {
										return fieldModel.data_model
											.journal_app_id;
									},
									function (newValue) {
										settingScope.field_model.data_model.app_id =
											newValue;
									}
								);
							}
						},
						{
							type: 'ghElement',
							property: 'data_model.fieldForReference',
							data_model: function (fieldModel) {
								return {
									data_type: 'field',
									field_name: 'Field for refference',
									name_space: 'field_for_refference',
									data_model: {
										app_id: fieldModel.data_model
											.journal_app_id
									}
								};
							},
							onInit: function (settingScope, fieldModel) {
								settingScope.$watch(
									function () {
										return fieldModel.data_model
											.journal_app_id;
									},
									function (newValue) {
										settingScope.field_model.data_model.app_id =
											newValue;
									}
								);
							}
						},
						{
							showIf: `data_model.journal_mode === '${journalModes.subject.byLessons}'`,
							type: 'ghElement',
							property: 'data_model.subject_field_id',
							data_model: function (fieldModel) {
								return {
									data_type: 'field',
									field_name: 'Subject',
									name_space: 'subject',
									data_model: {
										app_id: fieldModel.data_model
											.journal_app_id
									}
								};
							},
							onInit: function (settingScope, fieldModel) {
								settingScope.$watch(
									function () {
										return fieldModel.data_model
											.journal_app_id;
									},
									function (newValue) {
										settingScope.field_model.data_model.app_id =
											newValue;
									}
								);
							}
						},
						{
							type: 'ghElement',
							property: 'data_model.point_field_id',
							data_model: function (fieldModel) {
								return {
									data_type: 'field',
									field_name: 'Point',
									name_space: 'point',
									data_model: {
										app_id: fieldModel.data_model
											.journal_app_id
									}
								};
							},
							onInit: function (settingScope, fieldModel) {
								settingScope.$watch(
									function () {
										return fieldModel.data_model
											.journal_app_id;
									},
									function (newValue) {
										settingScope.field_model.data_model.app_id =
											newValue;
									}
								);
							}
						},
						{
							type: 'ghElement',
							property: 'data_model.event_date_field_id',
							data_model: function (fieldModel) {
								return {
									data_type: 'field',
									field_name: 'Event Date',
									name_space: 'event_date',
									data_model: {
										app_id: fieldModel.data_model
											.journal_app_id
									}
								};
							},
							onInit: function (settingScope, fieldModel) {
								settingScope.$watch(
									function () {
										return fieldModel.data_model
											.journal_app_id;
									},
									function (newValue) {
										settingScope.field_model.data_model.app_id =
											newValue;
									}
								);
							}
						},
						{
							type: 'ghElement',
							property: 'data_model.tag_field_id',
							data_model: function (fieldModel) {
								return {
									data_type: 'field',
									field_name: 'Tag',
									name_space: 'tag',
									data_model: {
										app_id: fieldModel.data_model
											.journal_app_id
									}
								};
							},
							onInit: function (settingScope, fieldModel) {
								settingScope.$watch(
									function () {
										return fieldModel.data_model
											.journal_app_id;
									},
									function (newValue) {
										settingScope.field_model.data_model.app_id =
											newValue;
									}
								);
							}
						},
						{
							type: 'ghElement',
							property: 'data_model.isPaginationEnabled',
							data_model() {
								return {
									field_name: 'Items Pagination',
									name_space: 'Items Pagination',
									data_type: 'boolean',
									data_model: {}
								};
							}
						},
						{
							title: 'Journal Filter',
							type: 'header'
						},
						{
							type: 'html',
							onInit: function (settingScope) {
								settingScope.$watch(
									function () {
										return settingScope.fieldModel
											.data_model.journal_app_id;
									},
									function (newValue) {
										settingScope.field_model.data_model.app_id =
											newValue;
									}
								);
							},
							data_model: function (fieldModel) {
								return {
									recipient: {
										app_id: fieldModel.data_model
											.journal_app_id
									}
								};
							},
							control:
								'<gh-filter gh-filter-data-model="field_model" filter-list="fieldModel.data_model.points_filters_list" gh-mode="variable"></gh-filter>'
						},
						{
							type: 'ghElement',
							property: 'data_model.sorting_type',
							data_model() {
								return {
									field_name: 'Sorting Type',
									name_space: 'sorting_type',
									data_type: 'text_opt',
									data_model: {
										options: [
											{
												name: 'Ascending',
												value: 'asc'
											},
											{
												name: 'Descending',
												value: 'desc'
											}
										]
									}
								};
							}
						}
					],
					[
						{
							title: 'Item Creation',
							type: 'header'
						},
                        {
                            type: 'html',
                            data_model: function (fieldModel) {
                                return {
									patterns: [{
										property: 'source_field_id',
										prop_name: 'Source Field',
										type: 'field',
										display: true,
										data_model:function(){
											return {
												app_id : scope.appId
											};
										},

									},
									{
										property: 'dest_field_id',
										prop_name: 'Destination Field',
										type: 'field',
										display: true,
										data_model:function(){
											return {
												"app_id" : (fieldModel.data_model.journal_app_id)
											};
										},
									}]
								};
                            },
                            control:
                                '<gh-option-table items="fieldModel.data_model.fieldToFieldOptions" pattern="field_model.patterns"></gh-option-table>',
                        },
					]
				]
			}
		];
	}
}
