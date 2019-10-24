const { flatten } = require("../utils/arrayUtils");
const { mapObject } = require("../utils/objectUtils");
const { SHARED } = require("../model/platforms");

const SINGULAR = "SINGULAR";
const PLURAL = "PLURAL";

/**
 * Normalize YAML to localicious internal representation.
 *
 * @param {*} data The YAML data to normalize.
 * @param {*} platforms The platforms to extract.
 */
const normalizeYaml = (data, platforms) => {
  return flatten(
    platforms
      .map(platform => aggregate(data[platform], platform))
      .concat(aggregate(data[SHARED], SHARED))
  );
};

/**
 * Given a YAML structure, aggregate all translations in that structure.
 * Each translation encodes the language, the type of translation,
 * the keypath and the localized copy for the keypath.
 */
const aggregate = (data, platform, keyPath) => {
  if (data === undefined) {
    return [];
  }

  let result = Object.keys(data).map(key => {
    let value = data[key];
    if (typeof value === "object" && value !== null && key != "plural") {
      var newKeyPath = (keyPath || []).slice(0);
      newKeyPath.push(key);
      return aggregate(value, platform, newKeyPath);
    } else {
      if (key === "plural") {
        return processPlural(keyPath, value, platform);
      }
      return {
        type: SINGULAR,
        platform: platform,
        language: key,
        keyPath: keyPath,
        translation: value
      };
    }
  });
  return flatten(result);
};

const processPlural = (keyPath, plurals, platform) => {
  let pluralPerLanguage = {};
  Object.keys(plurals).forEach(quantity => {
    let obj = mapObject(plurals[quantity], translation => {
      return {
        quantity,
        translation
      };
    });
    Object.keys(obj).forEach(language => {
      if (pluralPerLanguage[language] === undefined) {
        pluralPerLanguage[language] = {
          type: PLURAL,
          platform: platform,
          language,
          keyPath,
          translation: {}
        };
      }
      let quantity = obj[language].quantity;
      let translation = obj[language].translation;
      pluralPerLanguage[language].translation[quantity] = translation;
    });
  });
  return Object.values(pluralPerLanguage);
};

module.exports = { normalizeYaml, PLURAL, SINGULAR };
