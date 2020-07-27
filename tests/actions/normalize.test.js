const { loadYaml } = require("../../src/utils/yamlUtils");
const { normalizeYaml } = require("../../src/actions/normalize");

test("normalizing works as expected with a single collection", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map(data =>
    normalizeYaml(data, ["en", "nl"], ["COLLECTION-SHARED"])
  );
  expect(res.value).toMatchSnapshot();
});

test("normalizing works as expected with multiple collections", () => {
  const res = loadYaml("tests/input/localicipe.yaml").map(data =>
    normalizeYaml(data, ["en", "nl"], ["COLLECTION-A", "COLLECTION-B", "COLLECTION-SHARED"])
  );
  expect(res.value).toMatchSnapshot();
});
