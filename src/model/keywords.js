const groupKeywords = {
  ACCESSIBILITY: "ACCESSIBILITY",
  COPY: "COPY"
};

const pluralKeywords = {
  ZERO: "ZERO",
  ONE: "ONE",
  OTHER: "OTHER"
};

const accessiblityKeywords = {
  LABEL: "LABEL",
  HINT: "HINT",
  VALUE: "VALUE"
};

const outputType = {
  ANDROID: "ANDROID",
  IOS: "IOS",
  JS: "JS"
};

const isLeafGroup = group => groupKeywords.ACCESSIBILITY in group || groupKeywords.COPY in group;

const isPluralGroup = group =>
  pluralKeywords.ZERO in group || pluralKeywords.ONE in group || pluralKeywords.OTHER in group;

module.exports = {
  groupKeywords,
  accessiblityKeywords,
  outputType,
  isLeafGroup,
  isPluralGroup
};
