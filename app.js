const fs = require("fs");
const path = require("path");
const potrace = require("potrace");
const Jimp = require("jimp");
const svgcode = require("svgcode");
const { spawn } = require('child_process');


// Function to convert JPG to BMP
function convertToBMP(inputJPGPath, outputBMPPath, callback) {
  Jimp.read(inputJPGPath)
    .then((image) => image.quality(100).writeAsync(outputBMPPath))
    .then(() => {
      console.log(`Converted to BMP: ${outputBMPPath}`);
      if (callback) callback(); // Callback function to continue after conversion
    })
    .catch((error) => console.error(`Error converting to BMP: ${error}`));
}

// Function to convert BMP to SVG
function convertToSVG(bmpInputPath, outputSVGPath, callback) {
  const trace = new potrace.Potrace({
    color: "#000000",
    background: "#FFFFFF",
    threshold: 100,
  });

  trace.loadImage(bmpInputPath, (err) => {
    if (err) return console.error(`Error loading BMP image: ${err}`);
    fs.writeFileSync(outputSVGPath, trace.getSVG());
    console.log(`Converted to SVG: ${outputSVGPath}`);
    if (callback) callback(); // Callback function to continue after conversion
  });
}

// Function to convert SVG to G-code
function convertToGCode(inputSVGPath, outputGCodePath) {
  try {
    const gcode = svgcode().loadFile(inputSVGPath).generateGcode().getGcode();
    fs.writeFileSync(outputGCodePath, gcode.join('\n'));
    console.log(`Converted to G-code: ${outputGCodePath}`);
  } catch (error) {
    console.error(`Error converting to G-code: ${error}`);
  }
}


function processJPGToGCode() {
  const jpgInputFolder = "./jpg";
  const bmpOutputFolder = "./bitmap";
  const svgOutputFolder = "./svg";
  const gcodeOutputFolder = "./gcode";

  if (!fs.existsSync(bmpOutputFolder)) fs.mkdirSync(bmpOutputFolder);
  if (!fs.existsSync(svgOutputFolder)) fs.mkdirSync(svgOutputFolder);
  if (!fs.existsSync(gcodeOutputFolder)) fs.mkdirSync(gcodeOutputFolder);

  const jpgFiles = fs.readdirSync(jpgInputFolder);
  const convertedFiles = fs.readdirSync(gcodeOutputFolder).map(file => path.basename(file, ".gcode"));

  jpgFiles.forEach((file) => {
    if (path.extname(file).toLowerCase() === ".jpg" || path.extname(file).toLowerCase() === ".jpeg") {
      const fileNameWithoutExtension = path.basename(file, ".jpg");
      const inputPath = path.join(jpgInputFolder, file);
      const bmpOutputPath = path.join(bmpOutputFolder, fileNameWithoutExtension + ".bmp");
      const svgOutputPath = path.join(svgOutputFolder, fileNameWithoutExtension + ".svg");
      const gcodeOutputPath = path.join(gcodeOutputFolder, fileNameWithoutExtension + ".gcode");

      if (convertedFiles.includes(fileNameWithoutExtension)) {
        console.log(`Skipping conversion for ${file} - .gcode file already exists: ${gcodeOutputPath}`);
      } else {
        console.log(`Converting ${file}`);
        try {
          convertToBMP(inputPath, bmpOutputPath, () => {
            convertToSVG(bmpOutputPath, svgOutputPath, () => {
              convertToGCode(svgOutputPath, gcodeOutputPath);
              console.log(`Conversion completed for ${file}`);
            });
          });
        } catch (error) {
          console.error(`Error during conversion for ${file}: ${error}`);
        }
      }
    }
  });
}

// Start the conversion process
processJPGToGCode();


const jpgInputFolder = "./jpg";
fs.watch(jpgInputFolder, (event, filename) => {
  if (event === 'rename' && (path.extname(filename).toLowerCase() === '.jpg' || path.extname(filename).toLowerCase() === '.jpeg')) {
    console.log(`New file added: ${filename}`);
    processJPGToGCode(); // Trigger the conversion process for the new file
  }
});
