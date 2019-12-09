const OP_ADD = 1,
  OP_MULTIPLY = 2,
  OP_INPUT = 3,
  OP_OUTPUT = 4,
  OP_JUMP_IF_TRUE = 5,
  OP_JUMP_IF_FALSE = 6,
  OP_LESS_THAN = 7,
  OP_EQUALS = 8,
  OP_SET_RELATIVE_BASE = 9,
  OP_END = 99;

const MODE_POSITION = 0,
  MODE_IMMEDIATE = 1,
  MODE_RELATIVE = 2;

class Program {
  constructor(programCode) {
    this.position = 0;
    this.relativeBase = 0;
    this.output = [];
    this.memory = new Map();
    this.input = [];
    this.waiting = true;
    this.outputPrograms = [];

    programCode.forEach((value, index) => {
      this.memory.set(index, value);
    });
  }

  readValue(parameterMode) {
    switch (parameterMode) {
      case MODE_POSITION:
        return this.memory.get(this.memory.get(this.position++) || 0) || 0;
      case MODE_IMMEDIATE:
        return this.memory.get(this.position++) || 0;
      case MODE_RELATIVE:
        return (
          this.memory.get(
            this.relativeBase + this.memory.get(this.position++) || 0
          ) || 0
        );
    }
  }

  readAddress(parameterMode) {
    const offset = parameterMode === MODE_RELATIVE ? this.relativeBase : 0;
    return (this.memory.get(this.position++) || 0) + offset;
  }

  write(value, position) {
    this.memory.set(position, value);
  }

  setPosition(position) {
    this.position = position;
  }

  get canRead() {
    return this.position < this.memory.size;
  }

  pipeOutputTo(programB) {
    this.outputPrograms.push(programB);
  }

  addInput(...values) {
    this.input.push(...values);
    this.waiting = false;
    return this.input;
  }

  getOutput() {
    return this.output.join(",");
  }
  run() {
    while (!this.isHalted && this.canRead && !this.waiting) {
      this.step();
    }
    return this.output;
  }

  step() {
    const description = `${this.readValue(MODE_IMMEDIATE)}`.padStart(5, "0");

    const [mode3, mode2, mode1, opcode1, opcode2] = description
      .split("")
      .map(n => parseInt(n));

    const opcode = parseInt(`${opcode1}${opcode2}`);

    let param1, param2, param3;

    switch (opcode) {
      case OP_ADD:
        param1 = this.readValue(mode1);
        param2 = this.readValue(mode2);
        param3 = this.readAddress(mode3);
        this.write(param1 + param2, param3);
        break;
      case OP_MULTIPLY:
        param1 = this.readValue(mode1);
        param2 = this.readValue(mode2);
        param3 = this.readAddress(mode3);
        this.write(param1 * param2, param3);
        break;
      case OP_JUMP_IF_TRUE:
        param1 = this.readValue(mode1);
        param2 = this.readValue(mode2);
        param1 !== 0 && this.setPosition(param2);
        break;
      case OP_JUMP_IF_FALSE:
        param1 = this.readValue(mode1);
        param2 = this.readValue(mode2);
        param1 === 0 && this.setPosition(param2);
        break;
      case OP_LESS_THAN:
        param1 = this.readValue(mode1);
        param2 = this.readValue(mode2);
        param3 = this.readAddress(mode3);
        this.write(param1 < param2 ? 1 : 0, param3);
        break;
      case OP_EQUALS:
        param1 = this.readValue(mode1);
        param2 = this.readValue(mode2);
        param3 = this.readAddress(mode3);
        this.write(param1 === param2 ? 1 : 0, param3);
        break;
      case OP_SET_RELATIVE_BASE:
        param1 = this.readValue(mode1);
        this.relativeBase += param1;
        break;
      case OP_INPUT:
        if (this.input.length === 0) {
          this.waiting = true;
          return;
        }
        param1 = this.readAddress(mode1);
        this.write(this.input.shift(), param1);
        break;
      case OP_OUTPUT:
        param1 = this.readValue(mode1);
        this.output.push(param1);
        this.outputPrograms.forEach(program => program.addInput(param1));
        break;
      case OP_END:
        this.isHalted = true;
        break;
      default:
        console.error("malfunctioning opcode detected", opcode);
        break;
    }
  }
}

const programCode = input.split(",").map(n => parseInt(n));
const program1 = new Program(programCode);
program1.addInput(1);
program1.run();
console.log("task 1", program1.getOutput());

const program2 = new Program(programCode);
program2.addInput(2);
program2.run();
console.log("task 2", program2.getOutput());
