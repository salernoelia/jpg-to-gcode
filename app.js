const fs = require("fs");
const path = require("path");
const potrace = require("potrace");
const Jimp = require("jimp");
const svgcode = require("svgcode");
const { execSync } = require('child_process'); // Import execSync function

// convert JPG to png
function convertTopng(inputJPGPath, outputpngPath, callback) {
  Jimp.read(inputJPGPath)
    .then((image) => image.quality(100).writeAsync(outputpngPath))
    .then(() => {
      console.log(`Converted to png: ${outputpngPath}`);
      if (callback) callback(); // Callback function to continue after conversion
    })
    .catch((error) => console.error(`Error converting to png: ${error}`));
}

// Function to convert PNG to SVG with reduced and compatible settings
function convertToSVG(pngInputPath, outputSVGPath, callback) {
  const trace = new potrace.Potrace({
    color: "#000000", // Output color (black)
    background: "transparent", // Transparent background
    threshold: 200, // Adjust the threshold (0-255) as needed
    turnPolicy: potrace.Potrace.TURNPOLICY_BLACK, // Use TURNPOLICY_BLACK for fewer curves
    optCurve: true, // Enable curve optimization
    optTolerance: 0.2, // Tolerance for curve optimization (adjust if necessary)
  });

  trace.loadImage(pngInputPath, (err) => {
    if (err) return console.error(`Error loading png image: ${err}`);
    trace.turdSize = 2;
    const svgContent = trace.getSVG();
    
    // Add XML declaration and SVG namespace to the SVG content
    const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';
    const svgNamespace = 'xmlns="http://www.w3.org/2000/svg"';
    
    const svgWithXML = `${xmlDeclaration}<svg ${svgNamespace}>${svgContent}</svg>`;
    
    // Write the modified SVG content to the output file
    fs.writeFileSync(outputSVGPath, svgWithXML);

    // Minify the SVG using SVGO
    execSync(`npx svgo -i ${outputSVGPath} -o ${outputSVGPath} --pretty --indent=2`);
    console.log(`Converted to SVG and minified: ${outputSVGPath}`);
    
    if (callback) callback(); // Callback function to continue after conversion
  });
}


// convert SVG to G-code
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
  const pngOutputFolder = "./png";
  const svgOutputFolder = "./svg";
  const gcodeOutputFolder = "./gcode";

  if (!fs.existsSync(pngOutputFolder)) fs.mkdirSync(pngOutputFolder);
  if (!fs.existsSync(svgOutputFolder)) fs.mkdirSync(svgOutputFolder);
  if (!fs.existsSync(gcodeOutputFolder)) fs.mkdirSync(gcodeOutputFolder);

  const jpgFiles = fs.readdirSync(jpgInputFolder);
  const convertedFiles = fs.readdirSync(gcodeOutputFolder).map(file => path.basename(file, ".gcode"));

  jpgFiles.forEach((file) => {
    
    if (path.extname(file).toLowerCase() === ".jpg" || path.extname(file).toLowerCase() === ".jpeg") {
      const fileNameWithoutExtension = path.basename(file, ".jpg");
      const inputPath = path.join(jpgInputFolder, file);
      const pngOutputPath = path.join(pngOutputFolder, fileNameWithoutExtension + ".png");
      const svgOutputPath = path.join(svgOutputFolder, fileNameWithoutExtension + ".svg");
      const gcodeOutputPath = path.join(gcodeOutputFolder, fileNameWithoutExtension + ".gcode");

      if (convertedFiles.includes(fileNameWithoutExtension)) {
        console.log(`Skipping conversion for ${file} - .gcode file already exists: ${gcodeOutputPath}`);
      } else {
        console.log(`Converting ${file}`);
        try {
          convertTopng(inputPath, pngOutputPath, () => {
            convertToSVG(pngOutputPath, svgOutputPath, () => {
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