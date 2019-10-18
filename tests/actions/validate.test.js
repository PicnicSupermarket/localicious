const { loadYaml } = require("../../src/utils/yamlUtils");
const validate = require("../../src/actions/validate");

test("validating succeeds when all required languages are available for all entries", () => {
  const res = loadYaml("tests/localicipe.yaml").flatMap(data =>
    validate(data, ["en"])
  );
  expect(res.value).toBeDefined();
});

test("validating fails when not all required languages are available for all entries", () => {
  const res = loadYaml("tests/localicipe.yaml").flatMap(data =>
    validate(data, ["en", "nl"])
  );
  expect(res.error).toBeDefined();
});

test("validating succeeds when not all optional languages are complete for all entries", () => {
  const res = loadYaml("tests/localicipe.yaml").flatMap(data =>
    validate(data, ["en"], ["nl"])
  );
  expect(res.value).toBeDefined();
});

test("validating fails when optional languages are passed, and a language that is not passed as required/optional is present for some entries", () => {
  const res = loadYaml("tests/localicipe.yaml").flatMap(data => {
    data["android"]["Checkout"]["OrderOverview"]["Total"]["de"] =
      "Gesammtsumme";
    return validate(data, ["en"], ["nl"]);
  });
  expect(res.error).toBeDefined();
});
