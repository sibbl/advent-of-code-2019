const OP_ADD = 1,
  OP_MULTIPLY = 2,
  OP_END = 99;

const numbers = input.split(",").map(n => parseInt(n));

class computer {
  constructor(numbers) {
    this.pos = 0;
    this.numbers = Array.from(numbers);
  }

  readValue() {
    return this.numbers[this.numbers[this.pos++]];
  }

  read() {
    return this.numbers[this.pos++];
  }

  write(value, pos) {
    this.numbers[this.numbers[pos]] = value;
  }

  run() {
    this.pos = 0;
    let running = true;
    do {
      const operation = this.read();
      switch (operation) {
        case OP_ADD:
          this.write(this.readValue() + this.readValue(), this.pos++);
          break;
        case OP_MULTIPLY:
          this.write(this.readValue() * this.readValue(), this.pos++);
          break;
        case OP_END:
          running = false;
          break;
      }
    } while (running && this.pos < this.numbers.length);
  }

  restoreProgramAlarmState(noun, verb) {
    this.numbers[1] = noun;
    this.numbers[2] = verb;
  }

  restore1202ProgramAlarmState() {
    this.restoreProgramAlarmState(12, 2);
  }

  getAtPosition(pos) {
    return this.numbers[pos];
  }

  print() {
    console.log(this.numbers.join(","));
  }
}

const task1 = new computer(numbers);
task1.restore1202ProgramAlarmState();
task1.run();
console.log("task 1", task1.getAtPosition(0));

(() => {
  let task2;
  for (let i = 0; i < 99; i++) {
    for (let j = 0; j < 99; j++) {
      task2 = new computer(numbers);
      task2.restoreProgramAlarmState(i, j);
      task2.run();

      if (task2.getAtPosition(0) === 19690720) {
        console.log("task 2", i * 100 + j);
        return;
      }
    }
  }
})();
