const { loadYaml } = require("../../src/utils/yamlUtils");
const validate = require("../../src/actions/validate");

test("validating succeeds when all required languages are available for all entries", () => {
  const res = loadYaml("tests/input/localicipe.yaml").flatMap(data =>
    validate(data, ["en"], undefined, ["COLLECTION-SHARED"])
  );
  expect(res.isSuccess).toBe(true);
});

test("validating succeeds when not all optional languages are complete for all entries", () => {
  const res = loadYaml("tests/input/localicipe.yaml").flatMap(data =>
    validate(data, ["en"], ["nl"], ["COLLECTION-SHARED"])
  );
  expect(res.isSuccess).toBe(true);
});

test("validating fails when optional languages are passed, and a language that is not passed as required/optional is present for some entries", () => {
  const res = loadYaml("tests/input/localicipe.yaml").flatMap(data => {
    data["COLLECTION-A"]["Checkout"]["OrderOverview"]["Total"]["de"] = "Gesammtsumme";
    return validate(data, ["en"], ["nl"], ["COLLECTION-A"]);
  });
  expect(res.isError).toBe(true);
});

test("validating fails when not all required languages are available for all entries", () => {
  const res = loadYaml("tests/input/localicipe_incomplete_language.yaml").flatMap(data =>
    validate(data, ["en", "nl"], undefined, ["COLLECTION-SHARED"])
  );
  expect(res.isError).toBe(true);
});

test("validating fails when there's an invalid collection in the root of the localicipe", () => {
  const res = loadYaml("tests/input/localicipe_invalid_collection.yaml").flatMap(data =>
    validate(data, ["en"], undefined, ["COLLECTION-SHARED"])
  );
  expect(res.isError).toBe(true);
});

test("validating fails when a required plural key is missing", () => {
  const res = loadYaml("tests/input/localicipe_missing_plural_key.yaml").flatMap(data =>
    validate(data, ["en"], undefined, ["COLLECTION-B"])
  );
  expect(res.isError).toBe(true);
});

test("validating fails when there's a collection requested that doesn't exist in the root of the localicipe", () => {
  const res = loadYaml("tests/input/localicipe_unknown_root_key.yaml").flatMap(data =>
    validate(data, ["en"], undefined, ["RANDOM-COLLECTION"])
  );
  expect(res.isError).toBe(true);
});
