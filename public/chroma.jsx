// colors is a 4x2 array
function chroma(colors, secondRow=true){

  // NOTE
  // i cant find a source that states how to apply luma to chroma (if you just multiply rgb by luma it just gets darker,
  //  which isnt exactly a feature of chroma subsampling). instead im converting rgb to hsl to apply luma in light then 
  // converting it back to draw it on the canvas.

  // this also means i dont actually use luma, i use light as calculated for the conversion of rgb to hsl
  // due to the fact that 

  function rgbToHsl(color){

    // implementation from https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion

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

  // linearize the colors and get the luminacity and then based off the format get the chroma values

  let luma = [];

  for (let row = 0; row < colors.length; row++){

    let currentRow = [];

    for (let col = 0; col < colors[0].length; col++){

      const color = colors[row][col];
      currentRow.push(color.red * 0.2126 + color.green * 0.7152 + color.blue * 0.0722);
    }

    luma.push(currentRow);
  }

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