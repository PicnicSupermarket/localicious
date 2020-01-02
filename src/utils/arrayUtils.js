const flatten = arr => {
  return arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatten(val) : val), []);
};

const groupByKey = (arr, predicate) => {
  return arr.reduce((acc, val) => {
    let key = predicate(val);
    acc[key] = (acc[key] || []).slice(0);
    acc[key].push(val);
    return acc;
  }, {});
};

module.exports = { flatten, groupByKey };
