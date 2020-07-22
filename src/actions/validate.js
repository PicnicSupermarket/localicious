const Ajv = require("ajv");
const betterAjvErrors = require("better-ajv-errors");
const Result = require("../utils/result");
const schemaTemplate = require("../../schemas/schema.json");

const validate = (data, requiredLanguages, optionalLanguages, collections) => {
  const schema = generateSchema(requiredLanguages, optionalLanguages, collections);
  return validateData(schema, data);
};

const validateData = (schema, data) => {
  const validator = new Ajv({ jsonPointers: true });
  const valid = validator.validate(schema, data);
  if (valid) {
    return Result.success({});
  } else {
    const errorMessages = ["❌ Your Localicipe contains validation issues:"];
    const allErrors = betterAjvErrors(schema, data, validator.errors, {
      format: "js"
    });
    const errorDescription = errorMessages
      .concat(allErrors.reduce((acc, error) => acc.concat([`    - ${error.error}`]), []))
      .join("\n");
    return Result.error(errorDescription, {
      allErrors: allErrors
    });
  }
};

const generateSchema = (requiredLanguages, optionalLanguages, collections) => {
  let schema = schemaTemplate;

  const upperCaseCollections = collections.map(s => s.toUpperCase());

  // To check if all requested collections are present in the YAML file.
  schema["required"] = upperCaseCollections;
  schema["properties"] = upperCaseCollections.reduce(
    (acc, collection) => ({
      ...acc,
      [collection]: { $ref: "#/definitions/Node" }
    }),
    {}
  );
  if (optionalLanguages === undefined) {
    schema["definitions"]["Translation"]["properties"] = requiredLanguages.reduce(
      (acc, language) => ({
        ...acc,
        [language]: { type: "string" }
      }),
      {}
    );
    schema["definitions"]["Translation"]["required"] = requiredLanguages;
    schema["definitions"]["Translation"]["additionalProperties"] = {
      type: "string"
    };
  } else {
    schema["definitions"]["Translation"]["properties"] = requiredLanguages
      .concat(optionalLanguages)
      .reduce(
        (acc, language) => ({
          ...acc,
          [language]: { type: "string" }
        }),
        {}
      );
    schema["definitions"]["Translation"]["required"] = requiredLanguages;
    schema["definitions"]["Translation"]["additionalProperties"] = false;
  }
  return schema;
};

module.exports = validate;
