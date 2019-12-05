const OP_ADD = 1,
  OP_MULTIPLY = 2,
  OP_INPUT = 3,
  OP_OUTPUT = 4,
  OP_JUMP_IF_TRUE = 5,
  OP_JUMP_IF_FALSE = 6,
  OP_LESS_THAN = 7,
  OP_EQUALS = 8,
  OP_END = 99;

const NUMBER_OF_INPUT_PARAMS = {
  [OP_ADD]: 2,
  [OP_MULTIPLY]: 2,
  [OP_JUMP_IF_TRUE]: 2,
  [OP_JUMP_IF_FALSE]: 2,
  [OP_LESS_THAN]: 2,
  [OP_EQUALS]: 2,
  [OP_INPUT]: 0,
  [OP_OUTPUT]: 1
};

const BY_REFERENCE = 0,
  BY_VALUE = 1;

const numbers = input.split(",").map(n => parseInt(n));

class Instruction {
  constructor(state) {
    let description = state
      .readValue()
      .toString()
      .padStart(5, "0");

    const [mode3, mode2, mode1, opcode1, opcode2] = description.split("");

    this.opcode = parseInt(opcode1 + opcode2);
    this.inputParamTypes = [mode1, mode2, mode3]
      .map(mode => parseInt(mode))
      .slice(0, NUMBER_OF_INPUT_PARAMS[this.opcode]);

    this.haltProgram = false;
    this.run(state);
  }

  run(state) {
    const inputValues = this.inputParamTypes.map(mode => state.read(mode));

    switch (this.opcode) {
      case OP_ADD:
        state.write(inputValues[0] + inputValues[1], state.readValue());
        break;
      case OP_MULTIPLY:
        state.write(inputValues[0] * inputValues[1], state.readValue());
        break;
      case OP_JUMP_IF_TRUE:
        inputValues[0] !== 0 && state.setPosition(inputValues[1]);
        break;
      case OP_JUMP_IF_FALSE:
        inputValues[0] === 0 && state.setPosition(inputValues[1]);
        break;
      case OP_LESS_THAN:
        state.write(inputValues[0] < inputValues[1] ? 1 : 0, state.readValue());
        break;
      case OP_EQUALS:
        state.write(
          inputValues[0] === inputValues[1] ? 1 : 0,
          state.readValue()
        );
        break;
      case OP_INPUT:
        state.write(state.input, state.readValue());
        break;
      case OP_OUTPUT:
        state.output = inputValues[0];
        break;
      case OP_END:
        this.haltProgram = true;
        break;
    }
  }
}

class State {
  constructor(numbers) {
    this.position = 0;
    this.numbers = Array.from(numbers);
    this.input = 1;
  }

  readReference() {
    return this.numbers[this.numbers[this.position++]];
  }

  readValue() {
    return this.numbers[this.position++];
  }

  read(mode) {
    if (mode === BY_REFERENCE) {
      return this.readReference();
    } else {
      return this.readValue();
    }
  }

  write(value, position) {
    this.numbers[position] = value;
  }

  setPosition(position) {
    this.position = position;
  }

  get canRead() {
    return this.position < this.numbers.length;
  }
}

class Program {
  constructor(numbers) {
    this.state = new State(numbers);
  }

  run() {
    this.state.setPosition(0);
    let instruction;
    do {
      instruction = new Instruction(this.state);
    } while (!instruction.haltProgram && this.state.canRead);
  }

  setInput(input) {
    this.state.input = input;
  }

  getOutput() {
    return this.state.output;
  }
}

const task1 = new Program(numbers);
task1.setInput(1);
task1.run();
console.log("task 1", task1.getOutput());

const task2 = new Program(numbers);
task2.setInput(5);
task2.run();
console.log("task 2", task2.getOutput());
