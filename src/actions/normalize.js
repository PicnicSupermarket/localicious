const { flatten } = require("../utils/arrayUtils");
const {
  groupKeywords,
  accessiblityKeywords,
  isPluralGroup,
  isLeafGroup
} = require("../model/keywords");

const SINGULAR = "SINGULAR";
const PLURAL = "PLURAL";

/**
 * Normalize YAML to localicious internal representation.
 *
 * @param {*} data The YAML data to normalize.
 * @param {*} languages The languages to be included.
 * @param {*} collections The collections to extract.

 */
const normalizeYaml = (data, languages, collections) => {
  return flatten(collections.map(collection => aggregate(data[collection], languages)));
};

/**
 * Given a YAML structure, aggregate all translations in that structure.
 * Each translation encodes the language, the type of translation,
 * the keypath and the localized copy for the keypath.
 */
const aggregate = (data, languages, keyPath) => {
  if (data === undefined) {
    return [];
  }

  let result = Object.keys(data).reduce((acc, key) => {
    let value = data[key];

    if (isLeafGroup(value)) {
      const newKeyPath = [...keyPath, key];
      const entries = languages.map(language => {
        const accessibilty =
          groupKeywords.ACCESSIBILITY in value &&
          processAccessiblity(language, value[groupKeywords.ACCESSIBILITY]);
        const copy =
          groupKeywords.COPY in value && processTranslation(language, value[groupKeywords.COPY]);
        return {
          language: language,
          keyPath: newKeyPath,
          ...(accessibilty && { [groupKeywords.ACCESSIBILITY]: accessibilty }),
          ...(copy && { [groupKeywords.COPY]: copy })
        };
      });
      return [...acc, ...entries];
    }
    const newKeyPath = [...(keyPath || []), key];
    return [...acc, aggregate(value, languages, newKeyPath)];
  }, []);
  return flatten(result);
};

const processAccessiblity = (language, value) => ({
  ...processAccessiblityItem(accessiblityKeywords.HINT, language, value),
  ...processAccessiblityItem(accessiblityKeywords.LABEL, language, value),
  ...processAccessiblityItem(accessiblityKeywords.VALUE, language, value)
});

const processAccessiblityItem = (keyword, language, value) =>
  keyword in value && {
    [keyword]: processTranslation(language, value[keyword])
  };

const processTranslation = (language, value) => {
  if (isPluralGroup(value)) {
    return processPlural(value, language);
  }
  return {
    type: SINGULAR,
    translation: value[language],
    containsFormatting: isFormattingString(value[language])
  };
};

const processPlural = (plurals, language) => {
  let containsFormatting = false;
  const pluralMap = Object.keys(plurals).reduce((result, key) => {
    const translation = plurals[key][language];
    containsFormatting = containsFormatting || isFormattingString(translation);
    return {
      ...result,
      [key]: translation
    };
  }, {});
  return {
    type: PLURAL,
    translation: pluralMap,
    containsFormatting
  };
};

const isFormattingString = string => string.includes("{{s}}") || string.includes("{{d}}");

module.exports = { normalizeYaml, PLURAL, SINGULAR };
