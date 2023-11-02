import filterItemsByFilterSettings from "./utils/filterItemsByFilterSettings.js";

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
        const interpretated_filtered_items = await this.getInterpretatedData(filtered_items);

        // get students_names from students_app
        const studentNameMapWithInterpretations = await this.getStudentNamesMapFromStudentsApp();

        //if interpretatedData = undefined, then take fake data (like demo view)
        const [uniqueDates, students_data] = this.prepareTableData(interpretated_filtered_items, studentNameMapWithInterpretations);
    
        return [uniqueDates, students_data, studentNameMapWithInterpretations];
    };

    async initializeItems() {
        const { journal_app_id, points_filters_list } = this.scope.field_model.data_model;
      
        if (!journal_app_id) {
          return;
        }
      
        let items = await gudhub.getItems(journal_app_id, false);
        items = await filterItemsByFilterSettings(items, this.scope, points_filters_list);
        this.items = items;
    }

    async getInterpretatedData(items) {
        const { journal_app_id, student_name_field_id, point_field_id, event_date_field_id, tag_field_id } = this.scope.field_model.data_model;

        if (!journal_app_id || !student_name_field_id || !point_field_id || !event_date_field_id) {
          return;
        }

        const students_data = [];

        for (const item of items) {
          const { item_id } = item;
      
          if (item.fields.length === 0) continue;

          const student_name_field = item.fields.find(({field_id}) => field_id == student_name_field_id);

          const raw_student_name = student_name_field.field_value;
          const point = await gudhub.getInterpretationById(journal_app_id, item_id, point_field_id, 'value');
          const event_date = await gudhub.getInterpretationById(journal_app_id, item_id, event_date_field_id, 'value');
          const tag = await gudhub.getInterpretationById(journal_app_id, item_id, tag_field_id, 'value');
      
          // set hours, minutes, seconds to 0
          const date_without_time = new Date(event_date).setHours(0, 0, 0, 0);
      
          const student_values = [];
      
          for (const value of [raw_student_name, point, date_without_time, tag]) {
            if (value !== null) {
              student_values.push(value);
            } else {
              student_values.push('');
            }
          }
      
          students_data.push(student_values);

          // const student_name = await gudhub.getInterpretationById(journal_app_id, item_id, student_name_field_id, 'value');

          // // Save the non-interpreted name (to add it as metadata in namecell) alongside the interpreted one
          // studentNameMapWithInterpretations.set(raw_student_name, student_name);
        }
      
        return students_data;
      }
      
    prepareTableData(students_data, studentNameMapWithInterpretations) {
        students_data.sort((a, b) => new Date(a[2]) - new Date(b[2]));
      
        const uniqueDatesSet = new Set();

        students_data.forEach((item) => {
          if (item[2]) {
            uniqueDatesSet.add(item[2]);
          }
          if (item[3]) {
            uniqueDatesSet.add(item[3]);
          }
        })

        const uniqueDates = [...uniqueDatesSet];
      
        const twoDimensionalArray = [];
      
        // Iterate through each unique student name.
        studentNameMapWithInterpretations.forEach( (studentName, rawStudentName) => {
          // Create a row with the student's name.
          const row = [rawStudentName];
      
          // Iterate through each unique date.
          uniqueDates.forEach(date => {
            let student;

            if (isNaN(date)) {
              student = students_data.find(item => item[0] === rawStudentName && item[3] === date);
            } else {
              // Find the student for the student and date combination.
              student = students_data.find(item => item[0] === rawStudentName && item[2] === date && !item[3]);
            }
            // Add the student to the row or an empty string if no student is found.
            row.push(student ? student[1] : '');
          });
      
          twoDimensionalArray.push(row);
        });
      
        return [uniqueDates, twoDimensionalArray];
    }

    async getStudentNamesMapFromStudentsApp() {
      const { students_app_id, students_filters_list } = this.scope.field_model.data_model;
      
      let students = await gudhub.getItems(students_app_id, false);
      students = await filterItemsByFilterSettings(students, this.scope, students_filters_list);

      const { students_app_name_field_id } = this.scope.field_model.data_model;

      const studentsNamesMap = new Map();

      for (const student of students) {
          const raw_student_name = `${students_app_id}.${student.item_id}`;
          const student_name = await gudhub.getInterpretationById(students_app_id, student.item_id, students_app_name_field_id, 'value');

          studentsNamesMap.set(raw_student_name, student_name);
      }

      return studentsNamesMap;
    };

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