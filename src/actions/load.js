const clone = require("git-clone");
const { createTmpDir } = require("../utils/fileUtils");
const Result = require("../utils/result");

/**
 * Pull the Localicipe from a designated source.
 */
const load = async source => {
  if (source.git !== undefined) {
    try {
      let cloneResult = await pullRepository(source.git);
      let filename = source.git.filename || "Localicipe.yml";
      return Result.success(`${cloneResult}/${filename}`);
    } catch (error) {
      return Result.error("Could not clone repository.", error);
    }
  } else if (source.path !== undefined) {
    return Result.success(source.path);
  }
  return Result.error("Unknown or no source configured in LocaliciousConfig.", source);
};

const pullRepository = async source => {
  return new Promise((resolve, reject) => {
    createTmpDir("localicious-").map(path => {
      const branch = source.branch || "master";
      const cloneOptions = {
        checkout: branch,
        shallow: branch === "master"
      };
      clone(source.url, path, cloneOptions, function(error) {
        if (error !== undefined) {
          reject(error);
        }
        resolve(path);
      });
    });
  });
};

module.exports = load;
