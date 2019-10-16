const r = require("../src/utils/result");

test("result.success returns a successful result", () => {
  let res = r.success(1);
  expect(res.value).toBe(1);
  expect(res.error).toBeUndefined();
});

test("result.error returns an erroneous result", () => {
  let res = r.error("something went wrong");
  expect(res.value).toBeUndefined();
  expect(res.error.description).toBe("something went wrong");
});

test("result.map propagates success", () => {
  let res = r.success(1).map(value => {
    return value + 2;
  });
  expect(res.value).toBe(3);
  expect(res.error).toBeUndefined();
});

test("result.map propagates error", () => {
  let res = r.error("something went wrong").map(value => {
    return value + 2;
  });
  expect(res.value).toBeUndefined();
  expect(res.error.description).toBe("something went wrong");
});

test("result.flatMap propagates success", () => {
  let res = r.success(1).flatMap(value => {
    return r.success(value + 2);
  });
  expect(res.value).toBe(3);
  expect(res.error).toBeUndefined();
});

test("result.flatMap propagates error", () => {
  let res = r.error("something went wrong").flatMap(value => {
    return r.success(value + 2);
  });
  expect(res.value).toBeUndefined();
  expect(res.error.description).toBe("something went wrong");
});
