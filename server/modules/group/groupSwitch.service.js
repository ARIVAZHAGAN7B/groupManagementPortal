const phaseRepo = require("../phase/phase.repository");
const groupRepo = require("./group.repository");

exports.switchGroup = async (studentId, newGroupId) => {
  const phase = await phaseRepo.getCurrentPhase();

  if (!phase) {
    throw new Error("No active phase found");
  }

  const today = new Date().toISOString().split("T")[0];
  const changeDay = new Date(phase.change_day).toISOString().split("T")[0];

  if (today !== changeDay) {
    throw new Error("Group switching is allowed only on Change Day");
  }

  // perform switch
  await groupRepo.updateStudentGroup(studentId, newGroupId);

  return { message: "Group switched successfully" };
};
