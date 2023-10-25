## jpg-to-gcode

Quickly converts jpg files to: 
- Bitmap
- SVG
- Gcode.

## Samples

![Original JPG](./jpg/0.jpg)
![Bitmap](./bitmap/0.jpg)
![SVG](./svg/0.jpg)

## Guide

Install all dependencies:

```bash
npm install
```

Start the node application

```bash
node app.js
```

Now everytime you place a Image into the 'jpg' folder, it automatically gets converted to all the formats. 
Because this has been made for a very specific purpose, a conversion only takes place if there isnt already a .gcode file with the same name as the initial .jpg file in the respective folders.

