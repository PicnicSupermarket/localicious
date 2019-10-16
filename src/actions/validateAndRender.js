const { loadYaml } = require("../utils/yamlUtils");
const render = require("../actions/render");
const validate = require("../actions/validate");
const { writeFiles } = require("../utils/fileUtils");

const validateAndRender = (
  localicipePath,
  outputPath,
  languages,
  platforms
) => {
  return loadYaml(localicipePath)
    .flatMap(data => validate(data, languages).map(() => data))
    .flatMap(data => render(data, outputPath, platforms, languages))
    .flatMap(writeFiles);
};

module.exports = validateAndRender;
