const IMG_WIDTH = 25,
  IMG_HEIGHT = 6,
  IMG_PIXELS_PER_LAYER = IMG_WIDTH * IMG_HEIGHT;

const COLOR_BLACK = "0",
  COLOR_WHITE = "1",
  COLOR_TRANSPARENT = "2";

const numberOfLayers = input.length / IMG_PIXELS_PER_LAYER;

class Layer {
  constructor(str) {
    this.str = str;
  }

  countChar(char) {
    return this.str.split(char).length - 1;
  }

  getCharAt(index) {
    return this.str[index];
  }
}

class Image {
  constructor(str) {
    this.layers = Array.from({ length: numberOfLayers }, (_, i) => {
      return new Layer(
        str.substr(i * IMG_PIXELS_PER_LAYER, IMG_PIXELS_PER_LAYER)
      );
    });
  }

  getLayers() {
    return this.layers;
  }

  print() {
    let result = "";
    for (let i = 0; i < IMG_PIXELS_PER_LAYER; i++) {
      if (i > 0 && i % IMG_WIDTH === 0) {
        result += "\n";
      }
      let char = ".";
      for (let layerId = this.layers.length - 1; layerId >= 0; layerId--) {
        const color = this.layers[layerId].getCharAt(i);
        switch (color) {
          case COLOR_BLACK:
            char = "■";
            continue;
          case COLOR_WHITE:
            char = "□";
            continue;
        }
      }
      result += char;
    }
    return result;
  }
}

const image = new Image(input);

let layerWithMinZeroDigits, minZeroDigits;
image.getLayers().forEach(layer => {
  const numberOfZeroDigits = layer.countChar("0");
  if (!layerWithMinZeroDigits || numberOfZeroDigits < minZeroDigits) {
    minZeroDigits = numberOfZeroDigits;
    layerWithMinZeroDigits = layer;
  }
});

console.log(
  "task 1",
  layerWithMinZeroDigits.countChar("1") * layerWithMinZeroDigits.countChar("2")
);

console.log("task 2", image.print());
