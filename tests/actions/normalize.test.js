const { loadYaml } = require("../../src/utils/yamlUtils");
const { normalizeYaml } = require("../../src/actions/normalize");
const { platformKeywords } = require("../../src/model/keywords");

test("normalizing works as expected with all platforms", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map(data =>
    normalizeYaml(
      data,
      [platformKeywords.IOS, platformKeywords.ANDROID],
      ["en", "nl"]
    )
  );
  expect(res.value).toMatchSnapshot();
});

test("normalizing works as expected with iOS only", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map(data =>
    normalizeYaml(data, [platformKeywords.IOS], ["en", "nl"])
  );
  expect(res.value).toMatchSnapshot();
});

test("normalizing works as expected with Android only", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map(data =>
    normalizeYaml(data, [platformKeywords.ANDROID], ["en", "nl"])
  );
  expect(res.value).toMatchSnapshot();
});
