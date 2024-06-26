export class FilterItems {
	static async ByFilterSettings(items, scope, filters_list) {
		const modifiedFilterList = await gudhub.prefilter(filters_list, {
			element_app_id: scope.appId,
			item_id: scope.itemId,
			app_id: scope.appId
		});

		if (modifiedFilterList.length === 0) {
			return items;
		}

		const filtered_items = await gudhub.filter(items, modifiedFilterList);

		return filtered_items;
	}

	static async getFilterListAppCurrentStudentRefId(scope) {
		const { appId, itemId } = scope;
		const { student_name_field_id } = scope.field_model.data_model;
		const currentStudentRefId = [appId, itemId].join('.');
		const byStudentFilter = [
			{
				data_type: 'item_ref',
				field_id: student_name_field_id,
				search_type: 'equal_or',
				selected_search_option_variable: 'Value',
				valuesArray: [currentStudentRefId]
			}
		];

		return byStudentFilter;
	}

	static async ByPagination(items, app_id, date_field_id, dateRange) {
		if (!dateRange) return items;

		const eventDateFieldInfo = await gudhub.getField(
			app_id,
			date_field_id
		);

		if (!eventDateFieldInfo) {
			return items;
		}

		const { start, end } = dateRange;

		const filterList = [
			{
				data_type: eventDateFieldInfo.data_type,
				field_id: date_field_id,
				search_type: 'range',
				selected_search_option_variable: 'Value',
				valuesArray: [`${start}: ${end}`]
			}
		];

		const filteredItems = await gudhub.filter(items, filterList);

		return filteredItems;
	}
}
