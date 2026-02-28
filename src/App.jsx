import { useState, useEffect } from 'react'

class Octree{

// only possible with this source: https://delimitry.blogspot.com/2016/02/octree-color-quantizer-in-python.html

  constructor(depth){


    this.nodes = {}; 
    this.leafNodes = {};
    this.maxDepth = depth;

    // an index is used because you can represent trees using an arrays. like for a binary tree to get the children of any index
    // it would be index * 2 + 1 or + 2, i think of it as keeping a bunch of pockets or space for each child to store its children
    // in this case each child has 8 children.
    // this is because 2^3 = 8. those numbers are relevant due to how
    // the indices are found for the children which is using their binary form of their rgb values,
    // so if you think of the 8 bit rgb values in binary stacked row by row as 3 rows and look in each column there are 3 bits 
    // hence 2^3 children because those are the amount of possible children it could have with those 3 bits

  }

  insert(color){

    // adding a color to the octree, this involves first finding the index it belongs in, checking if a child already exists there,
    // and if it does go to its children and continue to the next level now checking the next column of bits to find an index

    // let level = 0;
    let index = 0;

    let mask = 0x80; // 0x80 in hexadecimal refers to 10000000 or 128 in decimal, this is notable 
                     // since it corresponds with the colors bit representation which is in 8 bits
                     // this mask is used to check every bit of the rgb color for whether or not its present                 

    // console.log("test");

    this.nodes[0] = {red : 0, green : 0, blue : 0, pixels : 0};

    for (let level = 0; level < this.maxDepth; level++){

      // console.log(color.red, mask, color.red & mask);

      let localIndex = 0;

      if (color.red & mask){
        // checks whether or not a bit exists at the mask

        localIndex += 4; // each bit in the colors represent some more bits in a column! now theres 8 different combinations of that
      }

      if (color.green & mask){

        localIndex += 2;
      }

      if (color.blue & mask){

        localIndex += 1;
      }

      index = index * 8 + localIndex; // go to this child
      mask = mask >> 1;              // look at the next column

      // this.nodes[index] = {red : 0, green : 0, blue : 0, pixels : 0, parent : lastIndex}; // looking back at this, to save memory and performance you could just get the parent by getting rid of the last digit and dividing by 8

    }

    let leafNode = this.leafNodes[index];

    if (leafNode){

      // console.log("here?");

      leafNode.red += color.red;
      leafNode.green += color.green;
      leafNode.blue += color.blue;
      leafNode.pixels++; // to get the average of all of the pixels that intersect here
    }
    else{

      // this.leafNodes[index] = {red : color.red, green : color.green, blue : color.blue, pixels : 1, parent : this.nodes[index].parent};
      this.leafNodes[index] = {red : color.red, green : color.green, blue : color.blue, pixels : 1};

    }
  }

  reduce(colors){

    // get parents of leafnodes, get rid of the children of the parent until its reduced to colors, add the parent to leaf nodes, repeat

    // note, im sure this can be made considerably faster by preemptively adding the leafnodes values for an average
    // to all of the nodes they pass, organizing the nodes into levels, choosing the level
    // that makes it under the color threshold, then correcting the level to make sure it has the right amount of colors. 
    // this way it almost skips the entire reducing process which is the main prepetrator of the long wait for a plethora of colors.
    // however for the sake of avoiding debugging the many things that will go wrong, and time, im not rewriting a working product 

    console.log(Object.keys(this.leafNodes).length);

    let stop = false;

    while (Object.keys(this.leafNodes).length > colors){


      let newLeaves = {};
      let leavesRemaining = Object.keys(this.leafNodes).length;
      
      // console.log("level")

      for (const key of Object.keys(this.leafNodes)){

        // console.log("leaf node");

        // console.log("run!");

        const leafNode = this.leafNodes[key];

        if (leafNode == undefined){

          // console.log("its undefined");

          continue;
        }

        // this.leafNodes = {};

        if (stop){

          // successfully reduced, add the rest of the leaf nodes on and save it after the loop

          // console.log("just going through");

          newLeaves[key] = leafNode;
          continue;
        }

        // let parent = this.nodes[leafNode.parent];
        let parent = (key - (key % 8)) / 8;
        let parentValue = {red : 0, green : 0, blue : 0, pixels : 0};
        // console.log(parent, leafNode.parent, leafNode, key);
        // console.log(String(leafNode.parent * 8), key);
        // console.log(leafNode);

        // console.log("children...");

        for (let child = 0; child < 8; child++){

          // if (this.leafNodes[leafNode.parent * 8 + child]){

          // console.log(this.leafNodes[parent * 8 + child]);
          // console.log(key, parent)

          if (this.leafNodes[parent * 8 + child]){

            // parent.red += this.leafNodes[leafNode.parent * 8 + child].red;
            // parent.green += this.leafNodes[leafNode.parent * 8 + child].green;
            // parent.blue += this.leafNodes[leafNode.parent * 8 + child].blue;
            // parent.pixels += this.leafNodes[leafNode.parent * 8 + child].pixels;

            // console.log(this.leafNodes[parent * 8 + child]);

            parentValue.red += this.leafNodes[parent * 8 + child].red;
            parentValue.green += this.leafNodes[parent * 8 + child].green;
            parentValue.blue += this.leafNodes[parent * 8 + child].blue;
            parentValue.pixels += this.leafNodes[parent * 8 + child].pixels;

            // console.log(this.leafNodes[leafNode.parent * 8 + child], parent);

            this.leafNodes[parent * 8 + child] = undefined; // using delete instead screws up the loop some how

            // console.log("good to go?", Object.keys(newLeaves).length + leavesRemaining, colors);

            if (Object.keys(newLeaves).length + leavesRemaining <= colors){
              
              // successfully reduced

              // console.log("good! ", Object.keys(newLeaves).length + leavesRemaining);

              stop = true;
              break;
            }

            leavesRemaining--;

          }

          // console.log(String(leafNode.parent * 8 + child), key, String(leafNode.parent * 8 + child) === key, this.leafNodes[String(leafNode.parent * 8 + child)]);
          // this.leafNodes[String(leafNode.parent * 8 + child)] = undefined; 
          // console.log("still there?", this.leafNodes[String(leafNode.parent * 8 + child)]);
        }

        newLeaves[parent] = parentValue;

        // leavesRemaining--;
      }

      // console.log(newLeaves);
      this.leafNodes = newLeaves;
      // console.log(this.leafNodes);

      // console.log(Object.keys(newLeaves).length);
      // console.log(newLeaves);

    }

    // console.log(this.leafNodes);

  }

  getColor(color){

    // basically same as insert, except its just getting to the leaf node and returning its average

    let index = 0;

    let mask = 0x80; // 0x80 in hexadecimal refers to 10000000 or 128 in decimal, this is notable 
                     // since it corresponds with the colors bit representation which is in 8 bits
                     // this mask is used to check every bit of the rgb color for whether or not its present  


    // console.log(color);

    let result;

    for (let level = 0; level < this.maxDepth; level++){

      // console.log(color.red, mask, color.red & mask);

      let localIndex = 0;

      // console.log(index);

      if (color.red & mask){
        // checks whether or not a bit exists at the mask

        localIndex += 4; // each bit in the colors represent some more bits in a column! now theres 8 different combinations of that
      }

      if (color.green & mask){

        localIndex += 2;
      }

      if (color.blue & mask){

        localIndex += 1;
      }

      index = index * 8 + localIndex; // go to this child

      if (result && this.leafNodes[index]){

        return {red : this.leafNodes[index].red, green : this.leafNodes[index].green, blue : this.leafNodes[index].blue, pixels : this.leafNodes[index].pixels};
      }

      else if (result){

        return {red : result.red, green : result.green, blue : result.blue, pixels : result.pixels};
      }

      else if (this.leafNodes[index]){

        // console.log(this.leafNodes[index]);

        result = this.leafNodes[index];
        // all of a parents children dont have to be cleared to reach the color count specified, so it would stop early if it stopped at the parent
      }

      mask = mask >> 1; // look at the next column

    }

    if (result == undefined){
      // case where a color was reduced to the 0th index (wont match with anything)

      return {red : this.leafNodes[0].red, green : this.leafNodes[0].green, blue : this.leafNodes[0].blue, pixels : this.leafNodes[0].pixels}
    }

    // console.log(Object.keys(this.leafNodes).length);
    return {red : result.red, green : result.green, blue : result.blue, pixels : result.pixels};
  }

}

function chroma(colors, secondRow=true){

  // NOTE
  // i cant find a source that states how to apply luma to chroma (if you just multiply rgb by luma it just gets darker,
  //  which isnt exactly a feature of chroma subsampling). instead im converting rgb to hsl to apply luma in light then 
  // converting it back to draw it on the canvas.

  // this also means i dont actually use luma, i use light as calculated for the conversion of rgb to hsl
  // due to the fact that 

  function rgbToHsl(color){

    // implementation from https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion

    // const [red, green, blue] = [color.red / 255, color.green / 255, color.blue / 255];
    const [red, green, blue] = [color.red, color.green, color.blue];
    // get the range of colors to determine light (even distribution, how white it is) and saturation (difference, although in hsl light greatly affects saturation anyway, so light is basically the baseline)
    const colorMax = Math.max(red, green, blue);
    const colorMin = Math.min(red, green, blue);
    const difference = colorMax - colorMin;

    const light = (colorMax + colorMin) / 2; // 2 if max and min are both 255, so its white
    const saturation = light >= 0.5 ? difference / (2 - (colorMax + colorMin)) : difference / (colorMax + colorMin); // saturation approaches 1 if min is close to 0, ive got no clue whats going on when light is > 0.5 other than the fact saturation remains the same in hsl despite saturation actually decreases as light increases at that point

    let hue;

    if (colorMax == colorMin){

      return {hue : 0, saturation: 0}; // its achromatic! all colors are the same, so its either white grey or black
    }

    // console.log(colorMax, red, green, blue);

    switch (colorMax){

      case red:
        hue = (green - blue) / difference;
        break;

      case green:
        hue = (blue - red) / difference + 2; // each integer here is basically equivalent to 60, 60 comes from the hsl color hexagon and represents the hues which are angles, best shown here https://stackoverflow.com/questions/39118528/rgb-to-hsl-conversion
                                              // in other words, the + 2 sets it to 120 degrees which represents green, from there its more blue (positive) or red (negative) from here which is 60 degrees clockwise or counterclockwise, and that max 60 degree turn is ensured by the difference (if red is 0 and blue and green are 1 the angle is 180: a blend between blue and green)
        break;

      case blue:
        hue = (red - green) / difference + 4; 
        break;
    }

    hue *= 60;

    return {hue : hue, saturation : saturation};

  }

  // colors is an array of 8 colors representing a 4x2 grid. 4x2 grid is somewhat arbitrary: its just the most you can get away with without huge quality deprecation

  // now go through colors, create a luma array & chroma array (just select every odd color every 2 for 4:2:2 to cut down on half)
  // for luma just use magic numbers to see how bright our eyes interpret color i guess

  // linearize the colors and get the luminacity and then based off thee format get the chroma values

  let luma = [];

  for (let row = 0; row < colors.length; row++){

    let currentRow = [];

    for (let col = 0; col < colors[0].length; col++){

      const color = colors[row][col];
      currentRow.push(color.red * 0.2126 + color.green * 0.7152 + color.blue * 0.0722);
    }

    luma.push(currentRow);
  }

  // colors.forEach((color)=>{

  //   const red = color.red / 255;
  //   const green = color.green / 255;
  //   const blue = color.blue / 255;
    
  //   luma.push(red * 0.2126 + green * 0.7152 + blue * 0.0722); // magic numbers are weights based off of how bright we percieve colors 
  // });

  let chroma = [];

  for (let row = 0; row < colors.length && row < secondRow + 1; row++){

    let currentRow = [];

    for (let col = 0; col < colors[0].length; col += 2){

      const color = colors[row][col];
      currentRow.push(rgbToHsl(color));
    }

    chroma.push(currentRow);

  }

  if (!secondRow){

    chroma.push(chroma[0]);
  }

  return {luma : luma, chroma : chroma};
}

