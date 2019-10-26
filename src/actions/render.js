const path = require("path");
const Mustache = require("mustache");
const Result = require("../utils/result");
const { normalizeYaml, PLURAL, SINGULAR } = require("../actions/normalize");
const { loadFile } = require("../utils/fileUtils");
const { accessiblityKeywords, groupKeywords, platformKeywords } = require("../model/keywords");
const { groupByKey } = require("../utils/arrayUtils");
const { flatten } = require("../utils/arrayUtils");

const render = (data, outputPath, platforms, languages) => {
  const translations = normalizeYaml(data, platforms, languages);
  const translationsPerLanguage = groupByKey(translations, t => t.language);

  const localizationRenders = Object.keys(translationsPerLanguage).reduce((acc, language) => {
    const translationsForLanguage = translationsPerLanguage[language];
    const renderResults = platforms.map(platform => {
      const translations = translationsForLanguage.filter(t => includeInPlatform(t, platform));
      const view = createLocalizationView(translations, platform);
      return renderLocalization(view, platform, language, outputPath);
    });
    return [...acc, ...renderResults];
  }, []);

  const codeGenerationRenders = platforms
    .map(platform => [createCodeGenView(translations, platform), platform])
    .map(([view, platform]) => renderCodeGenView(view, platform, outputPath));

  return [...localizationRenders, ...codeGenerationRenders]
    .filter(render => !!render)
    .reduce(
      (acc, result) => acc.flatMap(value => result.map(r => value.concat([r]))),
      Result.success([])
    );
};

const includeInPlatform = (translation, platform) =>
  [platform, platformKeywords.SHARED].includes(translation.platform);

const renderLocalization = (view, platform, language, basePath) => {
  const outputPath = localizationOutputPath(basePath, platform, language);
  view.lowerCase = () => (text, render) => render(text).toLowerCase();
  return localizationTemplate(platform)
    .map(template => Mustache.render(template, view))
    .map(render => ({ path: outputPath, data: render }));
};

const renderCodeGenView = (view, platform, basePath) => {
  const outputPath = codeGenerationOutputPath(basePath, platform);
  return codeGenerationTemplate(platform)
    .map(({ template, partials }) => Mustache.render(template, view, partials))
    .map(render => ({ path: outputPath, data: render }));
};

const localizationTemplate = platform => {
  switch (platform) {
    case platformKeywords.ANDROID:
      return loadFile(path.resolve(__dirname, "../../templates/strings_xml_file.mustache"));
    case platformKeywords.IOS:
      return loadFile(path.resolve(__dirname, "../../templates/localizable_strings_file.mustache"));
  }
};

const codeGenerationTemplate = platform => {
  switch (platform) {
    case platformKeywords.ANDROID:
      return Result.success({ template: "", partial: null });
    case platformKeywords.IOS:
      return loadFile("templates/code_generation_swift_file.mustache").flatMap(template =>
        loadFile("templates/code_generation_swift_child.mustache").flatMap(partial =>
          Result.success({ template, partials: { child: partial } })
        )
      );
  }
};

const localizationOutputPath = (basePath, platform, language) => {
  return `${basePath}/${platform.toLowerCase()}/${language}/${localizationFileName(platform)}`;
};

const codeGenerationOutputPath = (basePath, platform) => {
  return `${basePath}/${platform.toLowerCase()}/${codeGenerationFileName(platform)}`;
};

const localizationFileName = platform => {
  switch (platform) {
    case platformKeywords.ANDROID:
      return "strings.xml";
    case platformKeywords.IOS:
      return "Localizable.strings";
  }
};

const codeGenerationFileName = platform => {
  switch (platform) {
    case platformKeywords.ANDROID:
      return "Localizable.kt";
    case platformKeywords.IOS:
      return "Localizable.swift";
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

const keyDelimiterForPlatform = platform => {
  switch (platform) {
    case platformKeywords.ANDROID:
      return "_";
    case platformKeywords.IOS:
      return ".";
  }
};

const substitute = (value, valueSubstitutions) => {
  Object.keys(valueSubstitutions).forEach(search => {
    value = value.replace(`{{${search}}}`, valueSubstitutions[search]);
  });
  return value;
};

const createCodeGenView = (translations, platform) => {
  const delimiter = keyDelimiterForPlatform(platform);

  let view = {};
  translations.forEach(item => {
    let result = view;
    item.keyPath.forEach((name, index) => {
      if (index === item.keyPath.length - 1) {
        const copyKey = groupKeywords.COPY;
        const accKey = groupKeywords.ACCESSIBILITY;

        const containsQuantity =
          (item[copyKey] && item[copyKey].type == PLURAL) ||
          containsPlural(item[accKey], accessiblityKeywords.HINT) ||
          containsPlural(item[accKey], accessiblityKeywords.LABEL) ||
          containsPlural(item[accKey], accessiblityKeywords.VALUE);

        const view = {
          name,
          containsQuantity,
          identifier: item.keyPath.join(delimiter),
          ...{ [copyKey]: (item[copyKey] && createCopyView(item, delimiter)) || {} },
          ...{ [accKey]: (item[accKey] && createAccessibilityViews(item, delimiter)) || {} }
        };
        result.children = [...(result.children || []), { ...view, hasChildren: false }];
      } else {
        const child = result.children && result.children.find(child => child.name === name);
        if (child) {
          result = child;
        } else {
          const child = { name, hasChildren: true };
          result.children = [...(result.children || []), child];
          result = child;
        }
      }
    });
  });
  return view;
};

const containsPlural = (item, keyword) => {
  return item && item[keyword] && item[keyword].type === PLURAL;
};

const createCopyView = (translation, delimiter) => {
  const keyword = groupKeywords.COPY;
  return {
    keyPath: [...translation.keyPath, keyword].join(delimiter),
    isPlural: translation[keyword].type === PLURAL
  };
};

const createAccessibilityViews = (translation, delimiter) => {
  const keyword = groupKeywords.ACCESSIBILITY;
  const group = translation[keyword];
  return Object.keys(group).reduce((acc, key) => {
    return {
      ...acc,
      [key]: {
        keyPath: [...translation.keyPath, keyword, key].join(delimiter),
        isPlural: translation.type === PLURAL
      }
    };
  }, {});
};

const createLocalizationView = (translations, platform) => {
  const substitutions = substitutionsForPlatform(platform);
  const delimiter = keyDelimiterForPlatform(platform);
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
        createTranslationView(group[key], [...t.keyPath, keyword, key], delimiter, substitutions)
      );
    });
  const allViews = [...copyViews, ...flatten(accessibilityViews)];
  return groupByKey(allViews, val => val.type);
};

const createTranslationView = (translation, keyPath, delimiter, substitutions) => {
  const key = keyPath.join(delimiter);
  switch (translation.type) {
    case SINGULAR:
      return {
        key,
        type: translation.type,
        value: translation.translation && substitute(translation.translation, substitutions)
      };
    case PLURAL:
      return {
        key,
        type: translation.type,
        value: Object.keys(translation.translation).map(quantity => {
          const translationForQuantity = translation.translation[quantity];
          return {
            quantity,
            value: translationForQuantity && substitute(translationForQuantity, substitutions)
          };
        })
      };
  }
};

module.exports = render;
