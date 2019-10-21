const { flatten } = require("../utils/arrayUtils");
const { SHARED } = require("../model/platforms");
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
 * @param {*} platforms The platforms to extract.
 */
const normalizeYaml = (data, platforms, languages) => {
  return flatten(
    platforms
      .map(platform => aggregate(data[platform], platform, languages))
      .concat(aggregate(data[SHARED], SHARED, languages))
  );
};

/**
 * Given a YAML structure, aggregate all translations in that structure.
 * Each translation encodes the language, the type of translation,
 * the keypath and the localized copy for the keypath.
 */
const aggregate = (data, platform, languages, keyPath) => {
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
          groupKeywords.COPY in value &&
          processTranslation(language, value[groupKeywords.COPY]);
        return {
          platform: platform,
          language: language,
          keyPath: newKeyPath,
          ...(accessibilty && { [groupKeywords.ACCESSIBILITY]: accessibilty }),
          ...(copy && { [groupKeywords.COPY]: copy })
        };
      });
      return [...acc, ...entries];
    }
    const newKeyPath = [...(keyPath || []), key];
    return [...acc, aggregate(value, platform, languages, newKeyPath)];
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
    translation: value[language]
  };
};

const processPlural = (plurals, language) => {
  const pluralMap = Object.keys(plurals).reduce(
    (result, key) => ({
      ...result,
      [key]: plurals[key][language]
    }),
    {}
  );
  return { type: PLURAL, translation: pluralMap };
};

module.exports = { normalizeYaml, PLURAL, SINGULAR };
