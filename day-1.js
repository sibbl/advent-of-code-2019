const numbers = input.split("\n").map(n => parseInt(n));

const getFuel = mass => Math.max(0, Math.floor(mass / 3) - 2);


const part1 = numbers.reduce((sum, mass) => sum + getFuel(mass), 0);
console.log("result of task 1", part1);


const part2 = numbers.reduce((sum, mass) => {
  let lastFuel = mass;
  let totalFuel = 0;
  
  do {
    lastFuel = getFuel(lastFuel);
    totalFuel += lastFuel;
  } while (lastFuel > 0);
  
  return sum + totalFuel;
}, 0);

console.log("result of task 2", part2);
