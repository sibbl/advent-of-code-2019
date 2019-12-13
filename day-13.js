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
    this.isHalted = false;
    this.waiting = false;
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

const TILE_EMPTY = 0,
  TILE_WALL = 1,
  TILE_BLOCK = 2,
  TILE_HORIZONTAL_PADDLE = 3,
  TILE_BALL = 4;

const JOYSTICK_NEUTRAL = 0,
  JOYSTICK_LEFT = -1,
  JOYSTICK_RIGHT = 1;

class Grid {
  constructor() {
    this.map = new Map();
  }
  getIdentifier({ x, y }) {
    return `${x}_${y}`;
  }
  read(pos) {
    return this.map.get(this.getIdentifier(pos));
  }
  write(pos, value) {
    this.map.set(this.getIdentifier(pos), value);
  }
  getPositionOfValue(searchValue) {
    for (let [key, value] of this.map.entries()) {
      if (value === searchValue) {
        const [x, y] = key.split("_").map(n => parseInt(n));
        return { x, y };
      }
    }
    return false;
  }
  getBounds() {
    const keys = [...this.map.keys()].map(str =>
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

class Game {
  constructor(programCode) {
    this.program = new Program(programCode);
    this.grid = new Grid();
    this.score = 0;
  }

  step() {
    this.program.run();
    while (this.program.hasOutput) {
      const [x, y, tileOrScore] = Array.from({ length: 3 }).map(() =>
        this.program.nextOutput()
      );
      if (x === -1 && y === 0) {
        this.score = tileOrScore;
      } else {
        this.grid.write({ x, y }, tileOrScore);
      }
    }
  }

  getNumberOfTiles(type) {
    return [...this.grid.map.values()].filter(x => x === type).length;
  }

  toString() {
    const { minX, minY, maxX, maxY } = this.grid.getBounds();
    let str = "";
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const value = this.grid.read({ x, y });
        str += value;
      }
      str += "\n";
    }
    return str;
  }

  insertQuarters(amount) {
    this.program.write(amount, 0);
  }

  getBallPosition() {
    return this.grid.getPositionOfValue(TILE_BALL);
  }

  getHorizontalPaddlePosition() {
    return this.grid.getPositionOfValue(TILE_HORIZONTAL_PADDLE);
  }

  play() {
    this.step();
    let lastBallPosition = this.getBallPosition();
    while (this.getNumberOfTiles(TILE_BLOCK) > 0) {
      this.step();
      const currentBallPosition = this.getBallPosition();
      const currentPaddlePosition = this.getHorizontalPaddlePosition();
      const ballGoesLeft = currentBallPosition.x < lastBallPosition.x;
      let joystick = JOYSTICK_NEUTRAL;
      if (ballGoesLeft && currentPaddlePosition.x > currentBallPosition.x) {
        joystick = JOYSTICK_LEFT;
      } else if (
        !ballGoesLeft &&
        currentPaddlePosition.x < currentBallPosition.x
      ) {
        joystick = JOYSTICK_RIGHT;
      }
      lastBallPosition = currentBallPosition;
      this.program.addInput(joystick);
    }
    return this.score;
  }
}

const programCode = input.split(",").map(n => parseInt(n));

const game1 = new Game(programCode);
game1.step();
console.log("task 1", game1.getNumberOfTiles(TILE_BLOCK));

const game2 = new Game(programCode);
game2.insertQuarters(2);
const score = game2.play();
console.log("task 2", score);
