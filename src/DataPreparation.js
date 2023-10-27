import fakeData from './fakeDataForTable.js';

export default class DataPreparation {

    constructor(scope) {
        this.options = scope.field_model.data_model;
    };

    async getTableData() {
        const interpretatedData = await this.getInterpretatedData();

        //if interpretatedData = undefined, then take fake data (like demo view)
        const [uniqueDatesMilliseconds, students_data, studentNameMapWithInterpretations] = this.preparateTableData(interpretatedData || fakeData);
    
        return [uniqueDatesMilliseconds, students_data, studentNameMapWithInterpretations];
    };

    async getInterpretatedData() {
        const { app_id, student_name_field_id, point_field_id, event_date_field_id } = this.options;
      
        if (!app_id) {
          return;
        }
      
        const items = await gudhub.getItems(app_id, false);
      
        const students_data = [];
        const studentNameMapWithInterpretations = new Map(); // To store: interpretated name => non-interpreted name
      
        for (const item of items) {
          const { item_id } = item;
      
          const student_name = await gudhub.getInterpretationById(app_id, item_id, student_name_field_id, 'value');
          const point = await gudhub.getInterpretationById(app_id, item_id, point_field_id, 'value');
          const event_date = await gudhub.getInterpretationById(app_id, item_id, event_date_field_id, 'value');
      
          // set hours, minutes, seconds to 0
          const date_without_time = new Date(event_date).setHours(0, 0, 0, 0);
      
          const student_values = [];
      
          for (const value of [student_name, point, date_without_time]) {
            if (value !== null) {
              student_values.push(value);
            }
          }
      
          students_data.push(student_values);
      
          const student_name_field = item.fields.find(({field_id}) => field_id == student_name_field_id);

          const raw_student_name = student_name_field.field_value;

          // Save the non-interpreted name (to add it as metadata in namecell) alongside the interpreted one
          studentNameMapWithInterpretations.set(student_name, raw_student_name);
        }
      
        return { students_data, studentNameMapWithInterpretations };
      }
      
    preparateTableData(data) {
        const {students_data, studentNameMapWithInterpretations} = data; 

        students_data.sort((a, b) => new Date(a[2]) - new Date(b[2]));
      
        const uniqueDatesMilliseconds = [...new Set(students_data.map(item => item[2]))];
        const uniqueStudentNames = [...new Set(students_data.map(item => item[0]))];
      
        const twoDimensionalArray = [];
      
        // Iterate through each unique student name.
        uniqueStudentNames.forEach(studentName => {
          // Create a row with the student's name.
          const row = [studentName];
      
          // Iterate through each unique date.
          uniqueDatesMilliseconds.forEach(date => {
            // Find the mark for the student and date combination.
            const mark = students_data.find(item => item[0] === studentName && item[2] === date);
      
            // Add the mark to the row or an empty string if no mark is found.
            row.push(mark ? mark[1] : '');
          });
      
          twoDimensionalArray.push(row);
        });
      
        return [uniqueDatesMilliseconds, twoDimensionalArray, studentNameMapWithInterpretations];
    }
      
}