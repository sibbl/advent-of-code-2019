const Directions = {
  LEFT: "L",
  RIGHT: "R",
  UP: "U",
  DOWN: "D"
};

class Instruction {
  constructor(str) {
    this.direction = str[0];
    this.amount = parseInt(str.substr(1));
  }

  go(pos, amount) {
    if (amount === undefined) {
      amount = this.amount;
    }
    switch (this.direction) {
      case Directions.LEFT:
        pos.x -= amount;
        break;
      case Directions.RIGHT:
        pos.x += amount;
        break;
      case Directions.UP:
        pos.y -= amount;
        break;
      case Directions.DOWN:
        pos.y += amount;
        break;
    }
  }
}

class Path {
  constructor(str) {
    this.instructions = str.split(",").map(str => new Instruction(str));
    this.calcBounds();
  }

  calcBounds() {
    let minX,
      maxX,
      minY,
      maxY,
      pos = {
        x: 0,
        y: 0
      };
    this.instructions.forEach(instruction => {
      instruction.go(pos);
      if (minX === undefined || pos.x < minX) {
        minX = pos.x;
      }
      if (minY === undefined || pos.y < minY) {
        minY = pos.y;
      }
      if (maxX === undefined || pos.x > maxX) {
        maxX = pos.x;
      }
      if (maxY === undefined || pos.y > maxY) {
        maxY = pos.y;
      }
    });
    return (this.bounds = {
      minX,
      maxX,
      minY,
      maxY
    });
  }
}

class FieldItem {
  constructor() {
    this.pathsGoingAlong = new Map();
  }

  setCable(pathIndex, stepsUntilHere) {
    if (!this.pathsGoingAlong.has(pathIndex)) {
      this.pathsGoingAlong.set(pathIndex, stepsUntilHere);
    }
  }

  getStepsOfPath(pathIndex) {
    return this.pathsGoingAlong.get(pathIndex) || 0;
  }

  getCableCount() {
    return this.pathsGoingAlong.size;
  }
}

class Field {
  constructor(str) {
    this.paths = str.split("\n").map(str => new Path(str));

    this.mergedBounds = {
      minX: Math.min(...this.paths.map(p => p.bounds.minX)),
      minY: Math.min(...this.paths.map(p => p.bounds.minY)),
      maxX: Math.max(...this.paths.map(p => p.bounds.maxX)),
      maxY: Math.max(...this.paths.map(p => p.bounds.maxY))
    };

    this.startPoint = {
      x: Math.abs(this.mergedBounds.minX),
      y: Math.abs(this.mergedBounds.minY)
    };

    this.fieldSize = {
      width: this.mergedBounds.maxX + this.startPoint.x + 1,
      height: this.mergedBounds.maxY + this.startPoint.y + 1
    };

    this.field = new Map();
    this.run();
  }

  getKey({ x, y }) {
    return `${x}_${y}`;
  }

  getFieldItem(pos) {
    const key = this.getKey(pos);
    return this.field.get(key);
  }

  getOrCreateFieldItem(pos) {
    const key = this.getKey(pos);
    if (!this.field.has(key)) {
      const newItem = new FieldItem();
      this.field.set(key, newItem);
      return newItem;
    }
    return this.field.get(key);
  }

  visit(pos, pathIndex, stepsUntilHere) {
    const fieldItem = this.getOrCreateFieldItem(pos);
    fieldItem.setCable(pathIndex, stepsUntilHere);
    return fieldItem.getCableCount();
  }

  print() {
    let str = "";
    for (let y = 0; y < this.fieldSize.height; y++) {
      for (let x = 0; x < this.fieldSize.width; x++) {
        let value = this.getFieldItem({ x, y });
        str += value ? value.getCableCount() : ".";
      }
      str += "\n";
    }
    console.log(str);
  }

  run() {
    this.intersections = [];
    this.paths.forEach((path, pathIndex) => {
      const pos = { ...this.startPoint };
      let steps = 0;
      path.instructions.forEach(instruction => {
        for (let i = 0; i < instruction.amount; i++) {
          steps++;
          instruction.go(pos, 1);
          const newValue = this.visit(pos, pathIndex, steps);
          if (newValue === this.paths.length) {
            this.intersections.push({ ...pos });
          }
        }
      });
    });
  }

  getMinManhattenDistance() {
    let minDistance;
    for (let intersection of this.intersections) {
      const distance =
        Math.abs(intersection.x - this.startPoint.x) +
        Math.abs(intersection.y - this.startPoint.y);
      if (minDistance === undefined || distance < minDistance) {
        minDistance = distance;
      }
    }
    return minDistance;
  }

  getMinSteps() {
    let minTotalSteps;
    for (let intersection of this.intersections) {
      let totalSteps = 0;
      this.paths.forEach((_, pathIndex) => {
        totalSteps += this.getFieldItem(intersection).getStepsOfPath(pathIndex);
      });
      if (minTotalSteps === undefined || totalSteps < minTotalSteps) {
        minTotalSteps = totalSteps;
      }
    }
    return minTotalSteps;
  }
}

const field = new Field(input);
// field.print();
console.log("task 1", field.getMinManhattenDistance());
console.log("task 2", field.getMinSteps());
