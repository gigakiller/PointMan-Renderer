/*global vec3*/

/*
  Javascript Octree implementation
*/

function AABB( lowCorner, highCorner ) {
  /* TODO: figure outthe right way to do this
  if ( !(lowCorner instanceof vec3) || !(highCorner instanceof vec3) ) {
    console.log( "Low Corner or High Corner not vec3" );
  }
  */
  this.lowCorner = lowCorner;
  this.highCorner = highCorner;
  var aabbDiagonal = this.highCorner - this.lowCorner;
  this.centroid = lowCorner + 0.5*aabbDiagonal;
}

AABB.prototype.draw = function( positions, indices, aabb_num ) {
    positions.push(
        // z-bottom
        this.lowCorner[0], this.lowCorner[1], this.lowCorner[2],
        this.lowCorner[0], this.highCorner[1], this.lowCorner[2],
        this.highCorner[0], this.highCorner[1], this.lowCorner[2],
        this.highCorner[0], this.lowCorner[1], this.lowCorner[2],
        // z-top
        this.lowCorner[0], this.lowCorner[1], this.highCorner[2],
        this.lowCorner[0], this.highCorner[1], this.highCorner[2],
        this.highCorner[0], this.highCorner[1], this.highCorner[2],
        this.highCorner[0], this.lowCorner[1], this.highCorner[2]
    );
    indices.push(
        // z-bottom
        0+8*aabb_num,1+8*aabb_num,
        0+8*aabb_num,3+8*aabb_num,
        1+8*aabb_num,2+8*aabb_num,
        2+8*aabb_num,3+8*aabb_num,
        // z-top
        4+8*aabb_num,5+8*aabb_num,
        4+8*aabb_num,7+8*aabb_num,
        5+8*aabb_num,6+8*aabb_num,
        6+8*aabb_num,7+8*aabb_num,
        // x-left
        0+8*aabb_num,4+8*aabb_num,
        0+8*aabb_num,1+8*aabb_num,
        4+8*aabb_num,5+8*aabb_num,
        5+8*aabb_num,1+8*aabb_num,
        // x-right
        3+8*aabb_num,7+8*aabb_num,
        3+8*aabb_num,2+8*aabb_num,
        7+8*aabb_num,6+8*aabb_num,
        6+8*aabb_num,2+8*aabb_num
    );
};

function OctreeNode( boundingBox ) {
    /* TODO
    if ( !(boundingBox instanceof AABB) ) {
      alert( "boundingBox not instance of AABB" );
    }
    */
    this.aabb = boundingBox;
    this.position = this.aabb.centroid;
    // Initialize all children to null
    this.children = new Array();
    for ( var i=0; i<7; i++ ) {
      this.children.push( null );
    }
}

OctreeNode.prototype.getChildAt = function(i){
    if ( i < 0 || i > 7 ) {
        alert( "Accessing OctreeNode at invalid index: " + str(i) );
        return;
    }
    return this.children[i];
};

OctreeNode.prototype.createChildAt = function(i){
    if ( i < 0 || i > 7 ) {
        alert( "Accessing OctreeNode at invalid index: " + str(i) );
        return;
    }
    // Check if this node already has a child
    if ( this.children[i] != null ) {
        console.err( "Node already has a child at index" + str(i) );
        return;
    }
    // Depending on index spawn correct child ... note, doing this instead of having the
    // host send the exact lowCorner / highCorner might lead to some server client octree divergence
    var lowCorner = this.position;
    var highCorner = this.aabb.highCorner;
    switch(i){
        //Octant # | x y z
        //octant 0 | + + +
        case 0:
            console.log( "adding child 0" );
            var child_aabb = new AABB( lowCorner, highCorner );
            this.children[0] = new OctreeNode( child_aabb );
            break;
        //octant 1 | - + + 
        case 1:
            console.log( "adding child 1" );
            var child_aabb = new AABB( lowCorner-vec3.create(this.centroid.x,0.0,0.0), highCorner-vec3.create(this.centroid.x,0.0,0.0) );
            this.children[0] = new OctreeNode( child_aabb );
            break;
        //octant 2 | - - + 
        case 2:
            console.log( "adding child 2" );
            var child_aabb = new AABB( lowCorner, highCorner );
            this.children[0] = new OctreeNode( child_aabb );
            break;
        case 3:
            console.log( "adding child 3" );
            var child_aabb = new AABB( lowCorner, highCorner );
            this.children[0] = new OctreeNode( child_aabb );
            break;
        case 4:
            console.log( "adding child 4" );
            var child_aabb = new AABB( lowCorner, highCorner );
            this.children[0] = new OctreeNode( child_aabb );
            break;
        case 5:
            console.log( "adding child 5" );
            var child_aabb = new AABB( lowCorner, highCorner );
            this.children[0] = new OctreeNode( child_aabb );
            break;
        case 6:
            console.log( "adding child 6" );
            var child_aabb = new AABB( lowCorner, highCorner );
            this.children[0] = new OctreeNode( child_aabb );
            break;
        case 7:
            console.log( "adding child 7" );
            var child_aabb = new AABB( lowCorner, highCorner );
            this.children[0] = new OctreeNode( child_aabb );
            break;
    }
};
/*
  This octree is special in that it holds nodes in the following 
  order:
    [ n0 nc0 nc1 nc2 nc3 nc4 nc5 nc6 nc7 nc0c1 nc0c2 ... ]
*/
function Octree( root ) {
  this.root = root
}

/*
  Little class for drawing octrees
*/
function OctreeDrawer( octree, context ) { 
    this.octree = octree;
    this.context = context;
    /*
    this.positionsName = positionsName;
    this.indicesName = indicesName;
    */
    this.positions = [];
    this.indices = [];
}

/* 
    Walk down octree, drawing as we go
*/
OctreeDrawer.prototype.drawRecursive = function( node ){
    // If node is null then return
    if ( node == null )
        return;
    node.aabb.draw( this.positions, this.indices, this.draw_num );
    this.draw_num += 1;
    for( var i=0; i<8; i++ ){
        var currChild = node.getChildAt(i);
        this.drawRecursive( currChild );
    }
};

/*
   Trigger draw recursion
*/
OctreeDrawer.prototype.draw = function(){
    this.draw_num = 0;
    this.drawRecursive( this.octree.root );
};

/*
    uploadMesh, copied from aabb.js
*/
OctreeDrawer.prototype.uploadMesh = function(){
    //var positionsName = context.createBuffer();
    this.context.bindBuffer(this.context.ARRAY_BUFFER, positionsName);
    this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(positions), this.context.STATIC_DRAW);
    this.context.vertexAttribPointer(positionLocation, 3, this.context.FLOAT, false, 0, 0);
    this.context.enableVertexAttribArray(positionLocation);

    // Indices
    //var indicesName = this.context.createBuffer();
    this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, indicesName);
    this.context.bufferData(this.context.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.context.STATIC_DRAW);
};



