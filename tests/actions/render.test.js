const { loadYaml } = require("../../src/utils/yamlUtils");
const { outputTypes } = require("../../src/model/keywords");
const render = require("../../src/actions/render");

test("rendering 'en' works as expected for all output types", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map((data) =>
    render(
      data,
      "./",
      ["en"],
      [outputTypes.IOS, outputTypes.JS, outputTypes.ANDROID],
      ["COLLECTION-SHARED"]
    )
  );
  expect(res.value).toMatchSnapshot();
});

test("rendering 'en' works as expected for android only", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map((data) =>
    render(data, "./", ["en"], [outputTypes.ANDROID], ["COLLECTION-A", "COLLECTION-SHARED"])
  );
  expect(res.value).toMatchSnapshot();
});

test("rendering 'en' works as expected for iOS only", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map((data) =>
    render(data, "./", ["en"], [outputTypes.IOS], ["COLLECTION-B", "COLLECTION-SHARED"])
  );
  expect(res.value).toMatchSnapshot();
});

test("rendering 'en' works as expected for JS only", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map((data) =>
    render(data, "./", ["en"], [outputTypes.JS], ["COLLECTION-SHARED"])
  );
  expect(res.value).toMatchSnapshot();
});

test("rendering multiple languages works as expected", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map((data) =>
    render(
      data,
      "./",
      ["en", "nl"],
      [outputTypes.ANDROID, outputTypes.JS, outputTypes.IOS],
      ["COLLECTION-SHARED"]
    )
  );
  expect(res.value).toMatchSnapshot();
});

test("rendering works for a Localicipe with multiple collections", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map((data) => {
    return render(
      data,
      "./",
      ["en", "nl"],
      [outputTypes.ANDROID, outputTypes.JS, outputTypes.IOS],
      ["COLLECTION-A", "COLLECTION-B", "COLLECTION-SHARED"]
    );
  });
  expect(res.value).toMatchSnapshot();
});
