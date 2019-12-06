const edges = input.split("\n").map(line => line.split(")"));
const graph = new Map();
const nodes = new Set();
const paths = new Map();

edges.forEach(([from, to]) => {
  nodes.add(from);
  nodes.add(to);
  graph.set(to, from);
});
const totalCount = [...nodes].reduce((sum, node) => {
  let predecessorsCount = 0,
    predecessorNode = graph.get(node);

  while (predecessorNode !== undefined && predecessorNode.length > 0) {
    predecessorsCount++;
    if (!paths.has(predecessorNode)) {
      paths.set(predecessorNode, new Map());
    }
    const currentMinDistance = paths.get(predecessorNode).get(node);
    if (
      currentMinDistance === undefined ||
      predecessorsCount < currentMinDistance
    ) {
      paths.get(predecessorNode).set(node, predecessorsCount);
    }
    predecessorNode = graph.get(predecessorNode);
  }
  return sum + predecessorsCount;
}, 0);
console.log("task 1", totalCount);

const NODE_SANTA = "SAN",
  NODE_YOU = "YOU";

const minDistance = [...nodes].reduce((minDistance, node) => {
  const distances = paths.get(node);
  if (
    distances !== undefined &&
    distances.has(NODE_YOU) &&
    distances.has(NODE_SANTA)
  ) {
    const distanceBetweenYouAndSanta =
      distances.get(NODE_YOU) + distances.get(NODE_SANTA);
    const distanceBetweenOrbits = distanceBetweenYouAndSanta - 2;
    if (minDistance === undefined || distanceBetweenOrbits < minDistance) {
      return distanceBetweenOrbits;
    }
  }
  return minDistance;
}, undefined);

console.log("task 2", minDistance);
