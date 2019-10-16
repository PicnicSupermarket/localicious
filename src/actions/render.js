const { groupByKey } = require("../utils/arrayUtils");
const { mapObject } = require("../utils/objectUtils");
const { normalizeYaml, PLURAL, SINGULAR } = require("../utils/normalize");
const { loadFile } = require("../utils/fileUtils");
const Mustache = require("mustache");
const { platforms, SHARED } = require("../model/platforms");
const Result = require("../utils/result");

const render = (data, outputPath, platforms, languages) => {
  const translations = normalizeYaml(data, platforms);
  return languages
    .reduce((acc, language) => {
      let translationsForLanguage = translations.filter(
        translation => translation.language === language
      );
      platforms.forEach(platform => {
        let translationsForPlatform = translationsForLanguage.filter(
          translation => [platform, SHARED].includes(translation.platform)
        );

        let view = viewForPlatform(translationsForPlatform, platform);
        let renderedView = renderPlatform(view, platform, language, outputPath);
        acc.push(renderedView);
      });
      return acc;
    }, [])
    .reduce((acc, result) => {
      return acc.flatMap(value => result.map(r => value.concat([r])));
    }, Result.success([]));
};

const renderPlatform = (view, platform, language, basePath) => {
  return templateForPlatform(platform)
    .map(template => Mustache.render(template, view))
    .map(data => {
      return {
        path: outputPathForPlatform(basePath, platform, language),
        data: data
      };
    });
};

const templateForPlatform = platform => {
  switch (platform) {
    case platforms.ANDROID:
      return loadFile("templates/strings_xml_file.mustache");
    case platforms.IOS:
      return loadFile("templates/localizable_strings_file.mustache");
  }
};

const outputPathForPlatform = (basePath, platform, language) => {
  return `${basePath}/${platform}/${language}/${filenameForPlatform(platform)}`;
};

const filenameForPlatform = platform => {
  switch (platform) {
    case platforms.ANDROID:
      return "strings.xml";
    case platforms.IOS:
      return "Localizable.strings";
  }
};

const viewForPlatform = (translations, platform) => {
  let substitutions = substitutionsForPlatform(platform);
  switch (platform) {
    case platforms.ANDROID:
      return createView(translations, "_", substitutions);
    case platforms.IOS:
      return createView(translations, ".", substitutions);
  }
};

const substitutionsForPlatform = platform => {
  switch (platform) {
    case platforms.ANDROID:
      return {
        s: "$s",
        d: "$d"
      };
    case platforms.IOS:
      return {
        s: "$@",
        d: "$d"
      };
  }
};

const substitute = (value, valueSubstitutions) => {
  Object.keys(valueSubstitutions).forEach(search => {
    value = value.replace(`{{${search}}}`, valueSubstitutions[search]);
  });
  return value;
};

const createView = (translations, delimiter, valueSubstitutions) => {
  let translationsPerType = groupByKey(translations, val => val.type);
  return mapObject(translationsPerType, translations => {
    return translations.map(translation => {
      switch (translation.type) {
        case SINGULAR:
          return {
            key: translation.keyPath.join(delimiter),
            value: substitute(translation.translation, valueSubstitutions)
          };
        case PLURAL:
          return {
            key: translation.keyPath.join(delimiter),
            value: Object.keys(translation.translation).map(quantity => {
              return {
                key: quantity,
                value: substitute(
                  translation.translation[quantity],
                  valueSubstitutions
                )
              };
            })
          };
      }
    });
  });
};

module.exports = render;
