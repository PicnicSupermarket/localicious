const path = require("path");
const Handlebars = require("handlebars");
const Result = require("../utils/result");
const { normalizeYaml, PLURAL, SINGULAR } = require("../actions/normalize");
const { loadFile } = require("../utils/fileUtils");
const { accessiblityKeywords, groupKeywords, outputType } = require("../model/keywords");
const { groupByKey } = require("../utils/arrayUtils");
const { flatten } = require("../utils/arrayUtils");

const percentEncodingPattern = /%(?!\d+{{.}})/;

const render = (data, outputPath, languages, platforms, collections) => {
  const translations = normalizeYaml(data, languages, collections);
  const translationsPerLanguage = groupByKey(translations, t => t.language);
  const localizationRenders = Object.keys(translationsPerLanguage).reduce((acc, language) => {
    const translationsForLanguage = translationsPerLanguage[language];
    const renderResults = platforms.map(platform => {
      const view = createLocalizationView(translationsForLanguage, platform);
      return renderLocalizationView(view, platform, language, outputPath);
    });
    return [...acc, ...renderResults];
  }, []);

  const uniqueTranslations = Object.values(
    translations.reduce((result, acc) => ({ ...result, [acc.keyPath]: acc }), {})
  );

  const codeGenerationRenders = platforms
    .map(platform => [createCodeGenView(uniqueTranslations, platform, languages), platform])
    .map(([view, platform]) => renderCodeGenView(view, platform, outputPath));

  return [...localizationRenders, ...codeGenerationRenders]
    .filter(render => !!render)
    .reduce(
      (acc, result) => acc.flatMap(value => result.map(r => value.concat([r]))),
      Result.success([])
    );
};

const renderLocalizationView = (view, platform, language, basePath) => {
  const outputPath = localizationOutputPath(basePath, platform, language);
  Handlebars.registerHelper("lowerCase", string => string.toLowerCase());
  return localizationTemplate(platform)
    .map(source => Handlebars.compile(source))
    .map(template => template(view))
    .map(render => ({ path: outputPath, data: render }));
};

const renderCodeGenView = (view, platform, basePath) => {
  const template = codeGenerationTemplate(platform);

  if (template !== undefined) {
    const outputPath = codeGenerationOutputPath(basePath, platform);
    return template
      .map(({ fileTemplate, childTemplate }) => {
        if (childTemplate) {
          Handlebars.registerPartial("child", childTemplate);
        }
        return Handlebars.compile(fileTemplate);
      })
      .map(template => template(view))
      .map(render => ({ path: outputPath, data: render }));
  }
};

const localizationTemplate = platform => {
  switch (platform) {
    case outputType.ANDROID:
      return loadFile(path.resolve(__dirname, "../../templates/strings_xml_file.hbs"));
    case outputType.IOS:
      return loadFile(path.resolve(__dirname, "../../templates/localizable_strings_file.hbs"));
    case outputType.JS:
      return loadFile(path.resolve(__dirname, "../../templates/json_strings_file.hbs"));
  }
};

const codeGenerationTemplate = platform => {
  switch (platform) {
    case outputType.ANDROID:
      return undefined;
    case outputType.IOS:
      return loadFile(
        path.resolve(__dirname, "../../templates/code_generation_swift_file.hbs")
      ).flatMap(fileTemplate =>
        loadFile(
          path.resolve(__dirname, "../../templates/code_generation_swift_child.hbs")
        ).flatMap(childTemplate => Result.success({ fileTemplate, childTemplate }))
      );
    case outputType.JS:
      return loadFile(
        path.resolve(__dirname, "../../templates/code_generation_js_file.hbs")
      ).flatMap(fileTemplate => Result.success({ fileTemplate, undefined }));
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
    case outputType.ANDROID:
      return "strings.xml";
    case outputType.IOS:
      return "Localizable.strings";
    case outputType.JS:
      return "strings.json";
  }
};

