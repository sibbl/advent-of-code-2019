const CHAR_ASTEROID = "#";

class Asteroid {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class AsteroidRelation {
  constructor(asteroid1, asteroid2) {
    this.asteroid1 = asteroid1;
    this.asteroid2 = asteroid2;
    this.angle = this.getAngle();
    this.distance = this.getDistance();
  }

  getAngle() {
    return Math.atan2(
      this.asteroid1.y - this.asteroid2.y,
      this.asteroid2.x - this.asteroid1.x
    );
  }

  getDistance() {
    return Math.sqrt(
      this.asteroid1.x * this.asteroid2.x + this.asteroid1.y * this.asteroid2.y
    );
  }
}

const map = input.split("\n").map(l => l.split(""));
const asteroids = [];
map.forEach((line, y) => {
  line.forEach((char, x) => {
    if (char === CHAR_ASTEROID) {
      asteroids.push(new Asteroid(x, y));
    }
  });
});

const { distinctAngles, bestRelations } = asteroids.reduce(
  ({ distinctAngles, bestRelations }, asteroid) => {
    const otherAsteroids = asteroids.filter(other => other !== asteroid);
    const relations = otherAsteroids.map(
      other => new AsteroidRelation(asteroid, other)
    );
    const newDistinctAngles = new Set(relations.map(r => r.angle));
    if (
      distinctAngles === undefined ||
      newDistinctAngles.size > distinctAngles.size
    ) {
      distinctAngles = newDistinctAngles;
      bestRelations = relations;
    }
    return { distinctAngles, bestRelations };
  },
  {}
);

console.log("task 1", distinctAngles.size);

const relationsPerAngle = new Map();
bestRelations.forEach(relation => {
  if (!relationsPerAngle.has(relation.angle)) {
    relationsPerAngle.set(relation.angle, []);
  }
  relationsPerAngle.get(relation.angle).push(relation);
});
relationsPerAngle.forEach(relations =>
  relations.sort((a, b) => b.distance - a.distance)
);

const sortedDistinctAngles = [...distinctAngles].sort((a, b) => {
  // sort by angle > PI/2 asc, then by angle desc
  return (a > Math.PI / 2) - (b > Math.PI / 2) || b - a;
});

(() => {
  let vaporizedCount = 0;
  while (true) {
    for (let angle of sortedDistinctAngles) {
      const nextRelation = relationsPerAngle.get(angle).shift();
      if (nextRelation && ++vaporizedCount === 200) {
        const asteroid = nextRelation.asteroid2;
        console.log("task 2", asteroid.x * 100 + asteroid.y);
        return;
      }
    }
  }
})();
