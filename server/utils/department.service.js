const DEPARTMENT_ALIAS_GROUPS = Object.freeze({
  CSE: ["cs", "cse", "computerscience", "computerscienceengineering"],
  IT: ["it", "informationtechnology"],
  AIML: ["al", "aiml", "artificialintelligenceandmachinelearning"],
  AIDS: ["ad", "ai", "aids", "artificialintelligenceanddatascience"],
  EEE: ["ee", "eee", "electricalandelectronicsengineering"],
  ECE: ["ec", "ece", "electronicsandcommunicationengineering"],
  FD: ["fd", "fashiondesign"],
  MZ: ["mz"],
  ME: ["me", "mechanicalengineering"],
  CE: ["ce", "civilengineering"],
  BME: ["bm", "bme", "biomedicalengineering"],
  BT: ["bt", "biotechnology"],
  CSBS: ["cb", "csbs", "computerscienceandbusinesssystems"],
  CD: ["cd"],
  CT: ["ct"],
  TT: ["tt", "textiletechnology"],
  AG: ["ag", "agricultureengineering", "agriculturalengineering"],
  FT: ["ft", "foodtechnology"],
  ISE: ["is", "ise", "informationscienceengineering"]
});

const DEPARTMENT_CODE_MAP = Object.freeze(
  Object.entries(DEPARTMENT_ALIAS_GROUPS).reduce((acc, [canonicalCode, aliases]) => {
    acc[canonicalCode.toLowerCase()] = canonicalCode;

    aliases.forEach((alias) => {
      acc[String(alias).toLowerCase()] = canonicalCode;
    });

    return acc;
  }, {})
);

const normalizeDepartmentKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const expandDepartmentCode = (value) => {
  if (value === undefined || value === null) return value;

  const raw = String(value).trim();
  if (!raw) return raw;

  const mapped = DEPARTMENT_CODE_MAP[normalizeDepartmentKey(raw)];
  return mapped || raw;
};

module.exports = {
  DEPARTMENT_CODE_MAP,
  expandDepartmentCode
};
