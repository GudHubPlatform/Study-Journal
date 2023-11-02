import GhHtmlElement from "@gudhub/gh-html-element";
import html from "./studyjournal.html";
import './style.scss';

import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

import DataPreparation from "./DataPreparation.js";
import DatePagination from "./DatePagination.js";
import filterItemsByFilterSettings from "./utils/filterItemsByFilterSettings.js";

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

        const { journal_app_id, isPaginationEnabled } = this.scope.field_model.data_model;

        this.dataPreparation = new DataPreparation(this.scope);

        this.renderPagination(isPaginationEnabled);

        this.updateTableFunction = () => {
            this.dataPreparation.initializeItems().then(() => {
                this.updateTable();
            });
        };

        gudhub.on('gh_items_update', {journal_app_id}, this.updateTableFunction);
    
        this.renderTable();
    };

    // disconnectedCallback() is called after the component is destroyed
    disconnectedCallback() {
        const {journal_app_id} = this.scope.field_model.data_model;

        gudhub.destroy('gh_items_update', {journal_app_id}, this.updateTableFunction);
    };

    async renderPagination(isPaginationEnabled) {
        const container = this.querySelector('.pagination');

        const handleOnChangePagination = () => {
            this.updateTable();
        };

        this.datePagination = new DatePagination(container, isPaginationEnabled, handleOnChangePagination);
    }

    async renderTable() {
        const container = this.querySelector('.table');

        const customCyrillicCompareFactory = function (sortOrder) {
            return function customCyrillicCompare(value, nextValue) {
                return value.localeCompare(nextValue) * (sortOrder === 'asc' ? 1 : -1);
            };
        }

        const updateColHeaderTH = (col, thElement) => {
            const spanElement = thElement.querySelector('.colHeader');
            if (spanElement) {
                const text = spanElement.textContent.trim();
                if (text.length > 5) {
                    spanElement.textContent = text.split(" ").join("\n");
                }
            }
        };

        this.table = new Handsontable(container, {
            rowHeaders: true,
            width: '100%',
            height: 'auto',
            fixedColumnsStart: 1,
            fixedRowsTop: 0,
            columnHeaderHeight: 90,
            licenseKey: 'non-commercial-and-evaluation',
            afterOnCellMouseUp: this.createCellClickCallback(),
            afterGetColHeader: updateColHeaderTH,
            columnSorting: {
                indicator: false,
                headerAction: false,
                compareFunctionFactory: (sortOrder) => {
                    return customCyrillicCompareFactory(sortOrder);
                }
            },
            
        });

        // set table data after table creation
        this.updateTable();
    };

    async updateTable() {
        const dateRange = this.datePagination?.currentDateRange;
        const [uniqueDates, students_data, studentNameMapWithInterpretations] = await this.dataPreparation.getTableData(dateRange);

        if (!uniqueDates || !students_data || !studentNameMapWithInterpretations) return;

        const formated_dates = uniqueDates.map((date) => {
            if (isNaN(date)) {
                return date;
            } else {
                return this.convertMsToDDMM(date);
            }
        });

        // sets dates mm:dd in colHeaders
        this.table.updateSettings({
            colHeaders: ["", ...formated_dates]
        });

        this.table.loadData(students_data);
        
        // Iterate through rows and set rawData as metadata and interpretatedData as cellData for the first column
        const rowCount = this.table.countRows();

        for (let row = 0; row < rowCount; row++) {
            const rowData = this.table.getDataAtCell(row, 0);

            const metadata = rowData;
            
            this.table.setDataAtCell(row, 0, studentNameMapWithInterpretations.get(rowData));
            this.table.setCellMeta(row, 0, 'metadata', metadata);
        }

        this.sortTable(this.scope.field_model.data_model.sorting_type);
        
        // sets date in milliseconds as metadata in first row
        uniqueDates.map((date, col) => {
            this.table.setCellMeta(0, col + 1, 'metadata', date);
        });
    };

    sortTable(sortOrder) {
        const options = {
            column: 0,
            sortOrder: sortOrder === '' ? 'asc' : sortOrder
        };
        this.table.getPlugin('columnSorting').sort(options);
    }

    convertMsToDDMM(milliseconds){
            const date_separator = '/';

            const date = new Date(milliseconds);
            const day = date.getDate();
            const month = date.getMonth() + 1;
    
            return [day, month].join(date_separator);
    };

    createCellClickCallback() {
        const {field_model} = this.scope;

        return async function findFieldByCell(event, coords) {
            //check for mouse left button click
            if (event.which !== 1) {
                return;
            }

            const {row} = coords;
            const {col} = coords;

            // avoid interaction with colHeaders and first column (student names)
            if (row < 0 || col < 1) {
                return;
            }

            const { journal_app_id,
                view_id,
                student_name_field_id,
                event_date_field_id,
                tag_field_id
            } = field_model.data_model;

            const rawName = this.getCellMeta(row, 0).metadata;

            const colHeaderMetadata = this.getCellMeta(0, col).metadata;
            const isTag = isNaN(colHeaderMetadata);

            // if colHeader metadata is NaN, than its tag, dateInMilliseconds will be date from previous colHeader metadata
            const dateInMilliseconds = isTag
                ? (() => {
                    let dateMetadata
                    let minusIndex = 1;

                    while (isNaN(dateMetadata)) {
                        dateMetadata = this.getCellMeta(0, col - minusIndex).metadata;
                        minusIndex++;
                    }

                    return dateMetadata;
                })()
                : colHeaderMetadata;

            const items = await gudhub.getItems(journal_app_id, false);

            const nameFieldInfo = await gudhub.getField(journal_app_id, student_name_field_id);
            const eventDateFieldInfo = await gudhub.getField(journal_app_id, event_date_field_id);
            const tagFieldInfo = await gudhub.getField(journal_app_id, tag_field_id);

            if (!nameFieldInfo) {
                return;
            }

            const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
            const dateRange = `${dateInMilliseconds}:${dateInMilliseconds + oneDayInMilliseconds}`;
            
            const filterList = [{
                "data_type": nameFieldInfo.data_type,
                "field_id": student_name_field_id,
                "search_type": "equal_and",
                "selected_search_option_variable": "Value",
                "valuesArray": [rawName]
            },
            {
                "data_type": eventDateFieldInfo.data_type,
                "field_id": event_date_field_id,
                'search_type': "range",
                "selected_search_option_variable": "Value",
                "valuesArray": [dateRange]
            }];

            if (isTag) {
                //its tag, and we need to add filter for it
                const tagFilter = {
                    "data_type": tagFieldInfo.data_type,
                    "field_id": tag_field_id,
                    "search_type": "equal_and",
                    "selected_search_option_variable": "Value",
                    "valuesArray": [colHeaderMetadata]
                };

                filterList.push(tagFilter);
            } else {
                const noTagFilter = {
                    "data_type": tagFieldInfo.data_type,
                    "field_id": tag_field_id,
                    "search_type": "value",
                    "selected_search_option_variable": "Value",
                    "valuesArray": ["false"]
                }

                filterList.push(noTagFilter);
            }

            // gudhub filter used instead of searching item in items
            const filteredItems = await gudhub.filter(items, filterList);

            // viewId of item edit form
            const viewId = view_id;
            
            // fields in item are objects in array, but gudhub create/update item needs fields in object ({ fieldId : value }) 
            if (filteredItems.length === 0) {
                const fields = {
                    [student_name_field_id]: rawName,
                    [event_date_field_id]: dateInMilliseconds,
                }

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
                const {item_id, fields} = filteredItems[0];

                const fieldsObject = {};
                fields.forEach(({element_id, field_value}) => {
                    fieldsObject[element_id] = field_value;
                });

                const fieldModel = {
                    appId: journal_app_id,
                    itemId: item_id,
                    viewId,
                    fields: fieldsObject
                };

                showGhDialog(fieldModel);
            }
        }
    };
}

function onApplyFunction(item) {
    const {appId} = this.fieldModel;
    const fields = [];
            
    for (const [element_id, value] of Object.entries(item.fields)) {
        fields.push({ field_id: element_id, field_value: value});
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
            fieldModel,
        },
        controller: ['$scope', 'fieldModel', function ($scope, fieldModel) {
        $scope.fieldModel = angular.copy(fieldModel);
        
        $scope.onApplyFunction = onApplyFunction.bind($scope);
        }]
    })
};

// Register web component only if it is not registered yet

if(!customElements.get('gh-study-journal')){
    customElements.define('gh-study-journal', GhStudyJournal);
}