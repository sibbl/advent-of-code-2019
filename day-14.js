class Ingredient {
  constructor({ amount, name }) {
    this.amount = parseInt(amount);
    this.name = name;
  }
}

class Recipe {
  constructor(line) {
    const regexp = /(?<amount>\d+) (?<name>\w+)/g;

    this.ingredients = [];
    let match;
    do {
      match = regexp.exec(line);
      if (match) {
        this.ingredients.push(new Ingredient(match.groups));
      }
    } while (match);

    this.product = this.ingredients.pop();
  }
}

class Production {
  constructor(recipes) {
    this.recipes = recipes;
  }

  getRequiredOreForProduct(product, amount, map) {
    if (!map) {
      map = new Map();
    }

    const recipe = recipes.find(r => r.product.name === product);
    const remaining = map.get(product) || 0;
    const multiplier = Math.ceil(
      Math.max(amount - remaining, 0) / recipe.product.amount
    );

    const remainingNew =
      recipe.product.amount * multiplier - (amount - remaining);

    product !== "ORE" && map.set(product, remainingNew);

    return recipe.ingredients.reduce((sum, { name, amount }) => {
      if (name === "ORE") {
        return sum + multiplier * amount;
      }
      return (
        sum + this.getRequiredOreForProduct(name, multiplier * amount, map)
      );
    }, 0);
  }
}

const recipes = input.split("\n").map(line => new Recipe(line));
const production = new Production();

const necessaryOreForOneFuel = production.getRequiredOreForProduct("FUEL", 1);
console.log("task 1", necessaryOreForOneFuel);

const ORE_STORAGE = 1000000000000;

let lower = ORE_STORAGE / necessaryOreForOneFuel - 1000;
let upper = ORE_STORAGE / necessaryOreForOneFuel + ORE_STORAGE / 1000;

while (lower < upper) {
  const mid = (lower + upper) / 2;
  const guess = production.getRequiredOreForProduct("FUEL", mid);

  if (guess > ORE_STORAGE) {
    upper = mid;
  } else if (guess < ORE_STORAGE) {
    if (mid == lower) break;
    lower = mid;
  } else {
    lower = mid;
    break;
  }
}

console.log("task 2", lower);
