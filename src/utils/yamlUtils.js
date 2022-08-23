const fs = require("fs");
const Result = require("../utils/result");
const yaml = require("js-yaml");

const loadYaml = (filePath) => {
  try {
    return Result.success(yaml.load(fs.readFileSync(filePath, "utf8")));
  } catch (error) {
    return Result.error(`Could not load YAML file at path: ${filePath}.`, error);
  }
};

module.exports = {
  loadYaml: loadYaml,
};
