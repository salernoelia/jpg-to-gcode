const fs = require("fs");
const path = require("path");
const potrace = require("potrace");
const Jimp = require("jimp");
const svgcode = require("svgcode");

// Convert BMP to SVG
function convertToSVG(bmpInputPath, outputSVGPath, callback) {
  const trace = new potrace.Potrace({
    color: "#000000",
    background: "#FFFFFF",
    threshold: 120,
  });

  trace.loadImage(bmpInputPath, (err) => {
    if (err) return console.error(`Error loading BMP image: ${err}`);
    fs.writeFileSync(outputSVGPath, trace.getSVG());
    console.log(`Converted to SVG: ${outputSVGPath}`);
    if (callback) callback();
  });
}

// Convert JPG to BMP
function convertToBMP(inputJPGPath, outputBMPPath, callback) {
  Jimp.read(inputJPGPath)
    .then((image) => image.quality(100).writeAsync(outputBMPPath))
    .then(() => {
      console.log(`Converted to BMP: ${outputBMPPath}`);
      if (callback) callback();
    })
    .catch((error) => console.error(`Error converting to BMP: ${error}`));
}

// Convert SVG to G-code
function convertToGCode(inputSVGPath, outputGCodePath) {
  try {
    const gcode = svgcode().loadFile(inputSVGPath).generateGcode().getGcode();
    fs.writeFileSync(outputGCodePath, gcode.join('\n'));
    console.log(`Converted to G-code: ${outputGCodePath}`);
  } catch (error) {
    console.error(`Error converting to G-code: ${error}`);
  }
}

// Process JPG files to G-code
function processJPGToGCode() {
  const jpgInputFolder = "./jpg";
  const bmpOutputFolder = "./bitmap";
  const svgOutputFolder = "./svg";
  const gcodeOutputFolder = "./gcode";

  if (!fs.existsSync(bmpOutputFolder)) fs.mkdirSync(bmpOutputFolder);
  if (!fs.existsSync(svgOutputFolder)) fs.mkdirSync(svgOutputFolder);
  if (!fs.existsSync(gcodeOutputFolder)) fs.mkdirSync(gcodeOutputFolder);

  const jpgFiles = fs.readdirSync(jpgInputFolder);

  jpgFiles.forEach((file) => {
    if (path.extname(file).toLowerCase() === ".jpg" || path.extname(file).toLowerCase() === ".jpeg") {
      const inputPath = path.join(jpgInputFolder, file);
      const bmpOutputPath = path.join(bmpOutputFolder, path.basename(file, ".jpg") + ".bmp");
      const svgOutputPath = path.join(svgOutputFolder, path.basename(file, ".jpg") + ".svg");
      const gcodeOutputPath = path.join(gcodeOutputFolder, path.basename(file, ".jpg") + ".gcode");

      convertToBMP(inputPath, bmpOutputPath, () => {
        convertToSVG(bmpOutputPath, svgOutputPath, () => {
          convertToGCode(svgOutputPath, gcodeOutputPath);
        });
      });
    }
  });
}

// Start the conversion process
processJPGToGCode();
