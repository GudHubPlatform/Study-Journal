import StudentDataPreparation from "./Student.js";
import SubjectDataPreparation from "./Subject.js";

const journalModeToDataPreparationClass = {
  subject: SubjectDataPreparation,
  student: StudentDataPreparation,
};

export default journalModeToDataPreparationClass;
