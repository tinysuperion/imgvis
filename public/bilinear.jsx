// the interpolation algorithms dont have a designated function dedicated to them since its mostly just going through the pixels
// looking around it, then interpolating, and making a function just for that would be a hassle, so below lies all of the code related
// these include a bunch of various variables for the image, drawing it, a bunch of error correction to get the right pixel on the canvas since i scale the pixels manually, 
// since i couldnt get the canvas scaling to work though i thought it would do the same thing

// gets offsets for retrieving pixels accurately, mainly only a function due to rounding errors
function getOffset(errorScale, position){

	let error = errorScale * position;

	if (Math.abs(Math.round(error) - error) < 0.0000000001){

		error = Math.round(error);
	}

	return Math.floor(error); // amount of complete pixels to offset by

}

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