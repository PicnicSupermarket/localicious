const fs = require("fs");
const os = require("os");
const path = require("path");
const Result = require("../utils/result");

const createTmpDir = prefix => {
  try {
    const pathPrefix = prefix || "";
    const path = fs.mkdtempSync(`${os.tmpdir()}/${pathPrefix}`);
    return Result.success(path);
  } catch (error) {
    return Result.error("Could not create working directory", error);
  }
};

const loadFile = filePath => {
  try {
    return Result.success(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return Result.error(`Could not read file at path: ${filePath} .`, error);
  }
};

const writeFile = file => {
  try {
    fs.mkdirSync(path.dirname(file.path), { recursive: true });
    return Result.success(fs.writeFileSync(file.path, file.data, "utf8"));
  } catch (error) {
    return Result.error("Could not write file.", error);
  }
};

const writeFiles = files => {
  let errors = files
    .map(writeFile)
    .filter(result => result.error != undefined)
    .reduce((acc, result) => {
      acc.push(result.error.underlyingError.path);
      return acc;
    }, []);
  if (errors.length != 0) {
    return Result.error(`Could not write the following files:\n${errors.join("\n")}`);
  }
  return Result.success(files.map(file => file.path));
};

module.exports = {
  createTmpDir,
  loadFile,
  writeFile,
  writeFiles
};
