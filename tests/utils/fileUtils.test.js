const { loadFile } = require("../../src/utils/fileUtils");

test("loading a non-existing file fails", () => {
  let res = loadFile("tests/non-existing-file.yaml");
  expect(res.isSuccess).toBe(false);
  expect(res.isError).toBe(true);
});

test("loading an existing file succeeds", () => {
  let res = loadFile("tests/localicious_config.yaml");
  expect(res.isSuccess).toBe(true);
  expect(res.isError).toBe(false);
});
