class Error {
  constructor(description, underlyingError) {
    this.description = description;
    this.underlyingError = underlyingError;
  }
}

class Result {
  get isSuccess() {
    return this.value !== undefined && this.error === undefined;
  }

  get isError() {
    return this.value === undefined && this.error !== undefined;
  }

  // (X) -> Result<X>
  static success(value) {
    let result = new Result();
    result.value = value || {};
    return result;
  }

  static error(description, underlyingError) {
    let result = new Result();
    result.error = new Error(description, underlyingError);
    return result;
  }

  // (Result<X>, (X) -> Y) -> Result<Y>
  map(operation) {
    if (this.error === undefined) {
      return Result.success(operation(this.value));
    } else {
      return this;
    }
  }

  // (Result<X>, (X) -> Result<Y>) -> Result<Y>
  flatMap(operation) {
    if (this.error === undefined) {
      let res = operation(this.value);
      return res;
    } else {
      return this;
    }
  }

  onSuccess(operation) {
    if (this.value === undefined) {
      return this;
    }
    operation(this.value);
    return this;
  }

  onError(operation) {
    if (this.error === undefined) {
      return this;
    }
    operation(this.error);
    return this;
  }
}

module.exports = Result;
