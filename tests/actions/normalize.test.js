const { loadYaml } = require("../../src/utils/yamlUtils");
const { normalizeYaml } = require("../../src/actions/normalize");
const { platforms } = require("../../src/model/platforms");

test("normalizing works as expected with all platforms", () => {
  const res = loadYaml("tests/localicipe.yaml").map(data =>
    normalizeYaml(data, [platforms.IOS, platforms.ANDROID])
  );
  expect(res.value).toMatchSnapshot();
});

test("normalizing works as expected with iOS only", () => {
  const res = loadYaml("tests/localicipe.yaml").map(data =>
    normalizeYaml(data, [platforms.IOS])
  );
  expect(res.value).toMatchSnapshot();
});

test("normalizing works as expected with Android only", () => {
  const res = loadYaml("tests/localicipe.yaml").map(data =>
    normalizeYaml(data, [platforms.ANDROID])
  );
  expect(res.value).toMatchSnapshot();
});
