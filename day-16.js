const digits = input.split("").map(n => parseInt(n));

class FFT {
  constructor(digits, basePattern) {
    this.digits = digits;
    this.basePattern = basePattern;
    this.patterns = this.digits.map((_, i) => this.getPattern(i + 1));
  }

  getPattern(iteration) {
    return this.basePattern.reduce((arr, digit) => {
      return [...arr, ...Array.from({ length: iteration }, () => digit)];
    }, []);
  }

  step() {
    const newDigits = new Array(this.digits.length).fill(0);
    for (let i = 1; i <= this.digits.length; i++) {
      const currentPattern = this.patterns[i - 1];
      const result = this.digits.reduce((sum, digit, idx) => {
        return sum + digit * currentPattern[(idx + 1) % currentPattern.length];
      }, 0);
      newDigits[i - 1] = Math.abs(result % 10);
    }
    return (this.digits = newDigits);
  }

  run(phases) {
    let result;
    for (let i = 0; i < phases; i++) {
      result = this.step();
    }
    return result.join("");
  }
}

const fft1 = new FFT(digits, [0, 1, 0, -1]);
console.log("task 1", fft1.run(100).substr(0, 8));

const offset = parseInt(input.substr(0, 7));
const times = Math.ceil((digits.length * 10000 - offset) / digits.length);
const output = new Array(times)
  .fill(digits)
  .flat()
  .slice(offset % digits.length);

for (let i = 0; i < 100; i++) {
  for (let j = output.length - 2; j >= 0; j--) {
    const digit = output[j] + output[j + 1];

    output[j] = Math.abs(digit % 10);
  }
}

console.log("task 2", output.slice(0, 8).join(""));
