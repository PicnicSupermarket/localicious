const { groupByKey } = require("../../src/utils/arrayUtils");

test("grouping an array", () => {
  let list = [
    {
      language: "nl",
      translation: "Een vertaling"
    },
    {
      language: "en",
      translation: "A translation"
    }
  ];
  let res = groupByKey(list, item => item.language);
  expect(res).toMatchSnapshot();
});
