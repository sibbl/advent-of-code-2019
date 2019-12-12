const DIMENSIONS = ["x", "y", "z"];

class Vector {
  constructor(vector) {
    if (vector === undefined) {
      vector = { x: 0, y: 0, z: 0 };
    }
    DIMENSIONS.map(
      dimension => (this[dimension] = parseInt(vector[dimension]))
    );
  }

  clone() {
    return new Vector({ x: this.x, y: this.y, z: this.z });
  }

  add(otherVector) {
    DIMENSIONS.map(dimension => (this[dimension] += otherVector[dimension]));
    return this;
  }

  equals(otherVector) {
    return DIMENSIONS.reduce(
      (equal, dimension) => equal && this[dimension] === otherVector[dimension],
      true
    );
  }

  getEnergy() {
    return DIMENSIONS.reduce(
      (sum, dimension) => sum + Math.abs(this[dimension]),
      0
    );
  }

  toString() {
    return `<x=${this.x}, y=${this.y}, z=${this.z}>`;
  }
}

class Moon {
  constructor(position) {
    this.position = new Vector(position);
    this.velocity = new Vector();

    this.initialPosition = this.position.clone();
    this.initialVelocity = this.velocity.clone();
  }

  toString() {
    return `pos=${this.position.toString()}, vel=${this.velocity.toString()}`;
  }

  applyGravity(otherMoons) {
    const gravity = otherMoons.reduce(
      (gravity, otherMoon) => gravity.clone().add(this.getGravity(otherMoon)),
      new Vector()
    );
    this.velocity.add(gravity);
    return this;
  }

  getGravity(otherMoon) {
    const [x, y, z] = DIMENSIONS.map(dimension => {
      return Math.min(
        1,
        Math.max(-1, otherMoon.position[dimension] - this.position[dimension])
      );
    });
    return new Vector({ x, y, z });
  }

  applyVelocity() {
    this.position.add(this.velocity);
  }

  getTotalEnergy() {
    return this.position.getEnergy() * this.velocity.getEnergy();
  }

  isAtInitialPositionAndVelocityForDimension(dimension) {
    return (
      this.position[dimension] === this.initialPosition[dimension] &&
      this.velocity[dimension] === this.initialVelocity[dimension]
    );
  }
}

const parseRegexp = /^<x=(?<x>\-?\d*), y=(?<y>\-?\d*), z=(?<z>\-?\d*)>$/;
const moons = input
  .split("\n")
  .map(line => line.match(parseRegexp))
  .filter(result => result)
  .map(result => new Moon(result.groups));

const moonAndOtherMoons = moons.map(moon => {
  return {
    moon,
    otherMoons: moons.filter(m => m !== moon)
  };
});

let step = 0,
  cycleSteps = { x: 0, y: 0, z: 0 };
while (++step && (!cycleSteps.x || !cycleSteps.y || !cycleSteps.z)) {
  moonAndOtherMoons
    .map(({ moon, otherMoons }) => moon.applyGravity(otherMoons))
    .forEach(moon => moon.applyVelocity());

  if (step === 1000) {
    console.log(
      "task 1",
      moons.reduce((sum, moon) => sum + moon.getTotalEnergy(), 0)
    );
  }

  DIMENSIONS.forEach(dimension => {
    if (cycleSteps[dimension]) {
      return;
    }

    for (let moon of moons) {
      if (!moon.isAtInitialPositionAndVelocityForDimension(dimension)) {
        return;
      }
    }
    cycleSteps[dimension] = step;
  });
}

// greatest common divisor
const GetGCD = (a, b) => {
  while (b > 0) {
    [a, b] = [b, a % b];
  }
  return a;
};

// lowest common multiple
const GetLCM = (a, b) => (a * b) / GetGCD(a, b);

const steps = GetLCM(cycleSteps.x, GetLCM(cycleSteps.y, cycleSteps.z));
console.log("task 2", steps);