const codeGenerationFileName = platform => {
  switch (platform) {
    case outputType.ANDROID:
      return "Localizable.kt";
    case outputType.IOS:
      return "Localizable.swift";
    case outputType.JS:
      return "Localizable.ts";
  }
};

const substitutionsForPlatform = platform => {
  switch (platform) {
    case outputType.ANDROID:
      // prettier-ignore
      return [
        // Important: & should be substituted before we introduce new ampersands as part of our substitutions
        { search: "&", replace: "&amp;" },
        // Important: % should be substituted before we substitute {{s}} and {{d}}
        { search: percentEncodingPattern, replace: "&#37;" },
        { search: "{{s}}", replace: "$s" },
        { search: "{{d}}", replace: "$d" },
        { search: "\n", replace: "\\n" },
        { search: "@", replace: "\@" }, // eslint-disable-line no-useless-escape
        { search: "?", replace: "\?" }, // eslint-disable-line no-useless-escape
        { search: "<", replace: "&lt;" },
        { search: ">", replace: "&gt;" },
        { search: "\"", replace: "&quot;" },
      ];
    case outputType.IOS:
      return [
        // Important: % should be substituted before we substitute {{s}} and {{d}}
        { search: percentEncodingPattern, replace: "%%" },
        { search: "{{s}}", replace: "$@" },
        { search: "{{d}}", replace: "$d" },
        { search: '"', replace: '\\"' }
      ];
    case outputType.JS:
      return [
        { search: "{{s}}", replace: "$s" },
        { search: "{{d}}", replace: "$d" },
        { search: "\n", replace: "\\n" },
        { search: "\\", replace: "\\\\" },
        { search: '"', replace: '\\"' }
      ];
  }
};

const keyDelimiterForPlatform = platform => {
  switch (platform) {
    case outputType.ANDROID:
      return "_";
    case outputType.IOS:
      return ".";
    case outputType.JS:
      return ".";
  }
};

const substitute = (value, valueSubstitutions) => {
  valueSubstitutions.forEach(substitution => {
    value = value.split(substitution.search).join(substitution.replace);
  });
  return value;
};

const createCodeGenView = (translations, platform, languages) => {
  const delimiter = keyDelimiterForPlatform(platform);

  let translationsView = {};
  translations.forEach(item => {
    let result = translationsView;
    item.keyPath.forEach((name, index) => {
      if (index === item.keyPath.length - 1) {
        const copyKey = groupKeywords.COPY;
        const accKey = groupKeywords.ACCESSIBILITY;

        const containsQuantity =
          groupContainsQuantity(item, copyKey) ||
          groupContainsQuantity(item[accKey], accessiblityKeywords.HINT) ||
          groupContainsQuantity(item[accKey], accessiblityKeywords.LABEL) ||
          groupContainsQuantity(item[accKey], accessiblityKeywords.VALUE);

        const containsFormatting =
          groupContainsFormatting(item, copyKey) ||
          groupContainsFormatting(item[accKey], accessiblityKeywords.HINT) ||
          groupContainsFormatting(item[accKey], accessiblityKeywords.LABEL) ||
          groupContainsFormatting(item[accKey], accessiblityKeywords.VALUE);

        const view = {
          name,
          containsQuantity,
          containsFormatting,
          containsQuantityAndFormatting: containsFormatting && containsQuantity,
          requiresFunction: containsFormatting || containsQuantity,
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
  return {
    languages: languages,
    translations: translationsView
  };
};

const groupContainsFormatting = (item, keyword) => {
  return item && item[keyword] && item[keyword].containsFormatting;
};

const groupContainsQuantity = (item, keyword) => {
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
        value: substitute(translation.translation, substitutions)
      };
    case PLURAL:
      return {
        key,
        type: translation.type,
        value: Object.keys(translation.translation).map(quantity => {
          return {
            quantity,
            value: substitute(translation.translation[quantity], substitutions)
          };
        })
      };
  }
};

module.exports = render;
