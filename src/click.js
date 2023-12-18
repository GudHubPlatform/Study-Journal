import SubjectDataPreparation from './DataPreparation/Subject.js';
import StudentDataPreparation from './DataPreparation/Student.js';
import { FilterItems } from './utils/FilterItems.js';

export default function createCellClickCallback() {
	const { scope } = this;
	const dataPreparation = this.dataPreparation;

	return async function handleMouseClick(event, coords) {
		if (event.which !== 1) {
			return;
		}

		const { row, col } = coords;

		if (row < 0 || col < 1) {
			return;
		}

		const {
			journal_app_id,
			view_id,
			student_name_field_id,
			event_date_field_id,
			tag_field_id
		} = scope.field_model.data_model;

		const rowMetadata = this.getCellMeta(row, 0).metadata;
		const colHeaderMetadata = this.getCellMeta(0, col).metadata;
		const isTag = isNaN(colHeaderMetadata);

		const dateInMilliseconds = isTag
			? findPreviousDateMetadata(col)
			: colHeaderMetadata;

		const items = await gudhub.getItems(journal_app_id, false);

		const filterList = await buildFilterList(
			scope,
			isTag,
			colHeaderMetadata,
			rowMetadata,
			dataPreparation
		);

		const filteredItemsBySettingsFilter =
			await FilterItems.ByFilterSettings(
				items,
				scope,
				scope.field_model.data_model.points_filters_list
			);

		const filteredItems = await gudhub.filter(
			filteredItemsBySettingsFilter,
			filterList
		);

		const viewId = view_id;

		if (filteredItems.length === 0) {
			const fields = {
				[student_name_field_id]: rowMetadata,
				[event_date_field_id]: dateInMilliseconds
			};

			const currentItem = await gudhub.getItem(scope.appId, scope.itemId);

			// add currentItem as lesson
			const { fieldForReference } = scope.field_model.data_model;
			if (fieldForReference) {
				fields[fieldForReference] = [scope.appId, scope.itemId].join('.');
			}

			//add fields of source:destination options
			const sourceAndDestinationArray = scope.field_model.data_model.fieldToFieldOptions;
			
			sourceAndDestinationArray.forEach(({ source_field_id, dest_field_id }) => {
				const foundField = currentItem.fields.find((field => field.field_id == source_field_id));
				
				if (foundField) {
					fields[dest_field_id] = foundField.field_value;
				}
			});

			if (isTag) {
				fields[tag_field_id] = colHeaderMetadata;
			}

			const fieldModel = {
				appId: journal_app_id,
				viewId,
				fields
			};

			showGhDialog(fieldModel);
		} else {
			const { item_id, fields } = filteredItems[0];
			const fieldsObject = getFieldsObject(fields);

			const fieldModel = {
				appId: journal_app_id,
				itemId: item_id,
				viewId,
				fields: fieldsObject
			};

			showGhDialog(fieldModel);
		}
	};
}

function findPreviousDateMetadata(col) {
	let dateMetadata;
	let minusIndex = 1;

	while (isNaN(dateMetadata)) {
		dateMetadata = this.getCellMeta(0, col - minusIndex).metadata;
		minusIndex++;
	}

	return dateMetadata;
}

function createFormattedDateRange(dateInMilliseconds) {
	const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
	return `${dateInMilliseconds}:${dateInMilliseconds + oneDayInMilliseconds}`;
}

async function buildFilterList(
	scope,
	isTag,
	colHeaderMetadata,
	rowMetadata,
	dataPreparation
) {
	const {
		journal_app_id,
		tag_field_id,
		event_date_field_id,
		student_name_field_id,
	} = scope.field_model.data_model;
	const tagFieldInfo = await gudhub.getField(journal_app_id, tag_field_id);
	const eventDateFieldInfo = await gudhub.getField(
		journal_app_id,
		event_date_field_id
	);

	const baseFilterList = [
		{
			data_type: tagFieldInfo.data_type,
			field_id: tagFieldInfo.field_id,
			search_type: isTag ? 'equal_and' : 'value',
			selected_search_option_variable: 'Value',
			valuesArray: isTag ? [colHeaderMetadata] : ['false']
		},
		{
			data_type: eventDateFieldInfo.data_type,
			field_id: eventDateFieldInfo.field_id,
			search_type: 'range',
			selected_search_option_variable: 'Value',
			valuesArray: [createFormattedDateRange(colHeaderMetadata)]
		}
	];

	if (dataPreparation instanceof SubjectDataPreparation) {
		const nameFieldInfo = await gudhub.getField(
			journal_app_id,
			student_name_field_id
		);

		if (nameFieldInfo) {
			const nameFilter = {
				data_type: nameFieldInfo.data_type,
				field_id: student_name_field_id,
				search_type: 'equal_and',
				selected_search_option_variable: 'Value',
				valuesArray: [rowMetadata]
			};
			baseFilterList.push(nameFilter);
		}
	} else if (dataPreparation instanceof StudentDataPreparation) {
		const subjectFilter = {
			data_type: 'item_ref',
			field_id: scope.field_model.data_model.subject_field_id,
			search_type: 'equal_or',
			selected_search_option_variable: 'Value',
			valuesArray: [rowMetadata]
		};

		const appCurrentStudentFilter =
			await FilterItems.getFilterListAppCurrentStudentRefId(scope);

		baseFilterList.push(subjectFilter, ...appCurrentStudentFilter);
	}

	return baseFilterList;
}

function getFieldsObject(fields) {
	const fieldsObject = {};
	fields.forEach(({ element_id, field_value }) => {
		fieldsObject[element_id] = field_value;
	});
	return fieldsObject;
}

function onApplyFunction(item) {
	const { appId } = this.fieldModel;
	const fields = [];

	for (const [element_id, value] of Object.entries(item.fields)) {
		fields.push({ field_id: element_id, field_value: value });
	}

	const itemData = {
		fields
	};

	// if item doesnt have [itemId], then we need to create
	if (item.itemId) {
		itemData.item_id = item.itemId;
		gudhub.updateItems(appId, [itemData]);
	} else {
		gudhub.addNewItems(appId, [itemData]);
	}

	this.cancel();
}

function showGhDialog(fieldModel) {
	const GhDialog = gudhub.ghconstructor.angularInjector.get('GhDialog');

	GhDialog.show({
		position: 'center',
		toolbar: false,
		template: {
			toolbar: '',
			content: `
            <div class="update_container">
                <div class="cancel-container">
                    <span gh-icon="cross 0893d2 25px normal" ng-click="cancel()"></span>
                </div>
                <div class="update_container_view_block">
                    <gh-view class="ghViewNew" app-id="{{fieldModel.appId}}" view-id="{{fieldModel.viewId}}" fields="fieldModel.fields"></gh-view>
                </div>
                <div class="update_container_btn">
                    <button ng-click="onApplyFunction(fieldModel)" type="button" class="btn btn-grean">Apply</button>
                    <button ng-click="cancel()" type="button" class="btn btn-blue-reverse">Cancel</button>
                </div>
            </div>`
		},
		locals: {
			fieldModel
		},
		controller: [
			'$scope',
			'fieldModel',
			function ($scope, fieldModel) {
				$scope.fieldModel = angular.copy(fieldModel);

				$scope.onApplyFunction = onApplyFunction.bind($scope);
			}
		]
	});
}
