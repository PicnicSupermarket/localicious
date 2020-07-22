const { loadYaml } = require("../utils/yamlUtils");
const render = require("../actions/render");
const validate = require("../actions/validate");
const { writeFiles } = require("../utils/fileUtils");

const validateAndRender = (localicipePath, outputPath, languages, outputTypes, collections) => {
  return loadYaml(localicipePath)
    .flatMap(data => validate(data, languages, undefined, collections).map(() => data))
    .flatMap(data => render(data, outputPath, languages, outputTypes, collections))
    .flatMap(writeFiles);
};

module.exports = validateAndRender;