// input: h as an angle in [0,360] and s,l in [0,1] - output: r,g,b in [0,1]
function hslToRgb(h,s,l){

  // credit to an algorithm in https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion by kamil kielczewski

   let a=s*Math.min(l,1-l);
   let f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1);
   return {red : f(0) * 255, green : f(8) * 255, blue : f(4) * 255};
}   

// let imageSize;
let imageWidth;
let imageHeight;
let scaleX;
let scaleY;
// let startX;
// let startY;

let colors = 50;
let scaleFactor = 1;

let graphicWidth;
let graphicHeight;
let panelWidth;

let errorScaleX; // the error of the scale of the resolution to the dimensions per pixel. 
let errorScaleY; // since a fraction of a pixel cant be used, the scale is floored and the error is accumulated until a full pixel can be inserted

function App() {

  const [resolution, setResolution] = useState([10,10]);
  // const [colors, setColors] = useState(50);
  const [options, setOptions] = useState(
  
    <div className='container'>

      <p style={{"position" : "absolute", "left" : "0px", "width" : "50%"}}>palette size: </p>
      <input type="number" defaultValue={50} min={1} style={{"position" : "absolute", "right" : "0px", "width" : "40%"}} onBlur={(event)=>{

        if (Number(event.target.value) < 1 || event.target.value == ""){

          event.target.value = 1;
        }

        event.target.value = Math.round(event.target.value);

        colors = Number(event.target.value);

      }}></input>

    </div>
  )

  const [algorithm, setAlgorithm] = useState(); // name of selected algorithm
  const[infoVisibility, setInfoVisibility] = useState("hidden"); // information visibility
  const [description, setDescription] = useState(); // description of selected algorithm
  const [position, setPosition] = useState([]); // left top offsets for canvas


  useEffect(()=>{

    // const canvas = document.getElementById("graphic");
    const panel = document.getElementById("panel");

    graphicWidth = window.innerWidth - panel.clientWidth;
    graphicHeight = window.innerHeight
    panelWidth = panel.clientWidth;

    // canvas.width = window.innerWidth - panel.clientWidth;
    // canvas.height = window.innerHeight
    // canvas cant be resized using % in css, at least i cant manage it

  }
  ,[])

  return (
    <>
      
      <div id='panel'>

        <div id="heading">

            <h1 id="title">imgvis</h1>
            <a id="github" href="https://github.com/tinysuperion/imgvis" target="_blank">
              <img id="github-logo" src="github-mark.png"></img>
            </a>
        </div>

        <p id="description">visualize various image algorithms</p>

        <hr/>

        <div id="interface">

          <div className="algorithm">

            <p>algorithm</p>

            <div className="container">

              <select id="options" onChange={(event)=>{

                console.log(event.target.value);

                if (event.target.value == "quantization"){

                  setOptions(
                  
                    <div className='container'>

                      <p style={{"position" : "absolute", "left" : "0px", "width" : "50%"}}>palette size: </p>
                      <input id="option" type="number" defaultValue={50} min={1} style={{"position" : "absolute", "right" : "0px", "width" : "40%"}} onBlur={(event)=>{

                        if (Number(event.target.value) < 1 || event.target.value == ""){

                          event.target.value = 1;
                        }

                        event.target.value = Math.round(event.target.value);
                        colors = Number(event.target.value);

                      }}></input>
                    </div>                  
                  );

                  setTimeout(()=>{
                    // easy fix to wait until the element is added to the dom
                    // default value only works on the initial load

                    const input = document.getElementById("option");
                    input.value = 50;
                  }, 100);
                }

                else if (event.target.value == "chroma"){

                  // probably allow for other formats like 4:2:2 or 4:1:0 maybe

                  setOptions(

                    <>
                        
                      <div className='container'>

                        <p style={{"position" : "absolute", "left" : "0px", "width" : "50%"}}>scheme: </p>

                        <select id="chromaScheme" style={{"position" : "absolute", "right" : "0px", "width" : "40%"}}>

                          <option value="twoRow">4:2:2</option>
                          <option value="oneRow">4:2:0</option>

                        </select>
                      </div>

                    </>
                  )

                }

                else if (event.target.value == "bilinear" || event.target.value == "bicubic"){

                  {/* 
                    <p style={{"position" : "absolute", "left" : "0px", "width" : "50%"}}>scale factor: </p>

                    <input id="option" type="number" defaultValue={1} min={0} style={{"position" : "absolute", "right" : "0px", "width" : "40%"}} onChange={(event)=>{

                      scaleFactor = Number(event.target.value);
                    }}></input> */}

                  setOptions(

                    <>
                        
                      <div className='container'>

                        <p style={{"position" : "absolute", "left" : "0px", "width" : "50%"}}>scale: </p>

                        <input id="option" type="number" defaultValue={1} min={1} style={{"position" : "absolute", "right" : "0px", "width" : "40%"}} onChange={(event)=>{

                          scaleFactor = Number(event.target.value);
                        }}></input> 

                      </div>

                    </>
                  )

                  setTimeout(()=>{
                    // easy fix to wait until the element is added to the dom
                    // default value only works on the initial load

                    const input = document.getElementById("option");
                    input.value = 1;
                  }, 100);

                }

              }}>

                {/* <option value="huffman coding">huffman coding</option> turns out coding really is just codes, it creates a tree based off of the frequency of values, the path to it is its bit representation so left would be 0 and right would be 1, good for big differences in frequency, not quite so good for an awful bunch of numbers and little to no difference. anyway the fact its just a code means it doesnt change the appearance of an image at all so im not implementing it*/}

                <option value="quantization">color quantization</option>
                <option value="chroma">chroma subsampling</option>
                <option value="bilinear">bilinear interpolation</option>
                <option value="bicubic">bicubic interpolation</option>

              </select>

              <button id="infoButton" onClick={async ()=>{

                setInfoVisibility("visible");

                const selection = document.getElementById("options").value;

                if (selection == "quantization"){

                  setAlgorithm("color quantization");

                  // get file stuff some time

                  const file = await fetch("quantization.jsx");
                  const fileContent = await file.text();

                  // console.log(fileContent);

                  setDescription(

                    <div style = {{"fontSize" : "14px"}}>

                      <h2>description</h2>
                      <p>color quantization is a lossy image compression algorithm which decreases the amount of color samples used in the image and instead creates a color palette which each pixel maps to. <br/>this implementation uses octrees to quantize colors.</p>

                      <h2>steps</h2>

                      <ul>

                        <li>
                          
                          go through all pixels and insert into an octree 
                          <ul>
                            <li>an octree is a tree where each node has up to 8 children</li>
                            <li>the 8 children comes from the 3 r, g, and b components of color as the bits in each column are used as the index</li>
                            <li>for each bit of the 8 bit 255 color values, check the corresponding bit for each of the rgb components</li>
                            <li>use the combined state of all of those bits as the index for the child that it corresponds with (if at this bit in the byte red is 1, green is 0, and blue is 1, the index is 101 or 5)</li>
                            <li>continue, checking the next bit</li>
                            <li>what this accomplishes is the abillity to quantize or downsample all children representing a color to some parent through some similarity in bit representation</li>
                          </ul>
                        </li>

                        <li>
                          reduce the palette size

                          <ul>

                            <li>go to all leaf nodes of the tree (these are the actual colors used in the picture)</li>
                            <li>average leaf nodes into their parents until the desired palette size</li>

                          </ul>

                        </li>


                        <li>
                          apply the palette through traversing the octree until a leaf node is reached for every pixel</li>

                      </ul>

                      <hr/>

                      <h2>implementation</h2>

                    </div>


                  )

                }
                
                else if (selection == "chroma"){

                  setAlgorithm("chroma subsampling");

                  const file = await fetch("quantization.jsx");
                  const fileContent = await file.text();

                  // console.log(fileContent);

                  setDescription(

                    <div style = {{"fontSize" : "14px"}}>

                      <h2>description</h2>
                      <p>chroma subsampling is a lossy image compression algorithm which utilizes decreasing color resolution and maintaining brightness due to the eyes sensitivity to brightness compared to color</p>

                      <h2>steps</h2>

                      <ul>

                        <li>
                          pixels are grouped into a 4x2 grid 

                          <ul>
                            <li>there are multiple subsampling schemes (4:2:2 or 4:2:0 most popularly)</li>
                            <li>first value corresponds to luma or light values per row, second value references the chroma or color values in the first row, third is the same but for the second row</li>
                          </ul>

                        </li>

                        <li>
                          using the hsl color format, luma is stored separately from the hue as hue is either averaged or the first color is chosen to represent multiple pixels (usually 2)

                          <ul>
                            <li>luma is calculated weird, its based off of how bright we perceive light but im not sure how accurate this implementation of it is</li>
                          </ul>

                        </li>

                        <li>finally, apply the luma and chroma together through the hsl format to each pixel</li>

                      </ul>

                      <hr/>

                      <h2>implementation</h2>

                    </div>


                  )
                  
                }

                else if (selection == "bilinear"){

                  setAlgorithm("bilinear interpolation");

                  const file = await fetch("quantization.jsx");
                  const fileContent = await file.text();

                  // console.log(fileContent);

                  setDescription(

                    <div style = {{"fontSize" : "14px"}}>

                      <h2>description</h2>
                      <p>bilinear interpolation is an image rescaling algorithm that interpolates new pixels using existing pixels linearly</p>

                      <h2>steps</h2>

                      <ul>

                        <li>traverse pixels in the new dimensions</li>
                        <li>divide the pixels row by the scale factor from the original to map the positions to the original positions</li>
                        <li>since it wont map perfectly unless the scale was 1, the decimal place of this original position is used as the alpha value to interpolate between 2 pixels (ex: with a scale of 2, the columns 0, 1, and 2 would correspond with 0, 0.5, and 1 in the original dimensions)</li>
                        <li>linearly interpolate between the 2 pixels using alpha (the floor of the original position and the pixel after it)</li>
                        <li>do the same interpolation between the 2 pixels a row below</li>
                        <li>interpolate between the interpolations using decimal place of the row position as alpha</li>
                        <li>then just draw the results</li>
                        <li>NOTE: the last columns and rows that are scaled have no following pixel to interpolate to, instead the additional pixels from scaling should be distributed throughout the image to reach the correct dimensions, but i dont do that since id have to change the entire loop and the sunk cost fallacy calls to me, also im scared of bug fixing</li>

                      </ul>

                      <hr/>

                      <h2>implementation</h2>

                    </div>)
                  

                }

                else if (selection == "bicubic"){


                  setAlgorithm("bilinear interpolation");

                  const file = await fetch("quantization.jsx");
                  const fileContent = await file.text();

                  // console.log(fileContent);

                  setDescription(

                    <div style = {{"fontSize" : "14px"}}>

                      <h2>description</h2>
                      <p>bicubic interpolation is an image rescaling algorithm that interpolates new pixels using existing pixels with piece-wise cubic functions</p>

                      <h2>steps</h2>

                      <ul>

                        <li>traverse pixels in the new dimensions</li>
                        <li>divide the pixels row by the scale factor from the original to map the positions to the original positions</li>
                        <li>since it wont map perfectly unless the scale was 1, the decimal place of this original position is used as the alpha value to interpolate between 2 pixels (ex: with a scale of 2, the columns 0, 1, and 2 would correspond with 0, 0.5, and 1 in the original dimensions)</li>
                        <li>
                          compute the cubic function

                          <ul>
                            <li>cubic functions are expressed in the form ax^3 + bx^2 + cx + d</li>
                            <li>you can solve for the variables a, b, c, and d using the function and its derivative using the power rule: 3ax^2 + 2bx + c using systems of equations with f(0), f(1), and the derivative f'(0), f'(1)</li>  
                            <li>f(0) = d, f(1) = a + b + c + d, f'(0) = c, f'(1) = 3a + 2b + c </li>
                            <li>d = f(0), c = f'(0), a = f'(1) - 2 * f(1) + c + 2 * d, b = 3 * f(1) - f'(1) = 2 * c + 3 * d</li>
                            <li>the derivative of a point can be calculated using the slope of the points left and right of it, i cant say why mathematically exactly, but you can see the relationship with a graphic. ex: f'(1) = (f(2) - f(0)) / 2 </li>                         
                          </ul>  
                          
                        </li>

                        <li>substitute the appropriate alpha value into the function using the decimals place of the actual position the position maps to</li>
                        <li>draw the pixel</li>

                        <li>NOTE: the last columns and rows that are scaled have no following pixel to interpolate to, instead the additional pixels from scaling should be distributed throughout the image to reach the correct dimensions, but i dont do that since id have to change the entire loop and the sunk cost fallacy calls to me, also im scared of bug fixing. on another note, the loop should iterate through the original image pixels and have an additional loop for the scaled pixels as to not calculate the cubic function every time</li>

                      </ul>

                      <hr/>

                      <h2>implementation</h2>

                    </div>)

                }

              }}>?</button>

            </div>

            {options}

            <div className="controls">

              <button className='control' onClick={()=>{


                // const canvas = document.getElementById("graphic");
                const canvas = document.getElementById("visual");
                const selection = document.getElementById("options");
                const context = canvas.getContext("2d", {

                  // alpha: false,
                  willReadFrequently: true,
                });

                

                if (selection.value == "quantization"){

                  if (!imageWidth){

                    return;
                  }

                  // console.log(scale);

                  // const pixel = context.getImageData(startX, imageSize-1 + startY, 1,1);
                  // console.log(pixel.data);

                  // const image = context.getImageData(startX, startY, imageSize, imageSize);
                  const image = context.getImageData(0, 0, imageWidth, imageHeight);

                  const octree = new Octree(8);

                  // pixel scaling (more info found in the image generation)

                  let errorX = 0;
                  let errorY = 0;

                  // console.log(scaleX, scaleY);
                  // console.log(imageWidth, imageWidth - Math.floor(scaleX) * resolution[0]);

                  // console.log(errorScaleX * Math.floor(scaleX));

                  for (let row = 0; row < imageHeight; row+=scaleY){

                    // console.log("row: ", row);

                    for (let col = 0; col < imageWidth; col+=scaleX){

                      // const pixel = context.getImageData(row  + startX - 1, col + startY - 1, 1,1); // i reckon its more efficient to get the entire image rather than pixel by pixel but this is a lot cleaner to look at and i dont think its worth the time it saves
                      // octree.insert({red : pixel.data[0], green : pixel.data[1], blue : pixel.data[2]});

                      // console.log("col:", col);

                      errorX += errorScaleX * scaleX;

                      while (errorX > 0.9999999999){

                        errorX -= 1;
                        col++;
                      }

                      const pixelIndex = col * 4 + (row) * imageWidth * 4;
                      // gets the start of a pixel in the image data, the * 4 comes from the fact each pixel has 4 indices for rgba,
                      // then tack on the row which is multiplied the amount of pixels in a row by 4 for the rgba

                      octree.insert({red : image.data[pixelIndex], green : image.data[pixelIndex + 1], blue : image.data[pixelIndex + 2]});

                    }

                    // correction for scale to include the inserted pixels that correct for error for scale being floored
                    errorY += errorScaleY * scaleY;

                    while (errorY > 0.9999999999){

                      errorY -= 1;
                      row++;
                    }

                  }

                  octree.reduce(colors);

                  // for (let row = scale; row <= imageSize; row+= scale){

                  //   for (let col = scale; col <= imageSize; col+= scale){

                  for (let row = 0; row < imageWidth; row++){

                    for (let col = 0; col < imageHeight; col++){
                  
                      // applying palette

                      // const pixel = context.getImageData(row + startX, col + startY, 1,1); // i reckon its more efficient to get the entire image rather than pixel by pixel but this is a lot cleaner to look at and its not too slow
                      // console.log(pixel.data, row, col);
                      // const color = octree.getColor({red : pixel.data[0], green : pixel.data[1], blue : pixel.data[2]}); 
                      // pixel.data[0] = color.red / color.pixels;
                      // pixel.data[1] = color.green / color.pixels;
                      // pixel.data[2] = color.blue / color.pixels;

                      const pixelIndex = (col * 4) + (row * imageWidth * 4);
                      const color = octree.getColor({red : image.data[pixelIndex], green : image.data[pixelIndex + 1], blue : image.data[pixelIndex + 2]});
                      image.data[pixelIndex] = color.red / color.pixels;
                      image.data[pixelIndex+1] = color.green / color.pixels;
                      image.data[pixelIndex+2] = color.blue / color.pixels;

                      // console.log(color);              

                      // context.putImageData(pixel, row + startX, col + startY);
                    }

                  }
                  
                  // context.putImageData(image, startX, startY);
                  context.putImageData(image, 0, 0);

                }


                else if (selection.value == "chroma"){

                  const image = context.getImageData(0, 0, imageWidth, imageHeight);

                  // converting each color to hsl back to rgb and seeing if it works

                  // let hueSaturation = rgbToHsl({red : 255, green: 0, blue: 0});
                  // console.log("red:", hueSaturation);
                  // console.log("red: ", hslToRgb(hueSaturation.hue, hueSaturation.saturation, 0.5));

                  // hueSaturation = rgbToHsl({red : 0, green: 255, blue: 0});
                  // console.log("green:", hueSaturation);
                  // console.log("green:", hslToRgb(hueSaturation.hue, hueSaturation.saturation, 0.5));

                  // let errorX = 0;
                  // let errorY = 0;

                  console.log(image.data);

                  // console.log(errorScaleX, errorScaleY);
                  // console.log(scaleX, errorScaleX * scaleX);

                  // for (let row = 0; row < imageHeight; row += 2 * Math.floor(scaleY)){

                  //   for (let col = 0; col < imageWidth; col += 4 * Math.floor(scaleX)){

                  // for (let row = 0; row < 1; row += 2 * Math.floor(scaleY)){

                  //   for (let col = 0; col < Math.floor(scaleX) * 10; col += 4 * Math.floor(scaleX)){

                  for (let row = 0; row < scaleY * resolution[1]; row += 2 * scaleY){

                    for (let col = 0; col < scaleX * resolution[0]; col += 4 * scaleX){

                      // console.log(row, col);

                      // const index = row * imageSize * 4 + col*4;
                      // const [red, green, blue] = [image.data[index], image.data[index+1], image.data[index+2]];

                      // const luma = linearize(red/255) * 0.2126  + linearize(green/255) * 0.7152 + linearize(blue/255) * 0.0722;

                      // const luma = red/255 * 0.2126  + green/255 * 0.7152 + blue/255 * 0.0722
                      // const hueSaturation = rgbToHsl({red : red, green : green, blue : blue});
                      // const rgb = hslToRgb(hueSaturation.hue, hueSaturation.saturation, luma);

                      let colors = []; // represents a 4x2 grid. using chroma subsampling just happens to be less impactful on quality using a 4x2 grid

                      // const origin = row * 4 * imageWidth + col * 4;

                      // for (let gridRow = 0; gridRow < 2*scaleY; gridRow += scaleY){

                      //   // error accumulation to correct for the scaling to proper dimensions being floored

                      //   errorY += errorScaleY * scaleY;

                      //   // correct for inserted pixels (not exactly 1 due to rounding errors)
                      //   while (errorY > 0.9999999999){

                      //     errorY -= 1;
                      //     gridRow++;
                      //   }

                      //   // bounds checking
                      //   if ((row + gridRow) >= imageWidth){

                      //     break;
                      //   }

                      //   let currentRow = [];

                      //   for (let gridCol = 0; gridCol < 4 * scaleX; gridCol += scaleX){

                      //     // error accumulation to correct for the scaling to proper dimensions being floored

                      //     errorX += errorScaleX * scaleX;

                      //     // correct for inserted pixels (not exactly 1 due to rounding errors)
                      //     while (errorX > 0.9999999999){

                      //       errorX -= 1;
                      //       gridCol++;
                      //     }

                      //     // bounds checking
                      //     if (col + gridCol * scaleY >= imageHeight){

                      //       break;
                      //     }

                      //     const index = origin + gridRow * scaleX * 4 * imageWidth + gridCol * 4 * scaleY;
                      //     currentRow.push({red : image.data[index] / 255, green : image.data[index+1] / 255, blue : image.data[index+2] / 255})
                      //     // console.log({red : image.data[index], green : image.data[index+1], blue : image.data[index+2]});
                      //   }

                      //   colors.push(currentRow);
                      // }

                      for (let gridRow = 0; gridRow < 2; gridRow++){
                        // console.log("grid row: ", gridRow);

                        // let rowOffset = 0;
                        let rowOffset = Math.floor(errorScaleY * (row + gridRow * scaleY));
                        // rowOffset = (rowOffset > 0) ? rowOffset : 0;

                        // bounds checking
                        if ((row + rowOffset + gridRow * scaleX) >= imageHeight){
                        // if ((row + rowOffset + gridRow * Math.floor(scaleY)) >= Math.floor(scaleY) * resolution[1]){

                          break;
                        }

                        let currentRow = [];

                        for (let gridCol = 0; gridCol < 4; gridCol++){

                          // let colOffset = 0;
                          let colOffset = Math.floor(errorScaleX * (col + gridCol * scaleX));
                          // colOffset = (colOffset > 0) ? colOffset : 0;

                          // // console.log( (colOffset) ? 3 : 2);

                          // console.log(gridRow, gridCol, colOffset);
                          // console.log(col, gridCol * scaleX);
                          // console.log(errorScaleX, col + gridCol * scaleX);

                          // console.log("col");
                          // errorX += errorScaleX * Math.floor(scaleX);

                          // bounds checking
                          if ((col + colOffset + gridCol * scaleX) >= imageWidth){
                          // if ((col + colOffset + gridCol * Math.floor(scaleX)) >= Math.floor(scaleX) * resolution[0]){

                            break;
                          }

                          // const index = origin + gridRow * scaleX * 4 * imageWidth + gridCol * 4 * scaleY;
                          const index = ((row + rowOffset) * imageWidth * 4 + (col + colOffset) * 4) + (gridRow * imageWidth * 4 * Math.floor(scaleY) + gridCol * 4 * Math.floor(scaleX));
                          
                          // console.log("row: ", row + rowOffset + gridRow * Math.floor(scaleY), "col: ", col + colOffset + gridCol * Math.floor(scaleX), "index: ", index);
                          
                          currentRow.push({red : image.data[index] / 255, green : image.data[index+1] / 255, blue : image.data[index+2] / 255})
                        }

                        colors.push(currentRow);
                      }

                      // console.log(colors);

                      const secondRow = (document.getElementById("chromaScheme").value == "oneRow") ? false : true;
                      const lumaChroma = chroma(colors, secondRow);
                      // console.log(lumaChroma);

                      // console.log(luma, hueSaturation, rgb);

                      // filling out the pixels


                      // make rowoffset a higher scope so it carries over all the time

                      for (let gridRow = 0; gridRow < lumaChroma.luma.length; gridRow++){

                        // console.log("row!");

                        // offset to not overwrite added pixels, also honestly i expected to find issues with flooring it due to rounding errors,
                        // but they arent happening so thats cool. i guess i should probably protect it against it somewhat anyway incase its just a weird coincidence
                       
                        // shenanigans to avoid issues with rounding errors
                        let previousError = errorScaleY * (row + gridRow * scaleY); // "previous" since row + gridRow is the end of the previous pixel and the start of the current

                        if (Math.abs(Math.round(previousError) - previousError) < 0.0000000001){

                          previousError = Math.round(previousError);
                        }


                        // let rowOffset = Math.floor(errorScaleY * (row + gridRow * Math.floor(scaleY)));
                        let rowOffset = Math.floor(previousError);
                        rowOffset = (rowOffset > 0) ? rowOffset : 0;


                        // offset to include additional pixels to correct for error in scale being floored
                        let additionalRow = 0;

                        let error = errorScaleY * (row + gridRow * scaleY + scaleY);

                        if (Math.abs(Math.round(error) - error) < 0.0000000001){

                          error = Math.round(error);
                        }

                        // let currentErrorY = Math.floor(errorScaleY * (row + gridRow * Math.floor(scaleY) + Math.floor(scaleY))) - rowOffset; 
                        let currentErrorY = Math.floor(error) - Math.floor(previousError); // all that needs to be known is whether or not a whole pixel is formed from the previous, ex: 0.5 -> 1

                        // console.log("error y: ", currentErrorY, errorScaleY * (row + gridRow * scaleY + scaleY));
                        
                        // if (currentErrorY > 0){

                          // currentErrorY--;
                          additionalRow = currentErrorY;
                        // }

                        for (let gridCol = 0; gridCol < lumaChroma.luma[0].length; gridCol++){

                          // let colOffset = 0;
                          let colOffset = errorScaleX * (col + gridCol * scaleX);
                          // colOffset = (colOffset > 0) ? colOffset : 0;

                          if (Math.abs(Math.round(colOffset) - colOffset) < 0.0000000001){

                            colOffset = Math.round(colOffset);
                          }

                          colOffset = Math.floor(colOffset);

                          let additionalCol = 0;
                          // let additionalCol = Math.floor(errorScaleX * (col + gridCol * Math.floor(scaleX)));
                          let currentErrorX = errorScaleX * (col + gridCol * scaleX + scaleX);

                          if (Math.abs(Math.round(currentErrorX) - currentErrorX) < 0.0000000001){

                            currentErrorX = Math.round(currentErrorX);
                          }

                          currentErrorX = Math.floor(currentErrorX);

                          additionalCol = currentErrorX - colOffset;

                          // console.log("col: ", col, gridCol);
                          // console.log(errorScaleX, row, gridRow, scaleX);
                          // console.log("current error: ", currentErrorX, errorScaleX * (col + gridCol* scaleX), colOffset);
                          
                          // if (currentErrorX > 0){

                            // currentErrorX--;
                            // additionalCol = currentErrorX;
                          // }
                        

                          const chroma = lumaChroma.chroma[gridRow][Math.floor(gridCol/2)]
                          const luma = lumaChroma.luma[gridRow][gridCol];

                          const rgb = hslToRgb(chroma.hue, chroma.saturation, luma);

                          // console.log("rgb: ", rgb);

                          for (let pixelRow = row + rowOffset + gridRow * scaleY; pixelRow < row + rowOffset + additionalRow + gridRow * scaleY + scaleY; pixelRow++){

                            for (let pixelCol = col + colOffset + gridCol * scaleX; pixelCol < col + colOffset + additionalCol + gridCol * scaleX + scaleX; pixelCol++){

                              const index = pixelRow * imageWidth * 4 + pixelCol * 4;
                              image.data[index] = rgb.red;
                              image.data[index+1] = rgb.green;
                              image.data[index+2] = rgb.blue;
                            }
                          }

                        }

                        }

                      }

                  }

                  // console.log("end");

                  context.putImageData(image, 0, 0);

                }

                else if (selection.value == "bilinear"){

                  // gets offsets for retrieving pixels accurately, mainly only a function due to rounding errors
                  function getOffset(errorScale, position){

                    let error = errorScale * position;

                    if (Math.abs(Math.round(error) - error) < 0.0000000001){

                      error = Math.round(error);
                    }

                    return Math.floor(error); // amount of complete pixels to offset by

                  }

                  const image = context.getImageData(0,0, imageWidth, imageHeight);

                  const newResolution = [resolution[0] * scaleFactor, resolution[1] * scaleFactor];

                  let size = (graphicWidth > graphicHeight) ? graphicHeight * 0.6 : graphicWidth * 0.6;

                  let width;
                  let height;

                  if (newResolution[0] > size || newResolution[1] > size){

                    width = newResolution[0];
                    height = newResolution[1];
                  }
                  else{

                    if (newResolution[0] > newResolution[1]){

                      width = size;
                      height = (width / newResolution[0]) * newResolution[1];

                    }
                    else{

                      height = size;
                      width = (height / newResolution[1]) * newResolution[0];
                    }

                  }

                  const newScaleX = Math.floor(width / newResolution[0]);
                  const newScaleY = Math.floor(height / newResolution[1]);

                  // error to correct for by flooring scale (decimals are bad, i cant have a fraction of a pixel)
                  const newErrorScaleX = (width - newResolution[0] * newScaleX) / (newResolution[0] * newScaleX);
                  const newErrorScaleY = (height - newResolution[1] * newScaleY) / (newResolution[1] * newScaleY);

                  // overflowError is needed since if you try to apply scale by interpolating between 2 pixels, the last pixel has no pixel to interpolate to
                  // so the pixels end up as either completely the same color or you create a fake neighbor to interpolate to. 
                  // to avoid this instead of scaling the last pixel for every row and col i just add scale throughout the image


                  // to do later! not now though for the sake of time and because i dont want to

                  // let overflowErrorX = 0;  
                  // let overflowErrorY = 0;  
                  // let offset = 0; // offset scale pixels at the end since those dont have a pixel to interpolate to

                  // let overflowOffsetX = 0; // to not overwrite the pixels added due to overflow
                  // let overflowOffsetY = 0;

                  // no need to distribute any error otherwise, since additional pixels arent being added
                  // if (scaleFactor > 1){

                  //   overflowErrorY = newScaleY / height;
                  //   overflowErrorX = newScaleX / width;
                  //   offset = scaleFactor;
                  // }

                  const newImage = context.createImageData(width, height);

                  // new plan
                  // loop through pixels, divide by scale on x and y (now theres only one scale!), get original pixel, lerp using decimals place
                  // after math.floor to get original pixel from division

                  // scale factor is subtracted as the last pixel in each row and column cant be scaled properly, it has to do with the mismatch between index and position like if you go from 5 to 10 its last index goes from 4 to 9 since its length 5 is 1 greater than the actual last position which keeps compounding based off the scale.
                  // theres also nothing to interpolate to on the last pixel, instead those pixels are distributed throughout the image using overflowError
                  // doesnt really work with floating point numbers, or scales < 1, so ill have to make the amount subtracted 0 for those scales
                  for (let row = 0; row < newResolution[1]; row++){

                    for (let col = 0; col < newResolution[0]; col++){
                      
                      // by dividing it by the scale it gets the approximate row in the original image, the decimals place (it wont be an integer unless its right on the start of a row or col) can be used to determine proximity from row to row or col to col
                      // note that even though i divide by the scale factor to get the actual rows and cols, it doesnt really map onto eachother
                      // since the last point goes out scale - 1 times. ex: {0,...,9} -> {0,... 19} with a scale of 2.
                      // theres nothing that can really be done about this other than
                      // predicting the next point which doesnt exist, otherwise the pixel will repeat scale times
                      const actualRow = row / scaleFactor; 
                      const actualCol = col / scaleFactor;

                      // console.log(actualRow, actualCol);

                      const rowAlpha = actualRow - Math.floor(actualRow); // alpha is where to interpolate between 2 values
                      const colAlpha = actualCol - Math.floor(actualCol); 

                      // lerp lerp lerp

                      let rowOffset = errorScaleY * Math.floor(actualRow) * scaleY;
                      if (Math.abs(Math.round(rowOffset) - rowOffset) < 0.0000000001){

                        rowOffset = Math.round(rowOffset);
                      }
                      rowOffset = Math.floor(rowOffset);

                      let colOffset = Math.floor(errorScaleX * Math.floor(actualCol) * scaleX);
                      if (Math.abs(Math.round(colOffset) - colOffset) < 0.0000000001){
                        
                        colOffset = Math.round(colOffset);
                      }
                      colOffset = Math.floor(colOffset);

                      const index = Math.floor(actualRow) * imageWidth * 4 * scaleY + rowOffset * imageWidth * 4 + Math.floor(actualCol) * 4 * scaleX + colOffset * 4;

                      // the start is always the top left pixel, by top left i refer to a grid of pixels thats been scaled by some factor where all pixels are encompassed by 4 corners from the original set which are used to interpolate those new pixels
                      let current = {red : image.data[index], green : image.data[index+1], blue : image.data[index+2]};
                      // console.log("start:", current);
                      // console.log("alpha:", rowAlpha, colAlpha);
                      // console.log("row, col:", row, col);
                      // console.log("actual: ", actualRow, actualCol);
                      // console.log(newScale);


                    if ((Math.floor(actualCol) + 1) < resolution[0]){

                      // interpolate top left to top right with the fraction of col as alpha
                      // current.red = current.red * (1- colAlpha) + image.data[index + 4*scaleY] * colAlpha;
                      // current.green = current.green * (1 - colAlpha) + image.data[index + 4*scaleY + 1] * colAlpha;
                      // current.blue = current.blue * (1 - colAlpha) + image.data[index + 4*scaleY + 2] * colAlpha;

                      // console.log("offset stuff: ", getOffset(errorScaleX, Math.floor(actualCol) * scaleX + scaleX), colOffset);

                      // current.red = current.red * (1- colAlpha) + image.data[index + 4*scaleX + getOffset(errorScaleX, Math.floor(actualCol) * scaleX + scaleX) - colOffset] * colAlpha;
                      // current.green = current.green * (1 - colAlpha) + image.data[index + 4*scaleX + getOffset(errorScaleX, Math.floor(actualCol) * scaleX + scaleX) - colOffset + 1] * colAlpha;
                      // current.blue = current.blue * (1 - colAlpha) + image.data[index + 4*scaleX + getOffset(errorScaleX, Math.floor(actualCol) * scaleX + scaleX) - colOffset + 2] * colAlpha;

                      // offset to include for the next column
                      const nextColOffset = 4 * (getOffset(errorScaleX, Math.floor(actualCol) * scaleX + scaleX) - colOffset);
                      const nextRowOffset = imageWidth * 4 * (getOffset(errorScaleY, Math.floor(actualRow) * scaleY + scaleY) - rowOffset);

                      current.red = current.red * (1- colAlpha) + image.data[index + 4*scaleX + nextColOffset] * colAlpha;
                      current.green = current.green * (1 - colAlpha) + image.data[index + 4*scaleX + nextColOffset + 1] * colAlpha;
                      current.blue = current.blue * (1 - colAlpha) + image.data[index + 4*scaleX + nextColOffset + 2] * colAlpha;

                      // console.log("first: ", current);

                      if ((Math.floor(actualRow) + 1) < resolution[1]){

                        // interpolate bottom left to bottom right then interpolate the 2 interpolations using the fraction of row as alpha
                        
                        // const red = image.data[index + imageWidth * 4 * scaleX] * (1- colAlpha) + image.data[index + imageWidth * 4 * scaleX + 4*scaleY] * colAlpha;
                        // const green = image.data[index + imageWidth * 4 * scaleX + 1] * (1- colAlpha) + image.data[index + imageWidth * 4 * scaleX + 4* scaleY + 1] * colAlpha;
                        // const blue = image.data[index + imageWidth * 4 * scaleX + 2] * (1- colAlpha) + image.data[index + imageWidth * 4 * scaleX + 4*scaleY + 2] * colAlpha;

                        // console.log("offset stuff: ", getOffset(errorScaleY, Math.floor(actualRow) * scaleY + scaleY), rowOffset);

                        const red = image.data[index + imageWidth * 4 * scaleY + nextRowOffset] * (1- colAlpha) + image.data[index + imageWidth * 4 * scaleY + 4*scaleX + nextRowOffset + nextColOffset] * colAlpha;
                        const green = image.data[index + imageWidth * 4 * scaleY + nextRowOffset + 1] * (1- colAlpha) + image.data[index + imageWidth * 4 * scaleY + 4* scaleX + nextRowOffset + nextColOffset + 1] * colAlpha;
                        const blue = image.data[index + imageWidth * 4 * scaleY + nextRowOffset + 2] * (1- colAlpha) + image.data[index + imageWidth * 4 * scaleY + 4*scaleX + nextRowOffset + nextColOffset + 2] * colAlpha;

                        // console.log(red, green, blue);

                        current.red = current.red * (1- rowAlpha) + red * rowAlpha;
                        current.green = current.green * (1- rowAlpha) + green * rowAlpha;
                        current.blue = current.blue * (1- rowAlpha) + blue * rowAlpha;

                        // console.log("second: ", current);

                        // console.log("offsets: ",  nextRowOffset, nextColOffset);

                      }

                    }

                    else if ((actualRow + 1) < resolution[1]){

                      
                    //   // interpolate top left to bottom left

                      const nextRowOffset = imageWidth * 4 * (getOffset(errorScaleY, Math.floor(actualRow) * scaleY + scaleY) - rowOffset);

                      current.red = current.red * (1 - rowAlpha) + image.data[index + imageWidth * 4 * scaleY + nextRowOffset] * rowAlpha;
                      current.green = current.green * (1 - rowAlpha) + image.data[index + imageWidth * 4 * scaleY + nextRowOffset + 1] * rowAlpha;
                      current.blue = current.blue * (1 - rowAlpha) + image.data[index + imageWidth * 4 * scaleY + nextRowOffset + 2] * rowAlpha;

                    }

                      // console.log("end: ", current);


                      // amount of rows to offset by due to inserted additional rows

                      let newRowOffset = newErrorScaleY * row * newScaleY;
                      // console.log("row offset: ", newRowOffset);

                      if (Math.abs(Math.round(newRowOffset) - newRowOffset) < 0.0000000001){

                        newRowOffset = Math.round(newRowOffset);
                      }

                      newRowOffset = Math.floor(newRowOffset);

                      let newColOffset = newErrorScaleX * col * newScaleX;
                      // console.log("col offset: ", newColOffset);

                      if (Math.abs(Math.round(newColOffset) - newColOffset) < 0.0000000001){

                        newColOffset = Math.round(newColOffset);
                      }
                      newColOffset = Math.floor(newColOffset);


                      // ammount of rows and cols to insert additionally to correct for scale being floored because i cant put down a fraction of a pixel

                      let additionalRow = 0;
                      let currentErrorY = newErrorScaleY * (row * newScaleY + newScaleY);
                      // console.log("row error: ", currentErrorY);

                      if (Math.abs(Math.round(currentErrorY) - currentErrorY) < 0.0000000001){

                        currentErrorY = Math.round(currentErrorY);
                      }

                      currentErrorY = Math.floor(currentErrorY);
                      additionalRow = currentErrorY - newRowOffset;


                      let additionalCol = 0;
                      let currentErrorX = newErrorScaleX * (col * newScaleX + newScaleX);
                      // console.log("col error: ", currentErrorX);

                      if (Math.abs(Math.round(currentErrorX) - currentErrorX) < 0.0000000001){

                        currentErrorX = Math.round(currentErrorX);
                      }

                      currentErrorX = Math.floor(currentErrorX);

                      // console.log(currentErrorX, newColOffset);
                      additionalCol = currentErrorX - newColOffset;


                      const origin = row * width * newScaleY * 4 + newRowOffset * width * 4 +  col * 4 * newScaleX + newColOffset * 4;

                      // console.log("row col: ", row, col);
                      // console.log("scale: ", newScaleY, newScaleX);
                      // console.log("offsets: ", newRowOffset, newColOffset);
                      // console.log("additionals: ", additionalRow, additionalCol);
                      // console.log("dimensions: ", width, height);

                      // console.log(rowAlpha, colAlpha);

                      for (let pixelRow = 0; pixelRow < newScaleY + additionalRow; pixelRow++){

                        for (let pixelCol = 0; pixelCol < newScaleX + additionalCol; pixelCol++){

                          const pixelIndex = origin + pixelRow * width * 4 + pixelCol * 4;

                          // console.log(current, pixelIndex);

                          // if (rowAlpha != 0 || colAlpha != 0){

                          //   newImage.data[pixelIndex] = 255;
                          //   newImage.data[pixelIndex+1] = 255;
                          //   newImage.data[pixelIndex+2] = 255;
                          //   newImage.data[pixelIndex+3] = 255;

                          //   continue;

                          // }

                          newImage.data[pixelIndex] = current.red;
                          newImage.data[pixelIndex+1] = current.green;
                          newImage.data[pixelIndex+2] = current.blue;
                          newImage.data[pixelIndex+3] = 255;
                        }

                      }
                    }

                  }
               
                  // imageSize = size;         
                  // scale = newScale;      
                  // startX = (canvas.width - size)/2;
                  // startY = (canvas.height - size)/2

                  imageWidth = width;
                  imageHeight = height;
                  scaleX = newScaleX;
                  scaleY = newScaleY;
                  errorScaleX = newErrorScaleX;
                  errorScaleY = newErrorScaleY;

                  context.clearRect(0,0, imageWidth, imageHeight);
                  setPosition([(graphicWidth - width) / 2 + panelWidth, (graphicHeight - height) / 2]);
                  setResolution(newResolution);

                  canvas.width = imageWidth;
                  canvas.height = imageHeight;
                  context.putImageData(newImage, 0, 0);
                }

                else if (selection.value == "bicubic"){

                  // same thing but 4x4 grid of points rather than 2x2 and also cubic interpolation


                  // gets offsets for retrieving pixels accurately, mainly only a function due to rounding errors
                  function getOffset(errorScale, position){

                    let error = errorScale * position;

                    if (Math.abs(Math.round(error) - error) < 0.0001){

                      error = Math.round(error);
                    }

                    return Math.floor(error); // amount of complete pixels to offset by

                  }

                  const newResolution = [resolution[0] * scaleFactor, resolution[1] * scaleFactor];
                  let width;
                  let height;

                  console.log(newResolution);

                  let size = (graphicWidth > graphicHeight) ? graphicHeight * 0.6 : graphicWidth * 0.6;

                  if (newResolution[0] > size || newResolution[1] > size){

                    width = newResolution[0];
                    height = newResolution[1];
                  }
                  else{

                    if (newResolution[0] > newResolution[1]){

                      width = size;
                      height = (width / newResolution[0]) * newResolution[1];

                    }
                    else{

                      height = size;
                      width = (height / newResolution[1]) * newResolution[0];
                    }

                  }

                  const newScaleX = Math.floor(width / newResolution[0]);
                  const newScaleY = Math.floor(height / newResolution[1]);

                  // error to correct for by flooring scale (decimals are bad, i cant have a fraction of a pixel)
                  const newErrorScaleX = (width - newResolution[0] * newScaleX) / (newResolution[0] * newScaleX);
                  const newErrorScaleY = (height - newResolution[1] * newScaleY) / (newResolution[1] * newScaleY);

                  console.log("original:", imageWidth, imageHeight);
                  console.log("new: ", width, height);
                  console.log("old scales: ", scaleX, scaleY);
                  console.log("new scales: ", newScaleX, newScaleY);
                  console.log("old error: ", errorScaleX, errorScaleY);
                  console.log("new error: ", newErrorScaleX, newErrorScaleY);

                  let image = context.getImageData(0,0, imageWidth, imageHeight);
                  const colInterpolation = context.createImageData(width, imageHeight);
                  const newImage = context.createImageData(width, height);

                  // console.log(size, newScale, scale, resolution, newResolution);

                  // new plan
                  // loop through pixels, divide by scale on x and y (now theres only one scale!), get original pixel, lerp using decimals place
                  // after math.floor to get original pixel from division

                  // for (let row = 0; row < newResolution; row++){

                  // two passes, first it interpolates all of the columns in each row, then it interpolates the rows in each column
                  // otherwise i would have to interpolate in a 4x4 grid for every single pixel in order to get f(0) f(1)
                  // and f'(0) f'(1) to solve for the unknowns where to find the derivative i just get the slope of the adjacent points

                  // check if an offset to the row or col is valid within a column or row, if it is return the value 
                  // otherwise return the inital or starting value
                  // function outOfBounds(start, offset, color, index, scale, errorOffsetX, errorOffsetY, original, width_, height_){
                  //   // start is the initial row or col used for bounds checking and error correction, offset is an additional row or col from start
                  //   // color is an offset in the index for the color offset of 0 is red 1 is green 2 is blue
                  //   // index is the actual start index, errorScale is the error scale to use depending on dimensions & direction (row, col)
                  //   // similarly scale is the scale to use depending on the dimension & direction
                  //   // error offset are the amount of pixels that were added for error correction to offset by
                  //   // original is the original starting index in case of going out of bounds
                  //   // the parameters for this function are god awful, luckily i only need to use it in brief bursts

                  //   // console.log("index: ", index, "start: ", start, 'offset: ', offset / 4, "color: ", color);

                  //   let row = true;

                  //   // if offset is less than the amount of pixels in a row it must be an offset in the column
                  //   if (offset < width_ * 4){

                  //     row = false;
                  //   }

                  //   // console.log("offsets: ", errorOffsetX, errorOffsetY);
                  //   // console.log("status: ", start * scale + offset / (4 * (1 - row) + imageWidth * 4 * row), imageWidth);
                  //   // console.log("status with offset: ", start * scale + offset / (4 * (1 - row) + imageWidth * 4 * row) + errorOffsetX * (1 - row) + errorOffsetY * row, imageWidth);

                  //   if ((start * scale + offset / (4 * (1 - row) + width_ * 4 * row) + errorOffsetX  * (1 - row) + errorOffsetY * row) >= (width_ * (1 - row) + height_ * row) ||  
                  //   (start * scale + offset / (4 * (1 - row) + width_ * 4 * row) + errorOffsetX * (1 - row) + errorOffsetY * row ) < 0){


                  //     // console.log('here', start, offset / (4 * scale * (1 - row) + imageSize * 4 * scale * row), resolution);

                  //     // console.log("out of bounds");

                  //     return original;
                  //   }

                  //   // console.log("error offset is ", errorOffset);

                  //   // console.log(image.data[index + offset + errorOffset + color]);

                  //   // return image.data[index + offset + errorOffsetX + errorOffsetY + color];

                  //   return index + offset + errorOffsetX * 4 + errorOffsetY * width_ * 4 + color;
                  // }

                  for (let row = 0; row < resolution[1]; row++){

                    for (let col = 0; col < newResolution[0]; col++){

                      // ax^3 + bx^2 + cx + d

                      // f(x) = ax^3 + bx^2 + cx + d
                      // f'(x) = 3ax^2 + 2bx + c | derivative of the function using the power rule (x^n = nx^(n-1))

                      // f(0) = d f(1) = a + b + c + d
                      // f'(0) = c f'(1) = 3a + 2b + c

                      // a = f'(1) - 2f(1) + f'(0) + 2f(0) : 3a + 2b + c - (2a + 2b + 2c + 2d) + c + 2d
                      // b = 3f(1) - f'(1) - 2f'(0) - 3f(0) : 3a + 3b + 3c + 3d - (3a + 2b + c) - 2c - 3d
                      // c = f'(0)
                      // d = f(0)

                      // the derivative can be substituted by the slope of 2 adjacent points. the relationship between the slope of the points
                      // and the derivative of the point can be seen when changing the slope

                      // STUFF
                      // later on you should increment by new scale, this way you only have to calculate stuff once
                      // and apply alpha, bad news you have to store all that stuff in a bunch of variables or objects and apply alpha

                      // thats a lot of effort, also you cant jsut apply alpha like that you have to put it as an x in the function
                      // which means when creating the function you need all of the unknowns for each interpolation
                      // for all rgb values, which is crazy to look at

                      // inner loop later to go through scale factor

                      // by dividing it by the scale it gets the approximate row or col in the original image, 
                      // the decimals place (it wont be an integer unless its right on the start of a row or col) 
                      // can be used to determine proximity from row to row or col to col
                      
                      // const actualRow = row / scaleFactor; 
                      const actualCol = col / scaleFactor;

                      // console.log("position: ", row, actualCol);

                      // const rowAlpha = actualRow - Math.floor(actualRow); // alpha is where to interpolate between 2 values
                      const colAlpha = actualCol - Math.floor(actualCol); 

                      // const index = Math.floor(actualRow) * imageSize * 4 * scale + Math.floor(actualCol) * 4 * scale;

                      // only needed for image.data[index] as the value outOfBounds() returns includes the offset
                      let rowOffset = errorScaleY * row * scaleY;
                      if (Math.abs(Math.round(rowOffset) - rowOffset) < 0.0000000001){

                        rowOffset = Math.round(rowOffset);
                      }
                      rowOffset = Math.floor(rowOffset);

                      let colOffset = Math.floor(errorScaleX * Math.floor(actualCol) * scaleX);
                      if (Math.abs(Math.round(colOffset) - colOffset) < 0.0000000001){
                        
                        colOffset = Math.round(colOffset);
                      }
                      colOffset = Math.floor(colOffset);

                      // console.log(colAlpha, index);

                      const index = row * imageWidth * 4 * scaleY +  Math.floor(actualCol) * 4 * scaleX;

                      // the 4 points used to interpolate (interpolation takes place beteween 2nd and 3rd point, but the left and right points are used to determine the derivative to solve for the cubic function through systems of equations)
                      const x2 = index + rowOffset * imageWidth * 4 + colOffset * 4; // origin
                      let x3 = x2; // right 1 from the origin
                      let x1 = x2; // left 1 from the origin
                      let x4 = x2; // right 2 from the origin
                      if (Math.floor(actualCol) + 1 < resolution[0]){

                        x3 = index + 4 * scaleX + rowOffset * imageWidth * 4 + getOffset(errorScaleX, Math.floor(actualCol) * scaleX + scaleX) * 4;
                      }

                      if (Math.floor(actualCol) - 1 >= 0){

                        x1 = index - 4 * scaleX + rowOffset * imageWidth * 4 + getOffset(errorScaleX, Math.floor(actualCol) * scaleX - scaleX) * 4;
                      }

                      if (Math.floor(actualCol) + 2 < resolution[0]){

                        x4 = index + 2 * 4 * scaleX + rowOffset * imageWidth  * 4 + getOffset(errorScaleX, Math.floor(actualCol) * scaleX + 2 * scaleX) * 4;
                      }


                      // const x3 = outOfBounds(Math.floor(actualCol), 4 * scaleX, 0, index, scaleX, getOffset(errorScaleX, Math.floor(actualCol) * scaleX + scaleX), rowOffset, x2, imageWidth, imageHeight);
                      // const x1 = outOfBounds(Math.floor(actualCol), -4 * scaleX, 0, index, scaleX, getOffset(errorScaleX, Math.floor(actualCol) * scaleX - scaleX), rowOffset, x2, imageWidth, imageHeight); // left 1 from the origin
                      // const x4 = outOfBounds(Math.floor(actualCol), 2 * 4 * scaleX, 0, index, scaleX, getOffset(errorScaleX, Math.floor(actualCol) * scaleX + 2 * scaleX), rowOffset, x2, imageWidth, imageHeight); // right 2 from the origin

                      // console.log("juice: ", image.data[x1], image.data[x2], image.data[x3], image.data[x4]);
                      // console.log(Math.floor(actualCol), scaleX, getOffset(errorScaleX, Math.floor(actualCol) * scaleX - scaleX));
                      // console.log("info: ", index, 4 * scaleX, getOffset(errorScaleX, Math.floor(actualCol) * scaleX + scaleX));
                      // console.log("more stuff: ", errorScaleX, errorScaleX *(Math.floor(actualCol) * scaleX + scaleX));
                      // console.log("same thing right?: ", outOfBounds(Math.floor(actualCol), 4 * scaleX, 0, index, scaleX, getOffset(errorScaleX, Math.floor(actualCol) * scaleX + scaleX), 0, x2));
                      // console.log(x1, x2, x3, x4);
                      // console.log("x1: ", image.data[x1], image.data[x1 + 1], image.data[x1 + 2]);
                      // console.log("x2: ", image.data[x2], image.data[x2 + 1], image.data[x2 + 2]);
                      // console.log("x3: ", image.data[x3], image.data[x3 + 1], image.data[x3 + 2]);
                      // console.log("x4: ", image.data[x4], image.data[x4 + 1], image.data[x4 + 2]);
                      // console.log(getOffset(errorScaleX, Math.floor(actualCol) * scaleX + 2 * scaleX));

                      let a, b, c, d; // ax^3 + bx^2 + cx + d

                      // d = image.data[index + rowOffset * imageWidth * 4 + colOffset * 4];
                      // // c = (image[index + 4 * scale] - image.data[index - 4 * scale]) / 2;
                      // c = (outOfBounds(Math.floor(actualCol), 4 * scaleX, 0, index, scaleX, getOffset(errorScaleX, )) - outOfBounds(Math.floor(actualCol), -4 * scaleX, 0, index, errorScaleX, scaleX)) / 2;
                      // // a = (image[index + 4 * scale * 2] - image.data[index]) / 2 - (2 * image[index + 4 * scale]) + c + 2 * d;
                      // a = (outOfBounds(Math.floor(actualCol), 2 * 4 * scaleX, 0, index, errorScaleX, scaleX) - image.data[index]) / 2 - (2 * outOfBounds(Math.floor(actualCol), 4 * scaleX , 0, index, errorScaleX, scaleX)) + c + 2 * d;
                      // // b = 3 * image[index + 4 * scale] - (image[index + 4 * scale * 2] - image.data[index]) / 2 - 2 * c - 3 * d; 
                      // b = 3 * outOfBounds(Math.floor(actualCol), 4 * scaleX, 0, index, errorScaleX, scaleX) - (outOfBounds(Math.floor(actualCol), 2 * 4 * scaleX, 0, index, errorScaleX, scaleX) - image.data[index]) / 2 - 2 * c - 3 * d; 

                      d = image.data[x2]; 
                      c = (image.data[x3] - image.data[x1]) / 2;
                      a = (image.data[x4] - image.data[x2]) / 2 - 2 * image.data[x3] + c + 2 * d;
                      b = 3 * image.data[x3] - (image.data[x4] - image.data[x2]) / 2 - 2 * c - 3 * d;

                      // probably iterate by scalefactor so i dont need to calculate the same curve scale times

                      // current.red = a * Math.pow(colAlpha, 3) + b * Math.pow(colAlpha, 2) + c * colAlpha + d;
                      //

                      const red = a * Math.pow(colAlpha, 3) + b * Math.pow(colAlpha, 2) + c * colAlpha + d;
                      // console.log("red: ", red);
                      // console.log(a, b, c, d);

                      // console.log(image.data[index + 4 * scale], outOfBounds(col, 4 * scale, 0, index), outOfBounds(col, 2 * 4 * scale, 0, index), outOfBounds (col, -4 * scale, 0, index));

                      // d = image[index + 1];
                      // c = (image[index + 4 * scale + 1] - image.data[index - 4 * scale + 1]) / 2;
                      // a = (image[index + 4 * scale * 2 + 1] - image.data[index + 1]) / 2 - (2 * image[index + 4 * scale + 1]) + c + 2 * d;
                      // b = 3 * image[index + 4 * scale + 1] - (image[index + 4 * scale * 2 + 1] - image.data[index + 1]) / 2 - 2 * c - 3 * d; 

                      // d = image.data[index + rowOffset * imageWidth * 4 + colOffset * 4 + 1];
                      // // c = (image[index + 4 * scale] - image.data[index - 4 * scale]) / 2;
                      // c = (outOfBounds(Math.floor(actualCol), 4 * scaleX, 1, index, errorScaleX, scaleX) - outOfBounds(Math.floor(actualCol), -4 * scaleX, 1, index, errorScaleX, scaleX)) / 2;
                      // // a = (image[index + 4 * scale * 2] - image.data[index]) / 2 - (2 * image[index + 4 * scale]) + c + 2 * d;
                      // a = (outOfBounds(Math.floor(actualCol), 2 * 4 * scaleX, 1, index, errorScaleX, scaleX) - image.data[index + 1]) / 2 - (2 * outOfBounds(Math.floor(actualCol), 4 * scaleX, 1, index, errorScaleX, scaleX)) + c + 2 * d;
                      // // b = 3 * image[index + 4 * scale] - (image[index + 4 * scale * 2] - image.data[index]) / 2 - 2 * c - 3 * d; 
                      // b = 3 * outOfBounds(Math.floor(actualCol), 4 * scaleX, 1, index, errorScaleX, scaleX) - (outOfBounds(Math.floor(actualCol), 2 * 4 * scaleX, 1, index, errorScaleX, scaleX) - image.data[index + 1]) / 2 - 2 * c - 3 * d; 

                      d = image.data[x2 + 1];
                      c = (image.data[x3 + 1] - image.data[x1 + 1]) / 2;
                      a = (image.data[x4 + 1] - image.data[x2 + 1]) / 2 - 2 * image.data[x3 + 1] + c + 2 * d;
                      b = 3 * image.data[x3 + 1] - (image.data[x4 + 1] - image.data[x2 + 1]) / 2 - 2 * c - 3 * d;

                      const green = a * Math.pow(colAlpha, 3) + b * Math.pow(colAlpha, 2) + c * colAlpha + d;
                      // console.log("green: ", green);
                      // console.log(a, b, c, d);

                      // d = image[index + 2];
                      // c = (image[index + 4 * scale + 2] - image.data[index - 4 * scale + 2]) / 2;
                      // a = (image[index + 4 * scale * 2 + 2] - image.data[index + 2]) / 2 - (2 * image[index + 4 * scale + 2]) + c + 2 * d;
                      // b = 3 * image[index + 4 * scale + 2] - (image[index + 4 * scale * 2 + 2] - image.data[index + 2]) / 2 - 2 * c - 3 * d; 

                      // d = image.data[index + rowOffset * imageWidth * 4 + colOffset * 4 + 2];
                      // // c = (image[index + 4 * scale] - image.data[index - 4 * scale]) / 2;
                      // c = (outOfBounds(Math.floor(actualCol), 4 * scaleX, 2, index, errorScaleX, scaleX) - outOfBounds(Math.floor(actualCol), -4 * scaleX, 2, index, errorScaleX, scaleX)) / 2;
                      // // a = (image[index + 4 * scale * 2] - image.data[index]) / 2 - (2 * image[index + 4 * scale]) + c + 2 * d;
                      // a = (outOfBounds(Math.floor(actualCol), 2 * 4 * scaleX, 2, index, errorScaleX, scaleX) - image.data[index + 2]) / 2 - (2 * outOfBounds(Math.floor(actualCol), 4 * scaleX, 2, index, errorScaleX, scaleX)) + c + 2 * d;
                      // // b = 3 * image[index + 4 * scale] - (image[index + 4 * scale * 2] - image.data[index]) / 2 - 2 * c - 3 * d; 
                      // b = 3 * outOfBounds(Math.floor(actualCol), 4 * scaleX, 2, index, errorScaleX, scaleX) - (outOfBounds(Math.floor(actualCol), 2 * 4 * scaleX, 2, index, errorScaleX, scaleX) - image.data[index + 2]) / 2 - 2 * c - 3 * d; 

                      d = image.data[x2 + 2];
                      c = (image.data[x3 + 2] - image.data[x1 + 2]) / 2;
                      a = (image.data[x4 + 2] - image.data[x2 + 2]) / 2 - 2 * image.data[x3 + 2] + c + 2 * d;
                      b = 3 * image.data[x3 + 2] - (image.data[x4 + 2] - image.data[x2 + 2]) / 2 - 2 * c - 3 * d;

                      const blue = a * Math.pow(colAlpha, 3) + b * Math.pow(colAlpha, 2) + c * colAlpha + d;
                      // console.log("blue: ", blue);
                      // console.log(a, b, c, d);

                      let newColOffset  = newErrorScaleX * col * newScaleX; // amount of pixels to offset based off of how many additional pixels have been (or should be) added using error scale at the start of this pixel
                      if (Math.abs(Math.round(newColOffset) - newColOffset) < 0.0000000001){

                        newColOffset = Math.round(newColOffset);
                      }
                      newColOffset = Math.floor(newColOffset);


                      let currentErrorY  = errorScaleY * (row * scaleY + scaleY); // checks whether a pixel within the larger scaled pixel of the resolution creates an additional pixel for error correction
                      if (Math.abs(Math.round(currentErrorY) - currentErrorY) < 0.0000000001){

                        currentErrorY = Math.round(currentErrorY);
                      }
                      currentErrorY = Math.floor(currentErrorY);

                      let currentErrorX  = newErrorScaleX * (col * newScaleX + newScaleX); // checks whether a pixel within the larger scaled pixel of the resolution creates an additional pixel for error correction
                      
                      if (Math.abs(Math.round(currentErrorX) - currentErrorX) < 0.0000000001){

                        currentErrorX = Math.round(currentErrorX);
                      }
                      currentErrorX = Math.floor(currentErrorX);

                      const additionalRow = currentErrorY - rowOffset;
                      const additionalCol = currentErrorX - newColOffset;

                      const origin = row * 4 * width * scaleY + rowOffset * 4 * width + col * 4 * newScaleX + newColOffset * 4;

                      // console.log("rgb", red, green, blue);

                      // console.log(rowOffset, newColOffset);
                      // console.log(currentErrorY, currentErrorX);
                      // console.log(additionalRow, additionalCol);

                      for (let pixelRow = 0; pixelRow < scaleY + additionalRow; pixelRow++){

                        for (let pixelCol = 0; pixelCol < newScaleX + additionalCol; pixelCol++){

                          const pixelIndex = origin + pixelRow * width * 4 + pixelCol * 4;

                          colInterpolation.data[pixelIndex] = red;
                          colInterpolation.data[pixelIndex+1] = green;
                          colInterpolation.data[pixelIndex+2] = blue;
                          colInterpolation.data[pixelIndex+3] = 255;
                        }
                      }

                    }

                  }

                  // interpolate using both interpolations

                  // primarily just for the outofbounds function
                  image = colInterpolation; 
                  // imageSize = size;

                  // console.log("interpolating both\n\n\n");

                  for (let row = 0; row < newResolution[1]; row++){

                    for (let col = 0; col < newResolution[0]; col++){

                      // console.log("col: ", col);

                      // f(0) = current.color f(1) = const color
                      // f'(0) = (image[index - imageSize *4 * scale] - const color) / 2 f'(1) = (current.color - image[index + imageSize * 4 * scale]) / 2

                      // f(0) = d f(1) = a + b + c + d
                      // f'(0) = c f'(1) = 3a + 2b + c

                      // a = f'(1) - 2f(1) + f'(0) + 2f(0) : 3a + 2b + c - (2a + 2b + 2c + 2d) + c + 2d
                      // b = 3f(1) - f'(1) - 2f'(0) - 3f(0) : 3a + 3b + 3c + 3d - (3a + 2b + c) - 2c - 3d
                      // c = f'(0)
                      // d = f(0)

                      const actualRow = row / scaleFactor;
                      // const actualCol = col / scaleFactor;

                      const rowAlpha = actualRow - Math.floor(actualRow);

                      let rowOffset = errorScaleY * Math.floor(actualRow) * scaleY;
                      if (Math.abs(Math.round(rowOffset) - rowOffset) < 0.0000000001){

                        rowOffset = Math.round(rowOffset);
                      }
                      rowOffset = Math.floor(rowOffset);

                      let colOffset = newErrorScaleX * col * newScaleX;
                      if (Math.abs(Math.round(colOffset) - colOffset) < 0.0000000001){
                        
                        colOffset = Math.round(colOffset);
                      }
                      colOffset = Math.floor(colOffset);

                      const index = Math.floor(actualRow) * width * 4 * scaleY +  col * 4 * newScaleX;

                      // the 4 points used to interpolate (interpolation takes place beteween 2nd and 3rd point, but the left and right points are used to determine the derivative to solve for the cubic function through systems of equations)
                      const x2 = index + rowOffset * width * 4 + colOffset * 4; // origin
                      let x3 = x2; // right 1  from the origin
                      let x1 = x2; // left 1 from the origin
                      let x4 = x2; // right 2 from the origin

                      if (Math.floor(actualRow) + 1 < resolution[1]){

                        x3 = index + width * 4 * scaleY + colOffset * 4 + getOffset(errorScaleY, Math.floor(actualRow) * scaleY + scaleY) * width * 4;
                      }

                      if (Math.floor(actualRow) - 1 >= 0){

                        x1 = index - width * 4 * scaleY + colOffset * 4 + getOffset(errorScaleY, Math.floor(actualRow) * scaleY - scaleY) * width * 4;
                      }

                      if (Math.floor(actualRow) + 2 < resolution[1]){

                        x4 = index + 2 * width * 4 * scaleY + colOffset * 4 + getOffset(errorScaleY, Math.floor(actualRow) * scaleY + 2 * scaleY) * width * 4;
                      }

                      // const x3 = outOfBounds(Math.floor(actualRow), width * 4 * scaleY, 0, index, scaleY, colOffset, getOffset(errorScaleY, Math.floor(actualRow) * scaleY + scaleY), x2, width, imageHeight); // right 1 from the origin
                      // const x1 = outOfBounds(Math.floor(actualRow), -width * 4 * scaleY, 0, index, scaleY, colOffset, getOffset(errorScaleY, Math.floor(actualRow) * scaleY - scaleY), x2, width, imageHeight); // left 1 from the origin
                      // const x4 = outOfBounds(Math.floor(actualRow), 2 * width * 4 * scaleY, 0, index, scaleY, colOffset, getOffset(errorScaleY, Math.floor(actualRow) * scaleY + 2 * scaleY), x2, width, imageHeight); // right 2 from the origin

                      let a,b,c,d;

                      // d = image.data[index];
                      // // c = (image.data[index - imageSize * 4 * scale] - image.data[index + imageSize * 4 * scale]) / 2;
                      // c = (outOfBounds(actualRow, -imageWidth * 4 * scaleY, 0, index) - outOfBounds(actualRow, imageWidth * 4 * scaleY, 0, index)) / 2;                      
                      // // a = (image.data[index + imageSize * 4 * scale] - image.data[index]) / 2 - 2 * image.data[index + imageSize * 4 * scale] + c + 2 * d;
                      // a = (outOfBounds(actualRow, imageWidth * 4 * scaleX, 0, index) - image.data[index]) / 2 - 2 * outOfBounds(actualRow, imageWidth * 4 * scaleY, 0, index) + c + 2 * d;
                      // // b = 3 * image.data[index + imageSize * 4 * scale] - (image[index + imageSize * 4 * scale] - image.data[index]) / 2 - 2 * c - 3 * d;
                      // b = 3 * outOfBounds(actualRow, imageWidth * 4 * scaleY, 0, index) - (outOfBounds(actualRow, imageWidth * 2 * 4 * scaleY, 0, index) - image.data[index]) / 2 - 2 * c - 3 * d;

                      d = image.data[x2]; 
                      c = (image.data[x3] - image.data[x1]) / 2;
                      a = (image.data[x4] - image.data[x2]) / 2 - 2 * image.data[x3] + c + 2 * d;
                      b = 3 * image.data[x3] - (image.data[x4] - image.data[x2]) / 2 - 2 * c - 3 * d;

                      const red = a * Math.pow(rowAlpha, 3) + b * Math.pow(rowAlpha, 2) + c * rowAlpha + d; 
                      // console.log("red: ", red);
                      // console.log(a,b,c,d);
                      
                      // d = image.data[index+1];
                      // // c = (image.data[index - imageSize * 4 * scale] - image.data[index + imageSize * 4 * scale]) / 2;
                      // c = (outOfBounds(actualRow, -imageWidth * 4 * scaleY, 1, index) - outOfBounds(actualRow, imageWidth * 4 * scaleY, 1, index)) / 2;                      
                      // // a = (image.data[index + imageSize * 4 * scale] - image.data[index]) / 2 - 2 * image.data[index + imageSize * 4 * scale] + c + 2 * d;
                      // a = (outOfBounds(actualRow, imageWidth * 4 * scaleY, 1, index) - image.data[index+1]) / 2 - 2 * outOfBounds(actualRow, imageWidth * 4 * scaleY, 1, index) + c + 2 * d;
                      // // b = 3 * image.data[index + imageSize * 4 * scale] - (image[index + imageSize * 4 * scale] - image.data[index]) / 2 - 2 * c - 3 * d;
                      // b = 3 * outOfBounds(actualRow, imageWidth * 4 * scaleY, 1, index) - (outOfBounds(actualRow, imageWidth * 2 * 4 * scaleY, 1, index) - image.data[index+1]) / 2 - 2 * c - 3 * d;

                      d = image.data[x2 + 1]; 
                      c = (image.data[x3 + 1] - image.data[x1 + 1]) / 2;
                      a = (image.data[x4 + 1] - image.data[x2 + 1]) / 2 - 2 * image.data[x3 + 1] + c + 2 * d;
                      b = 3 * image.data[x3 + 1] - (image.data[x4 + 1] - image.data[x2 + 1]) / 2 - 2 * c - 3 * d;

                      const green = a * Math.pow(rowAlpha, 3) + b * Math.pow(rowAlpha, 2) + c * rowAlpha + d;  
                      // console.log("green: ", green);
                      // console.log(a,b,c,d);

                      // d = image.data[index+2];
                      // // c = (image.data[index - imageSize * 4 * scale] - image.data[index + imageSize * 4 * scale]) / 2;
                      // c = (outOfBounds(actualRow, -imageWidth * 4 * scaleY, 2, index) - outOfBounds(actualRow, imageWidth * 4 * scaleY, 2, index)) / 2;                      
                      // // a = (image.data[index + imageSize * 4 * scale] - image.data[index]) / 2 - 2 * image.data[index + imageSize * 4 * scale] + c + 2 * d;
                      // a = (outOfBounds(actualRow, imageWidth * 4 * scaleY, 2, index) - image.data[index+2]) / 2 - 2 * outOfBounds(actualRow, imageWidth * 4 * scaleY, 2, index) + c + 2 * d;
                      // // b = 3 * image.data[index + imageSize * 4 * scale] - (image[index + imageSize * 4 * scale] - image.data[index]) / 2 - 2 * c - 3 * d;
                      // b = 3 * outOfBounds(actualRow, imageWidth * 4 * scaleY, 2, index) - (outOfBounds(actualRow, imageWidth * 2 * 4 * scaleY, 2, index) - image.data[index+2]) / 2 - 2 * c - 3 * d;

                      d = image.data[x2 + 2]; 
                      c = (image.data[x3 + 2] - image.data[x1 + 2]) / 2;
                      a = (image.data[x4 + 2] - image.data[x2 + 2]) / 2 - 2 * image.data[x3 + 2] + c + 2 * d;
                      b = 3 * image.data[x3 + 2] - (image.data[x4 + 2] - image.data[x2 + 2]) / 2 - 2 * c - 3 * d;

                      const blue = a * Math.pow(rowAlpha, 3) + b * Math.pow(rowAlpha, 2) + c * rowAlpha + d;  
                      // console.log("blue: ", blue);
                      // console.log(a,b,c,d);

                      // console.log(red, green, blue);

                      let newRowOffset  = newErrorScaleY * row * newScaleY; // amount of pixels to offset based off of how many additional pixels have been (or should be) added using error scale at the start of this pixel
                      if (Math.abs(Math.round(newRowOffset) - newRowOffset) < 0.0000000001){

                        newRowOffset = Math.round(newRowOffset);
                      }
                      newRowOffset = Math.floor(newRowOffset);

                      let newColOffset  = newErrorScaleX * col * newScaleX; 
                      if (Math.abs(Math.round(newColOffset) - newColOffset) < 0.0000000001){

                        newColOffset = Math.round(newColOffset);
                      }
                      newColOffset = Math.floor(newColOffset);

                      let currentErrorY  = newErrorScaleY * (row * newScaleY + newScaleY); // checks whether a pixel within the larger scaled pixel of the resolution creates an additional pixel for error correction
                      if (Math.abs(Math.round(currentErrorY) - currentErrorY) < 0.0000000001){

                        currentErrorY = Math.round(currentErrorY);
                      }
                      currentErrorY = Math.floor(currentErrorY);

                      let currentErrorX  = newErrorScaleX * (col * newScaleX + newScaleX); // checks whether a pixel within the larger scaled pixel of the resolution creates an additional pixel for error correction
                      if (Math.abs(Math.round(currentErrorX) - currentErrorX) < 0.0000000001){

                        currentErrorX = Math.round(currentErrorX);
                      }
                      currentErrorX = Math.floor(currentErrorX);

                      const additionalRow = currentErrorY - newRowOffset;
                      const additionalCol = currentErrorX - newColOffset;

                      const origin = row * width * 4 * newScaleY  + newRowOffset * width * 4 + col * 4 * newScaleX + newColOffset * 4;

                      // console.log("rgb", red, green, blue);
                      // console.log("position: ", row, col);
                      // console.log("offset: ", newRowOffset, newColOffset);
                      // console.log("additional: ", additionalRow, additionalCol);
                      // console.log("origin: ", origin);

                      for (let pixelRow = 0; pixelRow < newScaleY + additionalRow; pixelRow++){

                        for (let pixelCol = 0; pixelCol < newScaleX + additionalCol; pixelCol++){

                          const pixelIndex = origin + pixelRow * width * 4 + pixelCol * 4;

                          // console.log(current, pixelIndex);

                          newImage.data[pixelIndex] = red;
                          newImage.data[pixelIndex+1] = green;
                          newImage.data[pixelIndex+2] = blue;
                          newImage.data[pixelIndex+3] = 255;
                        }

                      }

                    }

                  }
               
                  // imageSize = size;         
                  // scale = newScale;      
                  // startX = (canvas.width - size)/2;
                  // startY = (canvas.height - size)/2

                  // console.log(colInterpolation);
                  imageWidth = width;
                  imageHeight = height;
                  scaleX = newScaleX;
                  scaleY = newScaleY;
                  errorScaleX = newErrorScaleX;
                  errorScaleY = newErrorScaleY;

                  context.clearRect(0,0, canvas.width, canvas.height);
                  // context.putImageData(newImage, 0, 0);
                  // context.putImageData(colInterpolation, 0, 0);

                  canvas.width = width;
                  canvas.height = height;

                  setResolution(newResolution);        
                  setPosition([(graphicWidth - imageWidth) / 2 + panelWidth, (graphicHeight - imageHeight) / 2]);       

                  context.putImageData(newImage, 0, 0);
                  // context.putImageData(colInterpolation, 0, 0);
                  // console.log(newImage, startX, startY, scale, imageSize);
   

                }


              }}>run</button>
              <button className='control'>reset</button>

            </div>

          </div>

          <div className='controls'>

            <button className="control" onClick={()=>{

              const canvas = document.getElementById("visual");
              const context = canvas.getContext("2d", {

                // alpha: false,
                willReadFrequently: true,
              });

              context.clearRect(0,0, canvas.width, canvas.height);

              // const panel = document.getElementById("panel");
              // graphicWidth = window.innerWidth - panel.clientWidth;
              // graphicHeight = window.innerHeight
              // panelWidth = panel.clientWidth;

              let length;

              if (graphicWidth > graphicHeight){

                length = graphicHeight;
              }
              else{

                length = graphicWidth;
              }

              // const round = resolution[0] * Math.round(length * 0.6 / resolution[0]);

              // const size = resolution[0] * Math.round(length * 0.6 / resolution[0]);
              const size = Math.floor(length * 0.6);

              // let size;

              // if (Math.abs(round - length * 0.6) < 100){

              //   console.log("pass!", round, length * 0.6);

              //   size = round;
              // }
              // else{

              //   console.log("just truncate that crap");

              //   size = resolution[0];
              // }

              canvas.width = size;
              canvas.height = size;

              // imageSize = size;
              imageWidth = size;
              imageHeight = imageWidth;
              const imageData = context.createImageData(imageWidth, imageHeight);

              scaleX = Math.floor(size / resolution[1]); // note, i keep calling row "x", even though in a grid its almost certainly y, oops.
              scaleY = Math.floor(scaleX); // its a square
              // console.log(scale, size, resolution);

              // console.log(((imageData.data.length-1) / (size*4)) / size);
              // console.log(((size*4-1) % size*4) / (size*4));


              // console.log("scale:", scale);

              // ratio between the error and the rounded size to evenly distribute pixels for the proper dimensions
              errorScaleX = (size - scaleY * resolution[0]) / (scaleY * resolution[0]); // usually there would be a remainder for scaling on rows and cols but this is a square
              errorScaleY = errorScaleX;
              let errorY = 0; // whenever the error is >= 1 there should be an additional pixel included to compensate for error of flooring scale (fractional pixels dont exist)

              // let offsetX = 0; // have to offset so the added additional pixels arent overwritten
              // let offsetY = 0;

              console.log(size, scaleX, scaleY, errorScaleX)

              console.log(errorScaleX * scaleY * resolution[0], errorScaleX * scaleY);

              // subtracted by imageWidth * 4 * scaleY since scaleY is floored since the actual scale probably isnt an integer, so if it goes again itll go out of bounds

              // for (let row = 0; row < imageWidth - scaleY; row += scaleY){
              for (let row = 0; row < imageWidth * 4 * imageHeight - imageWidth * 4 * scaleY; row += imageWidth * 4 * scaleY){

                // console.log("row");

                let errorX = 0; // its set to 0 due to rounding errors with errorScale
                let additionalY = 0;
                errorY += errorScaleY * scaleY;

                // rounding errors make it off by a bit sometimes
                while (errorY > 0.9999999999){

                  // console.log("here!!!! but for row");

                  additionalY++;
                  errorY -= 1;
                  // row++;  only add afterwards!
                }  

                // console.log(errorX);

                // subtracted by scaleY * 4 since scaleY is floored since the actual scale probably isnt an integer, so if it goes again itll go out of bounds
                for (let col = 0; col < imageWidth*4 - scaleX * 4; col += (4 * scaleX)){

                  // console.log("col");

                  let additionalX = 0;
                  errorX += errorScaleX * scaleX;

                  while (errorX > 0.9999999999){

                    // console.log("here!!!! but for col");
                    additionalX++;
                    errorX -= 1;
                  }

                  for (let colIndex = col; colIndex < (col + (4 * (scaleX + additionalX) )); colIndex += 4){

                    // while (errorX >= 1){

                    //   // console.log("here!!!!");

                    //   additionalX++;
                    //   errorX -= 1;
                    // }

                    for (let rowIndex = row; rowIndex < row + imageWidth * (scaleY + additionalY) * 4; rowIndex+= imageWidth * 4){

                    // note:
                      // size is being subtracted by scale because the outer for loops never go to size since scale isnt a factor of size-1, (you wouldnt want to go to size, thats out of bounds, and scale is floored)
                      // instead these 2 inner loops fill in the gaps to scale it up, so for the %, scale is removed
                      // additional x and y are also removed since it isnt added until after this loop ends

                      imageData.data[colIndex + (rowIndex)] =  col / ((size - scaleY - additionalX)*4) * 255;        // r, % of the column of the row
                      imageData.data[colIndex+1 + (rowIndex)] = (row / ((size - scaleX - additionalY) * imageWidth * 4)) * 255;           // g, % of the row of the total rows
                      imageData.data[colIndex+2 + (rowIndex)] = (1 - col / ((size - scaleY - additionalX)*4)) * 255; // b, inverse % of the column of the row
                      imageData.data[colIndex+3 + (rowIndex)] = 255;

                      // imageData.data[colIndex + (imageWidth*4 * rowIndex)] =  col / ((size - scaleY)*4) * 255;        // r, % of the column of the row
                      // imageData.data[colIndex+1 + (imageWidth*4 * rowIndex)] = (row / (size - scaleX)) * 255;           // g, % of the row of the total rows
                      // imageData.data[colIndex+2 + (imageWidth*4 * rowIndex)] = (1 - col / ((size - scaleY)*4)) * 255; // b, inverse % of the column of the row
                      // imageData.data[colIndex+3 + (imageWidth*4 * rowIndex)] = 255;

                      // error += remainderScale;
                    }

                  }
                  
                  col += 4 * additionalX;

                  
                }

                row += imageWidth * 4 * additionalY;

              }

              // console.log(imageData.data[imageSize*4 - 4], imageData.data[imageSize*4 - 3], imageData.data[imageSize*4 - 2], imageData.data[imageSize*4 - 1]);

              // console.log(imageData.data[size * 4 * (size-1)]);
              // console.log(imageData.data);

              const startX = (graphicWidth - size)/2;
              const startY = (graphicHeight - size)/2

              // console.log(length, round, size);
              console.log(imageData);
              console.log(length, size);

              console.log(imageData.data[(imageWidth-1) * 4], imageData.data[(imageWidth-1) * 4 + 1], imageData.data[(imageWidth-1) * 4 + 2]);
              console.log(imageData.data[(imageWidth-1) * (imageHeight-1) * 4], imageData.data[(imageWidth-1) * 4 * (imageHeight-1) + 1], imageData.data[(imageWidth-1) * 4 * (imageHeight-1) + 2]);


              // canvas.width = size;
              // canvas.height = size;

              // console.log(canvas.width);
              // console.log(canvas.clientWidth)

              

              // canvas.width = 100;

              context.putImageData(imageData, 0, 0);
              setPosition([startX + panelWidth, startY]);

            }}>generate</button>
          </div>

          <p style={{"width" : "100%", "textAlign" : "center"}}>{resolution[0]}x{resolution[1]}</p>

          <p style={{"textAlign" : "center"}}>resolution</p>

          <input id="resolutionSlider" type="range" min="10" max="150" step="10" defaultValue="10" onInput={(event)=>{

            const value = Number(event.target.value);
            setResolution([value, value]);
          }}></input>

          <input id="upload" type="file" accept="image/*" style={{"opacity" : 0, "pointerEvents" : "none"}} onChange={(event)=>{

            const canvas = document.getElementById("visual");
            const context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);

            const file = event.target.files[0];
            console.log(event.target.files, file);

            const image = new Image();
            image.src = URL.createObjectURL(file);
            image.onload = ()=>{

              imageWidth = image.width;
              imageHeight = image.height;
              scaleX = 1;
              scaleY = 1;
              errorScaleX = 0;
              errorScaleY = 0;

              setResolution([imageWidth, imageHeight]);

              canvas.width = imageWidth;
              canvas.height = imageHeight;
              context.drawImage(image, 0,0);

              setPosition([(graphicWidth - imageWidth) / 2 + panelWidth, (graphicHeight - imageHeight) / 2]);

            }
          }}></input>          

          <a id="download"></a>

          <div className='controls'>

            <button className='control' onClick={()=>{

              const upload = document.getElementById("upload");
              upload.click();      
              
              

            }}>upload</button>

            <button className='control' onClick={()=>{

              const download = document.getElementById("download");
              const canvas = document.getElementById("visual");
              download.download = "image.png";
              download.href = canvas.toDataURL();
              download.click();

            }}>download</button>


          </div>

        </div>        


      </div>

      <div id="information" style={{visibility : infoVisibility}}>

          <button id="exitInformation" onClick={()=>{

            setInfoVisibility("hidden");

          }}>x</button>


          <h1>{algorithm}</h1>

          <pre>

            <code>
              {description}
            </code>

          </pre>

      </div>

      {/* <div id="graphic"> */}
      {/* okay so you wont believe this, actually maybe you will
      putting a canvas in a flexbox sucks or at least i just cant manage it
      
      first it expands like crazy, like 50% bigger than the container its in for some reason due to the minimum size
      of flex box elements so you can fix that by setting the min-width and height to 0 or just hiding overflow
      
      second for some reason it always tries to fit its container even if i set its flex-grow to 0 or flex to none (which brings back the issue of the crazy expansion
      
      so im just going to center it manually using absolute position
      
      */}

        <canvas id="visual" style={{"left" : position[0], "top" : position[1]}}>


        </canvas>

      {/* </div> */}

    </>
  )
}

export default App
