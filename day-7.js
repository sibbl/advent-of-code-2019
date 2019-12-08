const OP_ADD = 1,
  OP_MULTIPLY = 2,
  OP_INPUT = 3,
  OP_OUTPUT = 4,
  OP_JUMP_IF_TRUE = 5,
  OP_JUMP_IF_FALSE = 6,
  OP_LESS_THAN = 7,
  OP_EQUALS = 8,
  OP_END = 99;

const NUMBER_OF_INPUT_PARAMS = {
  [OP_ADD]: 2,
  [OP_MULTIPLY]: 2,
  [OP_JUMP_IF_TRUE]: 2,
  [OP_JUMP_IF_FALSE]: 2,
  [OP_LESS_THAN]: 2,
  [OP_EQUALS]: 2,
  [OP_INPUT]: 0,
  [OP_OUTPUT]: 1
};

const BY_REFERENCE = 0,
  BY_VALUE = 1;

const programCode = input.split(",").map(n => parseInt(n));

class Program {
  constructor(programCode, id) {
    this.id = id;
    this.position = 0;
    this.memory = Array.from(programCode);
    this.input = [];
    this.waiting = true;
    this.outputPrograms = [];
  }

  readReference() {
    return this.memory[this.memory[this.position++]];
  }

  readValue() {
    return this.memory[this.position++];
  }

  read(mode) {
    if (mode === BY_REFERENCE) {
      return this.readReference();
    } else {
      return this.readValue();
    }
  }

  write(value, position) {
    this.memory[position] = value;
  }

  setPosition(position) {
    this.position = position;
  }

  get canRead() {
    return this.position < this.memory.length;
  }

  pipeOutputTo(programB) {
    this.outputPrograms.push(programB);
  }

  addInput(...values) {
    this.input.push(...values);
    this.waiting = false;
  }

  run() {
    while (!this.isHalted && this.canRead && !this.waiting) {
      this.step();
    }
    return this.output;
  }

  step() {
    const description = this.readValue()
      .toString()
      .padStart(5, "0");

    const [mode3, mode2, mode1, opcode1, opcode2] = description.split("");

    const opcode = parseInt(opcode1 + opcode2);
    const inputParamTypes = [mode1, mode2, mode3]
      .map(mode => parseInt(mode))
      .slice(0, NUMBER_OF_INPUT_PARAMS[opcode]);

    const inputValues = inputParamTypes.map(mode => this.read(mode));

    switch (opcode) {
      case OP_ADD:
        this.write(inputValues[0] + inputValues[1], this.readValue());
        break;
      case OP_MULTIPLY:
        this.write(inputValues[0] * inputValues[1], this.readValue());
        break;
      case OP_JUMP_IF_TRUE:
        inputValues[0] !== 0 && this.setPosition(inputValues[1]);
        break;
      case OP_JUMP_IF_FALSE:
        inputValues[0] === 0 && this.setPosition(inputValues[1]);
        break;
      case OP_LESS_THAN:
        this.write(inputValues[0] < inputValues[1] ? 1 : 0, this.readValue());
        break;
      case OP_EQUALS:
        this.write(inputValues[0] === inputValues[1] ? 1 : 0, this.readValue());
        break;
      case OP_INPUT:
        if (this.input.length === 0) {
          this.waiting = true;
          this.position--;
          return;
        }
        this.write(this.input.shift(), this.readValue());
        break;
      case OP_OUTPUT:
        this.output = inputValues[0];
        this.outputPrograms.forEach(program => program.addInput(this.output));
        break;
      case OP_END:
        this.isHalted = true;
        break;
    }
  }
}

class Amplifier extends Program {
  constructor(phaseSetting, ...other) {
    super(...other);
    this.addInput(phaseSetting);
  }
}

class AmplifierCollection {
  constructor(phaseSettings, startInput = 0) {
    this.phaseSettings = phaseSettings;
    this.startInput = startInput;
  }
}

class LinearAmplifierCollection extends AmplifierCollection {
  run(programCode) {
    return this.phaseSettings.reduce((lastOutput, phaseSetting) => {
      const amplifier = new Amplifier(phaseSetting, programCode);
      amplifier.addInput(lastOutput);
      return amplifier.run();
    }, this.startInput);
  }
}

class CircularAmplifierCollection extends AmplifierCollection {
  run(programCode) {
    const amplifiers = this.phaseSettings.map(
      (phaseSetting, i) => new Amplifier(phaseSetting, programCode, i)
    );
    amplifiers[0].addInput(0);

    const lastAmplifier = amplifiers[amplifiers.length - 1];
    for (let i = 0; i < amplifiers.length; i++) {
      const prevAmplifier = i === 0 ? lastAmplifier : amplifiers[i - 1];
      prevAmplifier.pipeOutputTo(amplifiers[i]);
    }

    while (!lastAmplifier.isHalted) {
      amplifiers.forEach(amplifier => amplifier.run());
    }

    return lastAmplifier.output;
  }
}

const permutation = array => {
  if (!array.length) {
    return [[]];
  }
  return array.reduce(
    (acc, curr, i) => [
      ...acc,
      ...permutation([...array.slice(0, i), ...array.slice(i + 1)]).map(
        descendants => [curr, ...descendants]
      )
    ],
    []
  );
};

const getPhaseSignalPermutations = ({ start, end }) =>
  permutation(Array.from({ length: end - start + 1 }, (_, i) => i + start));

Object.entries({
  "task 1": {
    phaseSignalRange: { start: 0, end: 4 },
    collection: LinearAmplifierCollection
  },
  "task 2": {
    phaseSignalRange: { start: 5, end: 9 },
    collection: CircularAmplifierCollection
  }
}).map(([taskName, { phaseSignalRange, collection }]) => {
  const permutations = getPhaseSignalPermutations(phaseSignalRange);
  const allThrusterSignals = permutations.map(phaseSettings =>
    new collection(phaseSettings).run(programCode)
  );
  console.log(taskName, Math.max(...allThrusterSignals));
});
