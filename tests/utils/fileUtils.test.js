const { loadFile } = require("../../src/utils/fileUtils");

test("loading a non-existing file fails", () => {
  let res = loadFile("tests/non-existing-file.yaml");
  expect(res.value).toBeUndefined();
  expect(res.error).toBeDefined();
});

test("loading an existing file succeeds", () => {
  let res = loadFile("tests/localicious_config.yaml");
  expect(res.value).toBeDefined();
  expect(res.error).toBeUndefined();
});
