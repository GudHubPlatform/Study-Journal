export default class DataPreparation {

    constructor(scope) {
        this.scope = scope;
        this.interpretatedData;
        this.items;
    };

    async getTableData(dateRange) {
        if (!this.items) await this.initializeItems();
        //filter by user pagination
        const filtered_items = await this.filterItemsByPagination(this.items, dateRange);
        const interpretated_visual_items = await this.getInterpretatedData(filtered_items);

        if (!interpretated_visual_items) return [];

        //if interpretatedData = undefined, then take fake data (like demo view)
        const [uniqueDatesMilliseconds, students_data, studentNameMapWithInterpretations] = this.prepareTableData(interpretated_visual_items);
    
        return [uniqueDatesMilliseconds, students_data, studentNameMapWithInterpretations];
    };

    async initializeItems() {
        const { journal_app_id } = this.scope.field_model.data_model;
      
        if (!journal_app_id) {
          return;
        }
      
        let items = await gudhub.getItems(journal_app_id, false);

        items = await this.filterItemsByFilterSettings(items);

        this.items = items;
    }

    async getInterpretatedData(items) {
        const { journal_app_id, student_name_field_id, point_field_id, event_date_field_id } = this.scope.field_model.data_model;

        if (!journal_app_id || !student_name_field_id || !point_field_id || !event_date_field_id) {
          return;
        }

        const students_data = [];
        const studentNameMapWithInterpretations = new Map(); // To store: non-interpretated name => interpretated name
      
        for (const item of items) {
          const { item_id } = item;
      
          if (item.fields.length === 0) continue;

          const student_name_field = item.fields.find(({field_id}) => field_id == student_name_field_id);

          const raw_student_name = student_name_field.field_value;
          const point = await gudhub.getInterpretationById(journal_app_id, item_id, point_field_id, 'value');
          const event_date = await gudhub.getInterpretationById(journal_app_id, item_id, event_date_field_id, 'value');
      
          // set hours, minutes, seconds to 0
          const date_without_time = new Date(event_date).setHours(0, 0, 0, 0);
      
          const student_values = [];
      
          for (const value of [raw_student_name, point, date_without_time]) {
            if (value !== null) {
              student_values.push(value);
            }
          }
      
          students_data.push(student_values);
      
          const student_name = await gudhub.getInterpretationById(journal_app_id, item_id, student_name_field_id, 'value');

          // Save the non-interpreted name (to add it as metadata in namecell) alongside the interpreted one
          studentNameMapWithInterpretations.set(raw_student_name, student_name);
        }
      
        return { students_data, studentNameMapWithInterpretations };
      }
      
    prepareTableData(data) {
        const {students_data, studentNameMapWithInterpretations} = data;

        students_data.sort((a, b) => new Date(a[2]) - new Date(b[2]));
      
        const uniqueDatesMilliseconds = [...new Set(students_data.map(item => item[2]))];
        const uniqueStudentNames = [...new Set(students_data.map(item => item[0]))];
      
        const twoDimensionalArray = [];
      
        // Iterate through each unique student name.
        uniqueStudentNames.forEach(rawStudentName => {
          // Create a row with the student's name.
          const row = [rawStudentName];
      
          // Iterate through each unique date.
          uniqueDatesMilliseconds.forEach(date => {
            // Find the mark for the student and date combination.
            const mark = students_data.find(item => item[0] === rawStudentName && item[2] === date);
      
            // Add the mark to the row or an empty string if no mark is found.
            row.push(mark ? mark[1] : '');
          });
      
          twoDimensionalArray.push(row);
        });
      
        return [uniqueDatesMilliseconds, twoDimensionalArray, studentNameMapWithInterpretations];
    }

    async filterItemsByFilterSettings(items) {
      const {filters_list} = this.scope.field_model.data_model;

        const modifiedFilterList = await gudhub.prefilter(filters_list, {
          element_app_id: this.scope.field_model.data_model.journal_app_id,
          item_id: this.scope.itemId,
          app_id: this.scope.field_model.journal_app_id,
        });
      
        const filtered_items = await gudhub.filter(items, modifiedFilterList);

        return filtered_items;
    }

    async filterItemsByPagination(items, dateRange) {

      if (!dateRange) return items;

      const { journal_app_id, event_date_field_id } = this.scope.field_model.data_model;

      const eventDateFieldInfo = await gudhub.getField(journal_app_id, event_date_field_id);

      if (!eventDateFieldInfo) {
        return items;
      }

      const { start, end } = dateRange;

      const filterList = [{
        "data_type": eventDateFieldInfo.data_type,
        "field_id": event_date_field_id,
        'search_type': "range",
        "selected_search_option_variable": "Value",
        "valuesArray": [`${start}: ${end}`]
      }];

      const filteredItems = await gudhub.filter(items, filterList);

      return filteredItems;
    }
}