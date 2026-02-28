// the interpolation algorithms dont have a designated function dedicated to them since its mostly just going through the pixels
// looking around it, then interpolating, and making a function just for that would be a hassle, so below lies all of the code related
// these include a bunch of various variables for the image, drawing it, a bunch of error correction to get the right pixel on the canvas since i scale the pixels manually, 
// since i couldnt get the canvas scaling to work though i thought it would do the same thing

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

const colInterpolation = context.createImageData(width, imageHeight);
const newImage = context.createImageData(width, height);

// two passes, first it interpolates all of the columns in each row, then it interpolates the rows in each column
// otherwise i would have to interpolate in a 4x4 grid for every single pixel in order to get f(0) f(1)
// and f'(0) f'(1) to solve for the unknowns where to find the derivative i just get the slope of the adjacent points

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

		// by dividing the new row or col by the scale it gets the approximate row or col in the original image, 
		// the decimals place (it wont be an integer unless its right on the start of a row or col) 
		// can be used to determine proximity from row to row or col to col
		
		const actualCol = col / scaleFactor;

		const colAlpha = actualCol - Math.floor(actualCol); // alpha is where to interpolate between 2 values

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

		let a, b, c, d; // ax^3 + bx^2 + cx + d

		d = image.data[x2]; 
		c = (image.data[x3] - image.data[x1]) / 2;
		a = (image.data[x4] - image.data[x2]) / 2 - 2 * image.data[x3] + c + 2 * d;
		b = 3 * image.data[x3] - (image.data[x4] - image.data[x2]) / 2 - 2 * c - 3 * d;

		const red = a * Math.pow(colAlpha, 3) + b * Math.pow(colAlpha, 2) + c * colAlpha + d;

		d = image.data[x2 + 1];
		c = (image.data[x3 + 1] - image.data[x1 + 1]) / 2;
		a = (image.data[x4 + 1] - image.data[x2 + 1]) / 2 - 2 * image.data[x3 + 1] + c + 2 * d;
		b = 3 * image.data[x3 + 1] - (image.data[x4 + 1] - image.data[x2 + 1]) / 2 - 2 * c - 3 * d;

		const green = a * Math.pow(colAlpha, 3) + b * Math.pow(colAlpha, 2) + c * colAlpha + d;

		d = image.data[x2 + 2];
		c = (image.data[x3 + 2] - image.data[x1 + 2]) / 2;
		a = (image.data[x4 + 2] - image.data[x2 + 2]) / 2 - 2 * image.data[x3 + 2] + c + 2 * d;
		b = 3 * image.data[x3 + 2] - (image.data[x4 + 2] - image.data[x2 + 2]) / 2 - 2 * c - 3 * d;

		const blue = a * Math.pow(colAlpha, 3) + b * Math.pow(colAlpha, 2) + c * colAlpha + d;

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

		const origin = row * 4 * width * scaleY + rowOffset * 4 * width + col * 4 * newScaleX + newColOffset * 4;

		colInterpolation.data[origin] = red;
		colInterpolation.data[origin+1] = green;
		colInterpolation.data[origin+2] = blue;

		// the below code would fill out all of the pixels accordingly for pixel scale, but only 1 pixel is really needed to interpolate

		// const additionalRow = currentErrorY - rowOffset;
		// const additionalCol = currentErrorX - newColOffset;

		// for (let pixelRow = 0; pixelRow < scaleY + additionalRow; pixelRow++){

		// 	for (let pixelCol = 0; pixelCol < newScaleX + additionalCol; pixelCol++){

		// 		const pixelIndex = origin + pixelRow * width * 4 + pixelCol * 4;

		// 		colInterpolation.data[pixelIndex] = red;
		// 		colInterpolation.data[pixelIndex+1] = green;
		// 		colInterpolation.data[pixelIndex+2] = blue;
		// 		colInterpolation.data[pixelIndex+3] = 255;
		// 	}
		// }

	}

}

// interpolate using both interpolations
image = colInterpolation; 

for (let row = 0; row < newResolution[1]; row++){

	for (let col = 0; col < newResolution[0]; col++){

		// f(0) = d f(1) = a + b + c + d
		// f'(0) = c f'(1) = 3a + 2b + c

		// a = f'(1) - 2f(1) + f'(0) + 2f(0) : 3a + 2b + c - (2a + 2b + 2c + 2d) + c + 2d
		// b = 3f(1) - f'(1) - 2f'(0) - 3f(0) : 3a + 3b + 3c + 3d - (3a + 2b + c) - 2c - 3d
		// c = f'(0)
		// d = f(0)

		const actualRow = row / scaleFactor;

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

		let a,b,c,d;

		d = image.data[x2]; 
		c = (image.data[x3] - image.data[x1]) / 2;
		a = (image.data[x4] - image.data[x2]) / 2 - 2 * image.data[x3] + c + 2 * d;
		b = 3 * image.data[x3] - (image.data[x4] - image.data[x2]) / 2 - 2 * c - 3 * d;

		const red = a * Math.pow(rowAlpha, 3) + b * Math.pow(rowAlpha, 2) + c * rowAlpha + d; 

		d = image.data[x2 + 1]; 
		c = (image.data[x3 + 1] - image.data[x1 + 1]) / 2;
		a = (image.data[x4 + 1] - image.data[x2 + 1]) / 2 - 2 * image.data[x3 + 1] + c + 2 * d;
		b = 3 * image.data[x3 + 1] - (image.data[x4 + 1] - image.data[x2 + 1]) / 2 - 2 * c - 3 * d;

		const green = a * Math.pow(rowAlpha, 3) + b * Math.pow(rowAlpha, 2) + c * rowAlpha + d;  
	
		d = image.data[x2 + 2]; 
		c = (image.data[x3 + 2] - image.data[x1 + 2]) / 2;
		a = (image.data[x4 + 2] - image.data[x2 + 2]) / 2 - 2 * image.data[x3 + 2] + c + 2 * d;
		b = 3 * image.data[x3 + 2] - (image.data[x4 + 2] - image.data[x2 + 2]) / 2 - 2 * c - 3 * d;

		const blue = a * Math.pow(rowAlpha, 3) + b * Math.pow(rowAlpha, 2) + c * rowAlpha + d;  

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

		for (let pixelRow = 0; pixelRow < newScaleY + additionalRow; pixelRow++){

			for (let pixelCol = 0; pixelCol < newScaleX + additionalCol; pixelCol++){

				const pixelIndex = origin + pixelRow * width * 4 + pixelCol * 4;

				newImage.data[pixelIndex] = red;
				newImage.data[pixelIndex+1] = green;
				newImage.data[pixelIndex+2] = blue;
				newImage.data[pixelIndex+3] = 255;
			}

		}

	}

}

imageWidth = width;
imageHeight = height;
scaleX = newScaleX;
scaleY = newScaleY;
errorScaleX = newErrorScaleX;
errorScaleY = newErrorScaleY;

context.clearRect(0,0, canvas.width, canvas.height);

canvas.width = width;
canvas.height = height;

setResolution(newResolution);        
setPosition([(graphicWidth - imageWidth) / 2 + panelWidth, (graphicHeight - imageHeight) / 2]);       

context.putImageData(newImage, 0, 0);