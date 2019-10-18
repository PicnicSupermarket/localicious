const r = require("../../src/utils/result");

test("result.success returns a successful result", () => {
  let res = r.success(1);
  expect(res.isSuccess).toBe(true);
  expect(res.value).toBe(1);
  expect(res.error).toBeUndefined();
  expect(res.isError).toBe(false);
});

test("result.error returns an erroneous result", () => {
  let res = r.error("something went wrong");
  expect(res.isSuccess).toBe(false);
  expect(res.value).toBeUndefined();
  expect(res.isError).toBe(true);
  expect(res.error.description).toBe("something went wrong");
});

test("result.map propagates success", () => {
  let res = r.success(1).map(value => {
    return value + 2;
  });
  expect(res.value).toBe(3);
  expect(res.isError).toBe(false);
});

test("result.map propagates error", () => {
  let res = r.error("something went wrong").map(value => {
    return value + 2;
  });
  expect(res.isSuccess).toBe(false);
  expect(res.error.description).toBe("something went wrong");
});

test("result.flatMap propagates success", () => {
  let res = r.success(1).flatMap(value => {
    return r.success(value + 2);
  });
  expect(res.value).toBe(3);
  expect(res.isError).toBe(false);
});

test("result.flatMap propagates error", () => {
  let res = r.error("something went wrong").flatMap(value => {
    return r.success(value + 2);
  });
  expect(res.isSuccess).toBe(false);
  expect(res.error.description).toBe("something went wrong");
});

test("onSuccess gets called on a successful result", done => {
  let res = r.success(42);
  res.onError().onSuccess(value => {
    expect(value).toBe(42);
    done();
  });
});

test("onError gets called on an unsuccessful result", done => {
  let res = r.error("Something went wrong");
  res.onSuccess().onError(error => {
    expect(error.description).toBe("Something went wrong");
    done();
  });
});
