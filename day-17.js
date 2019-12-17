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
    return this.output;
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

  countValues(searchValue) {
    return [...this.map.values()].reduce(
      (sum, current) => sum + (current === searchValue ? 1 : 0),
      0
    );
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

  getRowsAndColumns() {
    const { minX, minY, maxX, maxY } = this.getBounds();
    const rows = [];
    for (let y = minY; y <= maxY; y++) {
      const cols = [];
      for (let x = minX; x <= maxX; x++) {
        cols.push(this.read({ x, y }));
      }
      rows.push(cols);
    }
    return rows;
  }
}

const CHAR_EMPTY = ".".charCodeAt(0),
  CHAR_DUST = "#".charCodeAt(0);
const ROUTINE_LEFT = "L".charCodeAt(0),
  ROUTINE_RIGHT = "R".charCodeAt(0);
const HEADING_UP = "^".charCodeAt(0),
  HEADING_RIGHT = ">".charCodeAt(0),
  HEADING_DOWN = "V".charCodeAt(0),
  HEADING_LEFT = "<".charCodeAt(0);
const VALID_HEADINGS = [HEADING_UP, HEADING_RIGHT, HEADING_DOWN, HEADING_LEFT];

class Game {
  constructor(programCode) {
    this.program = new Program(programCode);
    this.grid = new Grid();
  }

  wake() {
    this.program.write(2, 0);
  }

  prepare() {
    this.program.run();
    let x = 0,
      y = 0;
    while (this.program.hasOutput) {
      const ascii = this.program.nextOutput();
      if (ascii === "\n".charCodeAt(0)) {
        y++;
        x = 0;
      } else {
        this.grid.write({ x, y }, ascii);
        x++;
      }
    }
  }

  toString() {
    return this.grid
      .getRowsAndColumns()
      .map(row => `${row.map(c => String.fromCharCode(c)).join("")}\n`)
      .join("");
  }

  getScaffoldIntersections() {
    const rowsAndCols = this.grid.getRowsAndColumns();
    return rowsAndCols
      .reduce((arr, cols, y) => {
        return [
          ...arr,
          ...cols.reduce((rowArr, item, x) => {
            if (
              item === CHAR_DUST &&
              rowsAndCols[y - 1] &&
              rowsAndCols[y + 1] &&
              rowsAndCols[y - 1][x] === CHAR_DUST &&
              rowsAndCols[y + 1][x] === CHAR_DUST &&
              rowsAndCols[y][x + 1] === CHAR_DUST &&
              rowsAndCols[y][x - 1] === CHAR_DUST
            ) {
              return [...rowArr, { x, y }];
            }
            return rowArr;
          }, [])
        ];
      }, [])
      .flat();
  }

  sendLine(value) {
    this.program.addInput(
      ...`${value}\n`.split("").map(char => char.charCodeAt(0))
    );
  }

  setRoutines(routines) {
    const routineNames = "ABC";
    const uniqueRoutines = [...new Set(routines)];

    const sequence = routines.map(
      routine => routineNames[uniqueRoutines.indexOf(routine)]
    );
    this.sendLine(sequence.join(","));
    uniqueRoutines.forEach(routine => {
      this.sendLine(routine);
    });
    this.sendLine("n");
  }

  getPositionAfterTurn(position, heading, direction) {
    const diff = direction === HEADING_LEFT ? VALID_HEADINGS.length - 1 : 1;
    const newHeading =
      VALID_HEADINGS[
        (VALID_HEADINGS.indexOf(heading) + diff) % VALID_HEADINGS.length
      ];
    return {
      position: this.getNextPosition(position, newHeading),
      heading: newHeading
    };
  }

  getNextPosition(position, heading) {
    const { x, y } = position;
    switch (heading) {
      case HEADING_UP:
        return { x, y: y - 1 };
      case HEADING_DOWN:
        return { x, y: y + 1 };
      case HEADING_RIGHT:
        return { x: x + 1, y };
      case HEADING_LEFT:
        return { x: x - 1, y };
    }
    return false;
  }

  findPath() {
    let path = [];

    let expectedTotalSteps =
      this.getScaffoldIntersections().length + this.grid.countValues(CHAR_DUST);
    let position = VALID_HEADINGS.map(val =>
      this.grid.getPositionOfValue(val)
    ).find(item => item);
    let heading = this.grid.read(position);

    let peek = direction => {
      const {
        position: newPosition,
        heading: newHeading
      } = this.getPositionAfterTurn(position, heading, direction);
      return {
        newHeading,
        value: this.grid.read(newPosition) || false
      };
    };
    let totalSteps = 0,
      steps = 0;
    while (totalSteps < expectedTotalSteps) {
      const nextPosition = this.getNextPosition(position, heading);
      const nextItem = this.grid.read(nextPosition);
      if (nextItem === CHAR_DUST) {
        steps++;
        totalSteps++;
        position = nextPosition;
      } else {
        if (steps > 0) {
          path.push(`${steps}`);
          steps = 0;
        }
        const leftItem = peek(HEADING_LEFT);
        const rightItem = peek(HEADING_RIGHT);
        if (leftItem.value === CHAR_DUST) {
          heading = leftItem.newHeading;
          path.push("L");
        } else {
          heading = rightItem.newHeading;
          path.push("R");
        }
      }
    }
    if (steps > 0) {
      path.push(`${steps}`);
    }

    return path.join(",");
  }

  getRoutines(path) {
    // this was done from hand, so some magic is missing :)
    const routineA = "L,10,R,8,L,6,R,6";
    const routineB = "R,8,L,6,L,10,L,10";
    const routineC = "L,8,L,8,R,8";
    return [
      routineA,
      routineC,
      routineA,
      routineB,
      routineA,
      routineC,
      routineB,
      routineC,
      routineB,
      routineC
    ];
  }

  run() {
    this.wake();
    this.prepare();
    const path = this.findPath();
    const subroutines = this.getRoutines(path);
    this.setRoutines(subroutines);
    return this.program.run();
  }
}

const programCode = input.split(",").map(n => parseInt(n));

const game1 = new Game(programCode);
game1.prepare();
const alignmentParameterSum = game1
  .getScaffoldIntersections()
  .reduce((sum, { x, y }) => sum + x * y, 0);
console.log("task 1", alignmentParameterSum);

const game2 = new Game(programCode);
const output = game2.run();
console.log("task 2", output.pop());
