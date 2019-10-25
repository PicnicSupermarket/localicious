const { loadYaml } = require("../../src/utils/yamlUtils");
const { platformKeywords } = require("../../src/model/keywords");
const render = require("../../src/actions/render");

test("rendering 'en' works as expected for all platforms", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map(data =>
    render(data, "./", [platformKeywords.IOS, platformKeywords.ANDROID], ["en"])
  );
  expect(res.value).toMatchSnapshot();
});

test("rendering 'en' works as expected for android only", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map(data =>
    render(data, "./", [platformKeywords.ANDROID], ["en"])
  );
  expect(res.value).toMatchSnapshot();
});

test("rendering 'en' works as expected for iOS only", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map(data =>
    render(data, "./", [platformKeywords.IOS], ["en"])
  );
  expect(res.value).toMatchSnapshot();
});

test("rendering multiple languages works as expected", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map(data =>
    render(
      data,
      "./",
      [platformKeywords.ANDROID, platformKeywords.IOS],
      ["en", "nl"]
    )
  );
  expect(res.value).toMatchSnapshot();
});

test("rendering works for a Localicipe with only shared keys", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map(data => {
    const changedData = {
      SHARED: data.SHARED
    };
    return render(
      changedData,
      "./",
      [platformKeywords.ANDROID, platformKeywords.IOS],
      ["en", "nl"]
    );
  });
  expect(res.value).toMatchSnapshot();
});
