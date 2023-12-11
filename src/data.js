import "./studyjournal.webcomponent.js";

export default class GhStudyJournalData {
	/*------------------------------- FIELD TEMPLATE --------------------------------------*/

	getTemplate() {
		return {
			constructor: "field",
			name: "Study Journal",
			icon: "text_icon",
			model: {
				field_id: 0,
				field_name: "Study Journal",
				field_value: "",
				data_type: "study_journal",
				data_model: {
					students_app_id: null,
					students_app_name_field_id: null,
					students_filters_list: [],
					journal_app_id: null,
					student_name_field_id: null,
					point_field_id: null,
					event_date_field_id: null,
					tag_field_id: null,
					isPaginationEnabled: 0,
					points_filters_list: [],
					sorting_type: "asc",
					view_id: null,
					interpretation: [
						{
							src: "form",
							id: "default",
							settings: {
								editable: 1,
								show_field_name: 1,
								show_field: 1,
							},
							style: { position: "beetwen" },
						},
					],
				},
			},
		};
	}

	/*------------------------------- INTERPRETATION --------------------------------------*/

	getInterpretation(gudhub, value, appId, itemId, field_model) {
		return [
			{
				id: "default",
				name: "Default",
				content: () =>
					'<gh-study-journal app-id="{{appId}}" item-id="{{itemId}}" field-id="{{fieldId}}"></gh-study-journal>',
			},
			{
				id: "value",
				name: "Value",
				content: () => value,
			},
		];
	}

	/*--------------------------  SETTINGS --------------------------------*/

	getSettings(scope) {
		return [
			{
				title: "Options",
				type: "general_setting",
				icon: "menu",
				columns_list: [
					[],
					[
						{
							title: "Students Settings",
							type: "header",
						},
						{
							type: "ghElement",
							property: "data_model.students_app_id",
							data_model: function () {
								return {
									data_type: "app",
									field_name: "Students App",
									name_space: "students_app",
									data_model: {
										current_app: false,
										interpretation: [
											{
												src: "form",
												id: "with_text",
												settings: {
													editable: 1,
													show_field_name: 1,
													show_field: 1,
												},
											},
										],
									},
								};
							},
						},
						{
							type: "ghElement",
							property: "data_model.students_app_name_field_id",
							data_model: function (fieldModel) {
								return {
									data_type: "field",
									field_name: "Student Full Name",
									name_space: "student_full_name",
									data_model: {
										app_id: fieldModel.data_model
											.students_app_id,
									},
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
							},
						},
						{
							title: "Students Filter",
							type: "header",
						},
						{
							type: "html",
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
											.students_app_id,
									},
								};
							},
							control:
								'<gh-filter gh-filter-data-model="field_model" filter-list="fieldModel.data_model.students_filters_list" gh-mode="variable"></gh-filter>',
						},
					],
					[
						{
							title: "Journal Settings",
							type: "header",
						},
						{
							type: "ghElement",
							property: "data_model.journal_app_id",
							data_model: function () {
								return {
									data_type: "app",
									field_name: "Journal App",
									name_space: "journal_app",
									data_model: {
										current_app: false,
										interpretation: [
											{
												src: "form",
												id: "with_text",
												settings: {
													editable: 1,
													show_field_name: 1,
													show_field: 1,
												},
											},
										],
									},
								};
							},
						},
						{
							type: "ghElement",
							property: "data_model.student_name_field_id",
							data_model: function (fieldModel) {
								return {
									data_type: "field",
									field_name: "Student Name",
									name_space: "student_name",
									data_model: {
										app_id: fieldModel.data_model
											.journal_app_id,
									},
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
							},
						},
						{
							type: "ghElement",
							property: "data_model.point_field_id",
							data_model: function (fieldModel) {
								return {
									data_type: "field",
									field_name: "Point",
									name_space: "point",
									data_model: {
										app_id: fieldModel.data_model
											.journal_app_id,
									},
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
							},
						},
						{
							type: "ghElement",
							property: "data_model.event_date_field_id",
							data_model: function (fieldModel) {
								return {
									data_type: "field",
									field_name: "Event Date",
									name_space: "event_date",
									data_model: {
										app_id: fieldModel.data_model
											.journal_app_id,
									},
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
							},
						},
						{
							type: "ghElement",
							property: "data_model.tag_field_id",
							data_model: function (fieldModel) {
								return {
									data_type: "field",
									field_name: "Tag",
									name_space: "tag",
									data_model: {
										app_id: fieldModel.data_model
											.journal_app_id,
									},
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
							},
						},
						{
							type: "ghElement",
							property: "data_model.isPaginationEnabled",
							data_model() {
								return {
									field_name: "Items Pagination",
									name_space: "Items Pagination",
									data_type: "boolean",
									data_model: {},
								};
							},
						},
						{
							title: "Journal Filter",
							type: "header",
						},
						{
							type: "html",
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
											.journal_app_id,
									},
								};
							},
							control:
								'<gh-filter gh-filter-data-model="field_model" filter-list="fieldModel.data_model.points_filters_list" gh-mode="variable"></gh-filter>',
						},
						{
							type: "ghElement",
							property: "data_model.sorting_type",
							data_model() {
								return {
									field_name: "Sorting Type",
									name_space: "sorting_type",
									data_type: "text_opt",
									data_model: {
										options: [
											{
												name: "Ascending",
												value: "asc",
											},
											{
												name: "Descending",
												value: "desc",
											},
										],
									},
								};
							},
						},
					],
					[
						{
							title: "Items Settings",
							type: "header",
						},
						{
							type: "ghElement",
							property: "data_model.view_id",
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
											.journal_app_id,
									},
									field_name: "View name",
									name_space: "view_name",
									data_type: "view_list",
								};
							},
						},
					],
				],
			},
		];
	}
}
