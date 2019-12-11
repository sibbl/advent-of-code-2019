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

  get hasOutput() {
    return this.output.length > 0;
  }

  nextOutput() {
    return this.output.shift();
  }

  getOutput() {
    return this.output.join(",");
  }

  run() {
    while (!this.isHalted && this.canRead && !this.waiting) {
      this.step();
    }
    return this.getOutput();
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
          this.position--;
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

const COLOR_BLACK = 0,
  COLOR_WHITE = 1;

const GO_LEFT = 0,
  GO_RIGHT = 1;

const DIRECTION_UP = 0,
  DIRECTION_RIGHT = 1,
  DIRECTION_DOWN = 2,
  DIRECTION_LEFT = 3;

class Hull {
  constructor() {
    this.hull = new Map();
  }
  getIdentifier({ x, y }) {
    return `${x}_${y}`;
  }
  read(pos) {
    return this.hull.get(this.getIdentifier(pos)) || COLOR_BLACK;
  }
  write(pos, color) {
    this.hull.set(this.getIdentifier(pos), color);
  }
  getNumberOfPaintedPanels() {
    return this.hull.size;
  }
  getBounds() {
    const keys = [...this.hull.keys()].map(str =>
      str.split("_").map(n => parseInt(n))
    );
    return {
      minX: Math.min(...keys.map(([x]) => x)),
      maxX: Math.max(...keys.map(([x]) => x)),
      minY: Math.min(...keys.map(([, y]) => y)),
      maxY: Math.max(...keys.map(([, y]) => y))
    };
  }
}

class HullPainter {
  constructor({
    programCode,
    startDirection = DIRECTION_UP,
    startPosition = { x: 0, y: 0 },
    startColor = COLOR_BLACK
  }) {
    this.program = new Program(programCode);
    this.hull = new Hull();

    this.position = startPosition;
    this.direction = startDirection;

    this.hull.write(this.position, startColor);
  }

  sendInput() {
    this.program.addInput(this.hull.read(this.position));
  }

  updateDirection(changeDirection) {
    switch (changeDirection) {
      case GO_LEFT:
        this.direction = (this.direction + 3) % 4;
        break;
      case GO_RIGHT:
        this.direction = (this.direction + 1) % 4;
        break;
    }
  }

  step() {
    switch (this.direction) {
      case 0: // up
        this.position.y--;
        break;
      case 1:
        this.position.x++;
        break;
      case 2:
        this.position.y++;
        break;
      case 3:
        this.position.x--;
        break;
    }
  }

  handleOutput() {
    while (this.program.hasOutput) {
      this.hull.write(this.position, this.program.nextOutput());
      this.updateDirection(this.program.nextOutput());
      this.step();
    }
  }

  run() {
    while (!this.program.isHalted) {
      this.sendInput();
      this.program.run();
      this.handleOutput();
    }
  }

  getNumberOfPaintedPanels() {
    return this.hull.getNumberOfPaintedPanels();
  }

  toString() {
    const { minX, minY, maxX, maxY } = this.hull.getBounds();
    let str = "";
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const color = this.hull.read({ x, y });
        str += color === COLOR_BLACK ? "#" : ".";
      }
      str += "\n";
    }
    return str;
  }
}

const programCode = input.split(",").map(n => parseInt(n));

const painter1 = new HullPainter({ programCode });
painter1.run();
console.log("task 1", painter1.getNumberOfPaintedPanels());

const painter2 = new HullPainter({ programCode, startColor: COLOR_WHITE });
painter2.run();
console.log("task 2", painter2.toString());
