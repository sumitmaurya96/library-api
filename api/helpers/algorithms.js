//find an element in array
const contains = function (needle) {
  // Per spec, the way to identify NaN is that it is not equal to itself
  let findNaN = needle !== needle;
  let indexOf;

  if (!findNaN && typeof Array.prototype.indexOf === "function") {
    indexOf = Array.prototype.indexOf;
  } else {
    indexOf = function (needle) {
      let i = -1,
        index = -1;

      for (i = 0; i < this.length; i++) {
        var item = this[i];

        if ((findNaN && item !== item) || item === needle) {
          index = i;
          break;
        }
      }

      return index;
    };
  }

  return indexOf.call(this, needle) > -1;
};

module.exports = { contains };
