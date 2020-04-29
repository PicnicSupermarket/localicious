const path = require("path");
const Handlebars = require("handlebars");
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
      return renderLocalizationView(view, platform, language, outputPath);
    });
    return [...acc, ...renderResults];
  }, []);

  const uniqueTranslations = Object.values(
    translations.reduce((result, acc) => ({ ...result, [acc.keyPath]: acc }), {})
  );

  const codeGenerationRenders = platforms
    .map(platform => [createCodeGenView(uniqueTranslations, platform), platform])
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
        Handlebars.registerPartial("child", childTemplate);
        return Handlebars.compile(fileTemplate);
      })
      .map(template => template(view))
      .map(render => ({ path: outputPath, data: render }));
  }
};

const localizationTemplate = platform => {
  switch (platform) {
    case platformKeywords.ANDROID:
      return loadFile(path.resolve(__dirname, "../../templates/strings_xml_file.hbs"));
    case platformKeywords.IOS:
      return loadFile(path.resolve(__dirname, "../../templates/localizable_strings_file.hbs"));
  }
};

const codeGenerationTemplate = platform => {
  switch (platform) {
    case platformKeywords.ANDROID:
      return undefined;
    case platformKeywords.IOS:
      return loadFile(
        path.resolve(__dirname, "../../templates/code_generation_swift_file.hbs")
      ).flatMap(fileTemplate =>
        loadFile(
          path.resolve(__dirname, "../../templates/code_generation_swift_child.hbs")
        ).flatMap(childTemplate => Result.success({ fileTemplate, childTemplate }))
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
      // prettier-ignore
      return {
        "{{s}}": "$s",
        "{{d}}": "$d",
        "\n": "\\n",
        "@": "\@", // eslint-disable-line no-useless-escape
        "?": "\?", // eslint-disable-line no-useless-escape
        // Important: & should be substituted before we introduce new ampersands as part of our substitutions
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
      };
    case platformKeywords.IOS:
      return {
        "{{s}}": "$@",
        "{{d}}": "$d"
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

const percentageForPlatform = platform => {
  switch (platform) {
    case platformKeywords.ANDROID:
      return "%";
      // return "&#37;";
    case platformKeywords.IOS:
      return "%%";
  }
};

const substitute = (value, valueSubstitutions, percentage) => {
  // Find all % which are NOT followed with [0...9]{{[s,d]}}
  // and replace with value from percentage
  
  // Official implementation that doesn't work
  // value = value.replace(`/%(\D|$)/gm`, percentage + `$1`)

  // Hacky workaround that works
  value = value.split(`%1{{`).join(`§1{{`);
  value = value.split(`%2{{`).join(`§2{{`);
  value = value.split(`%3{{`).join(`§3{{`);
  value = value.split(`%4{{`).join(`§4{{`);
  value = value.split(`%5{{`).join(`§5{{`);
  value = value.split(`%6{{`).join(`§6{{`);
  value = value.split(`%7{{`).join(`§7{{`);
  value = value.split(`%8{{`).join(`§8{{`);
  value = value.split(`%9{{`).join(`§9{{`);
  value = value.split(`%`).join(percentage);
  value = value.split(`§`).join(`%`);

  Object.keys(valueSubstitutions).forEach(search => {
    value = value.split(`${search}`).join(valueSubstitutions[search]);
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
  return view;
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
  const percentage = percentageForPlatform(platform);
  const copyViews = translations
    .filter(t => groupKeywords.COPY in t)
    .map(t =>
      createTranslationView(
        t[groupKeywords.COPY],
        [...t.keyPath, groupKeywords.COPY],
        delimiter,
        substitutions,
        percentage
      )
    );

  const accessibilityViews = translations
    .filter(t => groupKeywords.ACCESSIBILITY in t)
    .map(t => {
      const keyword = groupKeywords.ACCESSIBILITY;
      const group = t[keyword];
      return Object.keys(group).map(key =>
        createTranslationView(group[key], [...t.keyPath, keyword, key], delimiter, substitutions, percentage)
      );
    });
  const allViews = [...copyViews, ...flatten(accessibilityViews)];
  return groupByKey(allViews, val => val.type);
};

const createTranslationView = (translation, keyPath, delimiter, substitutions, percentage) => {
  const key = keyPath.join(delimiter);
  switch (translation.type) {
    case SINGULAR:
      return {
        key,
        type: translation.type,
        value: substitute(translation.translation, substitutions, percentage)
      };
    case PLURAL:
      return {
        key,
        type: translation.type,
        value: Object.keys(translation.translation).map(quantity => {
          return {
            quantity,
            value: substitute(translation.translation[quantity], substitutions, percentage)
          };
        })
      };
  }
};

module.exports = render;
