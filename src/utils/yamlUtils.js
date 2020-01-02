const fs = require("fs");
const yaml = require("js-yaml");
const Result = require("../utils/result");

const loadYaml = filePath => {
  try {
    return Result.success(yaml.safeLoad(fs.readFileSync(filePath, "utf8")));
  } catch (error) {
    return Result.error(`Could not load YAML file at path: ${filePath}.`, error);
  }
};

module.exports = {
  loadYaml: loadYaml
};
