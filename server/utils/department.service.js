const DEPARTMENT_CODE_MAP = Object.freeze({
  cs: "CSE",
  it: "IT",
  al: "AIML",
  ad: "AIDS",
  ee: "EEE",
  ec: "ECE",
  fd: "FD",
  mz: "MZ",
  me: "ME",
  ce: "CE",
  bm: "BME",
  bt: "BT",
  cb: "CSBS",
  cd: "CD",
  ct: "CT",
  tt: "TT",
  ag: "AG",
  ft: "FT",
  is: "ISE"
});

const expandDepartmentCode = (value) => {
  if (value === undefined || value === null) return value;

  const raw = String(value).trim();
  if (!raw) return raw;

  const mapped = DEPARTMENT_CODE_MAP[raw.toLowerCase()];
  return mapped || raw;
};

module.exports = {
  DEPARTMENT_CODE_MAP,
  expandDepartmentCode
};
