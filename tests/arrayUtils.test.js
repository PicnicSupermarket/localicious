const { groupByKey } = require("../src/utils/arrayUtils");

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
  let expected = {
    nl: [
      {
        language: "nl",
        translation: "Een vertaling"
      }
    ],
    en: [
      {
        language: "en",
        translation: "A translation"
      }
    ]
  };
  let res = groupByKey(list, item => item.language);
  expect(res).toStrictEqual(expected);
});
