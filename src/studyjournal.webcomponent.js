import GhHtmlElement from "@gudhub/gh-html-element";
import html from "./studyjournal.html";
import "./style.scss";

import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";

import DataPreparation from "./DataPreparation/index.js";
import DatePagination from "./DatePagination.js";

import createCellClickCallback from './click.js';
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

    this.dataPreparation = new DataPreparation[journal_mode](this.scope);

    this.renderPagination(isPaginationEnabled);

    this.updateTableFunction = () => {
      this.dataPreparation.initializeItems().then(() => {
        this.updateTable();
      });
    };

    gudhub.on("gh_items_update", { journal_app_id }, this.updateTableFunction);

    this.renderTable();
  }

  // disconnectedCallback() is called after the component is destroyed
  disconnectedCallback() {
    const { journal_app_id } = this.scope.field_model.data_model;

    gudhub.destroy(
      "gh_items_update",
      { journal_app_id },
      this.updateTableFunction,
    );
  }

  async renderPagination(isPaginationEnabled) {
    const container = this.querySelector(".pagination");

    const handleOnChangePagination = () => {
      this.updateTable();
    };

    this.datePagination = new DatePagination(
      container,
      isPaginationEnabled,
      handleOnChangePagination,
    );
  }

  async renderTable() {
    const container = this.querySelector(".journal-table");

    const customCyrillicCompareFactory = function (sortOrder) {
      return function customCyrillicCompare(value, nextValue) {
        return value.localeCompare(nextValue) * (sortOrder === "asc" ? 1 : -1);
      };
    };

    const updateColHeaderTH = (col, thElement) => {
      const spanElement = thElement.querySelector(".colHeader");
      if (spanElement) {
        const text = spanElement.textContent.trim();
        if (text.length > 5) {
          spanElement.textContent = text.split(" ").join("\n");
        }
      }
    };

    this.table = new Handsontable(container, {
      rowHeaders: true,
      width: "100%",
      height: "auto",
      fixedColumnsStart: 1,
      fixedRowsTop: 0,
      columnHeaderHeight: 90,
      licenseKey: "non-commercial-and-evaluation",
      afterOnCellMouseUp: createCellClickCallback.call(this),
      afterGetColHeader: updateColHeaderTH,
      columnSorting: {
        indicator: false,
        headerAction: false,
        compareFunctionFactory: (sortOrder) => {
          return customCyrillicCompareFactory(sortOrder);
        },
      },
    });

    // set table data after table creation
    this.updateTable();
  }

  async updateTable() {
    const dateRange = this.datePagination?.currentDateRange;
    const [uniqueDates, students_data, mapRowHeaderItemRefIdAndInterpretation] =
      await this.dataPreparation.getTableData(dateRange);

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
      colHeaders: ["", ...formated_dates],
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
        mapRowHeaderItemRefIdAndInterpretation.get(rowData),
      );
      this.table.setCellMeta(row, 0, "metadata", metadata);
    }

    this.sortTable(this.scope.field_model.data_model.sorting_type);

    // sets date in milliseconds as metadata in first row
    uniqueDates.map((date, col) => {
      this.table.setCellMeta(0, col + 1, "metadata", date);
    });
  }

  sortTable(sortOrder) {
    const options = {
      column: 0,
      sortOrder: sortOrder === "" ? "asc" : sortOrder,
    };
    this.table.getPlugin("columnSorting").sort(options);
  }
}

function convertMsToDDMM(milliseconds) {
  const date_separator = "/";

  const date = new Date(milliseconds);
  const day = date.getDate();
  const month = date.getMonth() + 1;

  return [day, month].join(date_separator);
}

// Register web component only if it is not registered yet

if (!customElements.get("gh-study-journal")) {
  customElements.define("gh-study-journal", GhStudyJournal);
}
