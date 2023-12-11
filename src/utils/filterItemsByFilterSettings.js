export default async function filterItemsByFilterSettings(
	items,
	scope,
	filters_list
) {
	const modifiedFilterList = await gudhub.prefilter(filters_list, {
		element_app_id: scope.appId,
		item_id: scope.itemId,
		app_id: scope.appId,
	});

	if (modifiedFilterList.length === 0) {
		return items;
	}

	const filtered_items = await gudhub.filter(items, modifiedFilterList);

	return filtered_items;
}
