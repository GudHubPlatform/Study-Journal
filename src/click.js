import SubjectDataPreparation from "./DataPreparation/Subject.js";
import StudentDataPreparation from "./DataPreparation/Student.js";
import { FilterItems } from "./utils/FilterItems.js";

export default function createCellClickCallback() {
    const { scope } = this;
    const dataPreparation = this.dataPreparation;

    return async function findFieldByCell(event, coords) {
      //check for mouse left button click
      if (event.which !== 1) {
        return;
      }

      const { row } = coords;
      const { col } = coords;

      // avoid interaction with colHeaders and first column (row names)
      if (row < 0 || col < 1) {
        return;
      }

      const {
        journal_app_id,
        view_id,
        student_name_field_id,
        event_date_field_id,
        tag_field_id,
      } = scope.field_model.data_model;

      const rowMetadata = this.getCellMeta(row, 0).metadata;

      const colHeaderMetadata = this.getCellMeta(0, col).metadata;
      const isTag = isNaN(colHeaderMetadata);

      // if colHeader metadata is NaN, than its tag, dateInMilliseconds will be date from previous colHeader metadata
      const dateInMilliseconds = isTag
        ? (() => {
            let dateMetadata;
            let minusIndex = 1;

            while (isNaN(dateMetadata)) {
              dateMetadata = this.getCellMeta(0, col - minusIndex).metadata;
              minusIndex++;
            }

            return dateMetadata;
          })()
        : colHeaderMetadata;

      const items = await gudhub.getItems(journal_app_id, false);

      const eventDateFieldInfo = await gudhub.getField(
        journal_app_id,
        event_date_field_id,
      );
      const tagFieldInfo = await gudhub.getField(journal_app_id, tag_field_id);

      const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
      const dateRange = `${dateInMilliseconds}:${
        dateInMilliseconds + oneDayInMilliseconds
      }`;

      const filterList = [
        {
          data_type: eventDateFieldInfo.data_type,
          field_id: event_date_field_id,
          search_type: "range",
          selected_search_option_variable: "Value",
          valuesArray: [dateRange],
        },
      ];

      if (dataPreparation instanceof SubjectDataPreparation) {
        const nameFieldInfo = await gudhub.getField(
          journal_app_id,
          student_name_field_id,
        );

        if (!nameFieldInfo) {
          return;
        }
        const nameFilter = {
          data_type: nameFieldInfo.data_type,
          field_id: student_name_field_id,
          search_type: "equal_and",
          selected_search_option_variable: "Value",
          valuesArray: [rowMetadata],
        };
        filterList.push(nameFilter);
      } else if (dataPreparation instanceof StudentDataPreparation) {
        const { subject_field_id } = scope.field_model.data_model;
        const subjectFieldInfo = await gudhub.getField(
          journal_app_id,
          subject_field_id,
        );

        if (!subjectFieldInfo) {
          return;
        }
        const subjectFilter = {
          data_type: "item_ref",
          field_id: subject_field_id,
          search_type: "equal_or",
          selected_search_option_variable: "Value",
          valuesArray: [rowMetadata],
        };

        filterList.push(subjectFilter);
      }

      if (isTag) {
        //its tag, and we need to add filter for it
        const tagFilter = {
          data_type: tagFieldInfo.data_type,
          field_id: tag_field_id,
          search_type: "equal_and",
          selected_search_option_variable: "Value",
          valuesArray: [colHeaderMetadata],
        };

        filterList.push(tagFilter);
      } else {
        const noTagFilter = {
          data_type: tagFieldInfo.data_type,
          field_id: tag_field_id,
          search_type: "value",
          selected_search_option_variable: "Value",
          valuesArray: ["false"],
        };

        filterList.push(noTagFilter);
      }

      const { points_filters_list } = scope.field_model.data_model;
      const filteredItemsBySettingsFilter = await FilterItems.ByFilterSettings(
        items,
        scope,
        points_filters_list,
      );
      // gudhub filter used instead of searching item in items
      const filteredItems = await gudhub.filter(
        filteredItemsBySettingsFilter,
        filterList,
      );

      // viewId of item edit form
      const viewId = view_id;

      // fields in item are objects in array, but gudhub create/update item needs fields in object ({ fieldId : value })
      if (filteredItems.length === 0) {
        const fields = {
          [student_name_field_id]: rowMetadata,
          [event_date_field_id]: dateInMilliseconds,
        };

        if (isTag) {
          fields[tag_field_id] = colHeaderMetadata;
        }

        const fieldModel = {
          appId: journal_app_id,
          viewId,
          fields,
        };

        showGhDialog(fieldModel);
      } else {
        const { item_id, fields } = filteredItems[0];

        const fieldsObject = {};
        fields.forEach(({ element_id, field_value }) => {
          fieldsObject[element_id] = field_value;
        });

        const fieldModel = {
          appId: journal_app_id,
          itemId: item_id,
          viewId,
          fields: fieldsObject,
        };

        showGhDialog(fieldModel);
      }
    };
}

function onApplyFunction(item) {
  const { appId } = this.fieldModel;
  const fields = [];

  for (const [element_id, value] of Object.entries(item.fields)) {
    fields.push({ field_id: element_id, field_value: value });
  }

  const itemData = {
    fields,
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
  const GhDialog = gudhub.ghconstructor.angularInjector.get("GhDialog");

  GhDialog.show({
    position: "center",
    toolbar: false,
    template: {
      toolbar: "",
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
            </div>`,
    },
    locals: {
      fieldModel,
    },
    controller: [
      "$scope",
      "fieldModel",
      function ($scope, fieldModel) {
        $scope.fieldModel = angular.copy(fieldModel);

        $scope.onApplyFunction = onApplyFunction.bind($scope);
      },
    ],
  });
}