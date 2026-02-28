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

    let index = 0;

    let mask = 0x80; // 0x80 in hexadecimal refers to 10000000 or 128 in decimal, this is notable 
                     // since it corresponds with the colors bit representation which is in 8 bits
                     // this mask is used to check every bit of the rgb color for whether or not its present                 


    this.nodes[0] = {red : 0, green : 0, blue : 0, pixels : 0};

    for (let level = 0; level < this.maxDepth; level++){

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

      lastIndex = index;

    }

    let leafNode = this.leafNodes[index];

    if (leafNode){

      leafNode.red += color.red;
      leafNode.green += color.green;
      leafNode.blue += color.blue;
      leafNode.pixels++; // to get the average of all of the pixels that intersect here
    }
    else{

        this.leafNodes[index] = {red : color.red, green : color.green, blue : color.blue, pixels : 1};

    }
  }

  reduce(colors){

    // get parents of leafnodes, get rid of the children of the parent until its reduced to colors, add the parent to leaf nodes, repeat

    let stop = false;

    while (Object.keys(this.leafNodes).length > colors){

      let newLeaves = {};
      let leavesRemaining = Object.keys(this.leafNodes).length;
      
      for (const key of Object.keys(this.leafNodes)){

        const leafNode = this.leafNodes[key];

        if (leafNode == undefined){

          continue;
        }

        if (stop){

          // successfully reduced, add the rest of the leaf nodes on and save it after the loop

          newLeaves[key] = leafNode;
          continue;
        }

        let parent = (key - (key % 8)) / 8;
        let parentValue = {red : 0, green : 0, blue : 0, pixels : 0};

        for (let child = 0; child < 8; child++){

          if (this.leafNodes[parent * 8 + child]){

            parentValue.red += this.leafNodes[parent * 8 + child].red;
            parentValue.green += this.leafNodes[parent * 8 + child].green;
            parentValue.blue += this.leafNodes[parent * 8 + child].blue;
            parentValue.pixels += this.leafNodes[parent * 8 + child].pixels;

            this.leafNodes[parent * 8 + child] = undefined; // using delete instead screws up the loop some how

            if (Object.keys(newLeaves).length + leavesRemaining <= colors){
              
              // successfully reduced

              stop = true;
              break;
            }

            leavesRemaining--;

          }
        }

        newLeaves[parent] = parentValue;
      }

      this.leafNodes = newLeaves;

    }

  }

  getColor(color){

    // basically same as insert, except its just getting to the leaf node and returning its average

    let index = 0;

    let mask = 0x80; // 0x80 in hexadecimal refers to 10000000 or 128 in decimal, this is notable 
                     // since it corresponds with the colors bit representation which is in 8 bits
                     // this mask is used to check every bit of the rgb color for whether or not its present  


    let result;

    for (let level = 0; level < this.maxDepth; level++){

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

      if (result && this.leafNodes[index]){

        return {red : this.leafNodes[index].red, green : this.leafNodes[index].green, blue : this.leafNodes[index].blue, pixels : this.leafNodes[index].pixels};
      }

      else if (result){

        return {red : result.red, green : result.green, blue : result.blue, pixels : result.pixels};
      }

      else if (this.leafNodes[index]){

        result = this.leafNodes[index];
        // all of a parents children dont have to be cleared to reach the color count specified, so it would stop early if it stopped at the parent
      }

      mask = mask >> 1; // look at the next column

    }

    if (result == undefined){
      // case where a color was reduced to the 0th index (wont match with anything)

      return {red : this.leafNodes[0].red, green : this.leafNodes[0].green, blue : this.leafNodes[0].blue, pixels : this.leafNodes[0].pixels}
    }

    return {red : result.red, green : result.green, blue : result.blue, pixels : result.pixels};
  }

}
