const [min, max] = input.split("-").map(n => parseInt(n));

const isValidPassword = number => {
  const str = number.toString();

  let numberOfMatchingDigitsBefore = 0;
  let validWithSimpleRule = false;
  let validWithStrictRule = false;
  for (let i = 1; i < str.length; i++) {
    if (str[i - 1] > str[i]) {
      return [false, false];
    }
    const equalsLastDigit = str[i - 1] === str[i];

    validWithSimpleRule |= equalsLastDigit;

    if (!validWithStrictRule) {
      if (equalsLastDigit) {
        numberOfMatchingDigitsBefore++;
      } else {
        if (numberOfMatchingDigitsBefore === 1) {
          validWithStrictRule = true;
        }
        numberOfMatchingDigitsBefore = 0;
      }
    }
  }

  if (numberOfMatchingDigitsBefore === 1) {
    validWithStrictRule = true;
  }

  return [validWithSimpleRule, validWithStrictRule];
};

const result = Array.from({ length: max - min }, (_, i) =>
  isValidPassword(i + min)
);
console.log("task 1", result.filter(([validSimple]) => validSimple).length);
console.log("task 2", result.filter(([, validStrict]) => validStrict).length);
