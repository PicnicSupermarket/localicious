const path = require("path");
const Mustache = require("mustache");
const Result = require("../utils/result");
const { normalizeYaml, PLURAL, SINGULAR } = require("../actions/normalize");
const { loadFile } = require("../utils/fileUtils");
const { groupKeywords, platformKeywords } = require("../model/keywords");
const { groupByKey } = require("../utils/arrayUtils");
const { flatten } = require("../utils/arrayUtils");

const render = (data, outputPath, platforms, languages) => {
  const translations = normalizeYaml(data, platforms, languages);
  return languages
    .reduce((acc, language) => {
      const translationsForLanguage = translations.filter(
        t => t.language === language
      );

      platforms.forEach(platform => {
        const translationsForPlatform = translationsForLanguage.filter(
          translation => [platform, platformKeywords.SHARED].includes(translation.platform)
        );
        const view = viewForPlatform(translationsForPlatform, platform);
        const renderedView = renderPlatform(
          view,
          platform,
          language,
          outputPath
        );
        acc.push(renderedView);
      });
      return acc;
    }, [])
    .reduce((acc, result) => {
      return acc.flatMap(value => result.map(r => value.concat([r])));
    }, Result.success([]));
};

const renderPlatform = (view, platform, language, basePath) => {
  view.lowerCase = () => (text, render) => render(text).toLowerCase();
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
    case platformKeywords.ANDROID:
      return loadFile(
        path.resolve(__dirname, "../../templates/strings_xml_file.mustache")
      );
    case platformKeywords.IOS:
      return loadFile(
        path.resolve(
          __dirname,
          "../../templates/localizable_strings_file.mustache"
        )
      );
  }
};

const outputPathForPlatform = (basePath, platform, language) => {
  return `${basePath}/${platform.toLowerCase()}/${language}/${filenameForPlatform(platform)}`;
};

const filenameForPlatform = platform => {
  switch (platform) {
    case platformKeywords.ANDROID:
      return "strings.xml";
    case platformKeywords.IOS:
      return "Localizable.strings";
  }
};

const viewForPlatform = (translations, platform) => {
  let substitutions = substitutionsForPlatform(platform);
  switch (platform) {
    case platformKeywords.ANDROID:
      return createView(translations, "_", substitutions);
    case platformKeywords.IOS:
      return createView(translations, ".", substitutions);
  }
};

const substitutionsForPlatform = platform => {
  switch (platform) {
    case platformKeywords.ANDROID:
      return {
        s: "$s",
        d: "$d"
      };
    case platformKeywords.IOS:
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

const createView = (translations, delimiter, substitutions) => {
  const copyViews = translations
    .filter(t => groupKeywords.COPY in t)
    .map(t =>
      createTranslationView(
        t[groupKeywords.COPY],
        [...t.keyPath, groupKeywords.COPY],
        delimiter,
        substitutions
      )
    );

  const accessibilityViews = translations
    .filter(t => groupKeywords.ACCESSIBILITY in t)
    .map(t => {
      const keyword = groupKeywords.ACCESSIBILITY;
      const group = t[keyword];
      return Object.keys(group).map(key =>
        createTranslationView(
          group[key],
          [...t.keyPath, keyword, key],
          delimiter,
          substitutions
        )
      );
    });
  const allViews = [...copyViews, ...flatten(accessibilityViews)];
  return groupByKey(allViews, val => val.type);
};

const createTranslationView = (
  translation,
  keyPath,
  delimiter,
  substitutions
) => {
  const key = keyPath.join(delimiter);
  switch (translation.type) {
    case SINGULAR:
      return {
        key,
        type: translation.type,
        value:
          translation.translation &&
          substitute(translation.translation, substitutions)
      };
    case PLURAL:
      return {
        key,
        type: translation.type,
        value: Object.keys(translation.translation).map(quantity => {
          const translationForQuantity = translation.translation[quantity];
          return {
            quantity,
            value:
              translationForQuantity &&
              substitute(translationForQuantity, substitutions)
          };
        })
      };
  }
};

module.exports = render;
