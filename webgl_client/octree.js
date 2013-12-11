/*global vec3*/

/*
  Javascript Octree implementation
*/
function drawNodeAABB( highCorner, lowCorner, positions, indices, aabb_num ) {
    positions.push(
        // z-bottom
        lowCorner.x, lowCorner.y, lowCorner.z,
        lowCorner.x, highCorner.y, lowCorner.z,
        highCorner.x, highCorner.y, lowCorner.z,
        highCorner.x, lowCorner.y, lowCorner.z,
        // z-top
        lowCorner.x, lowCorner.y, highCorner.z,
        lowCorner.x, highCorner.y, highCorner.z,
        highCorner.x, highCorner.y, highCorner.z,
        highCorner.x, lowCorner.y, highCorner.z
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
}

function drawFront( front, positions, indices ) {
    var aabb;
    var highCorner;
    var lowCorner;
    for( var i=0; i<front.length; i++ ) {
        drawNodeAABB( front[i].highCorner, front[i].lowCorner, positions, indices, i );
    }         
}

function AABB( highCorner, lowCorner ) {
    /* TODO: figure outthe right way to do this
    if ( !(lowCorner instanceof vec3) || !(highCorner instanceof vec3) ) {
      console.log( "Low Corner or High Corner not vec3" );
    }
    */
    this.lowCorner = lowCorner;
    this.highCorner = highCorner;
    var aabbDiagonal = vec3.create();
    this.centroid = vec3.create();

    // Compute centroid given low and high corners
    vec3.subtract( this.highCorner, this.lowCorner, aabbDiagonal );
    vec3.scale( aabbDiagonal, 0.5 );
    vec3.add( this.lowCorner, aabbDiagonal, this.centroid );
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

function OctreeNode( boundingBox, id ) {
    /* TODO
    if ( !(boundingBox instanceof AABB) ) {
      alert( "boundingBox not instance of AABB" );
    }
    */
    this.id = id;
    this.aabb = boundingBox;
    this.position = this.aabb.centroid;
    // Some space for data points 
    this.data = new Array();
    // Initialize all children to null
    this.children = new Array();
    for ( var i=0; i<8; i++ ) {
      this.children.push( null );
    }
}

// Get parent id requires function:
//   (idx - ((idx-1)%8)-1)/8
//   in javascript Math.floor((idx - ((idx-1)%8)-1)/8)
/*
OctreeNode.prototype.getParentId = function(){
    return 
*/

OctreeNode.prototype.getChildIdAt = function(i){
    return 8*this.id + (i+1);
}

OctreeNode.prototype.getChildrenIds = function(){
    var child_ids = Array();
    for( var i=0; i<8; i++ ){
        child_ids.push( this.getChildIdAt(i) );
    }
    return child_ids;
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
    var node;
    var halfDiagonal = vec3.create();
    var centroid = this.position;
    var highCorner = this.aabb.highCorner;
    vec3.subtract( highCorner, centroid, halfDiagonal );
    switch(i){
        //Octant # | x y z
        //octant 0 | + + +
        case 0:
            console.log( "adding child 0" );
            var child_aabb = new AABB( highCorner,centroid );
            var child_id = this.getChildIdAt(0);
            node = new OctreeNode( child_aabb, child_id );
            this.children[0] = node
            break;
        //octant 1 | - + + 
        case 1:
            console.log( "adding child 1" );
            var child_aabb = new AABB( vec3.create([highCorner[0]-halfDiagonal[0],highCorner[1],highCorner[2]]), vec3.create([centroid[0]-halfDiagonal[0],centroid[1],centroid[2]]) );
            var child_id = this.getChildIdAt(1);
            node = new OctreeNode( child_aabb, child_id );
            this.children[1] = node;
            break;
        //octant 2 | - - + 
        case 2:
            console.log( "adding child 2" );
            var child_aabb = new AABB( vec3.create([highCorner[0]-halfDiagonal[0],highCorner[1]-halfDiagonal[1],highCorner[2]]), vec3.create([centroid[0]-halfDiagonal[0],centroid[1]-halfDiagonal[1],centroid[2]]) );
            var child_id = this.getChildIdAt(2);
            node = new OctreeNode( child_aabb, child_id );
            this.children[2] = node;
            break;
        case 3:
            console.log( "adding child 3" );
            var child_aabb = new AABB( vec3.create([highCorner[0],highCorner[1]-halfDiagonal[1],highCorner[2]]), vec3.create([centroid[0],centroid[1]-halfDiagonal[1],centroid[2]]) );
            var child_id = this.getChildIdAt(3);
            node = new OctreeNode( child_aabb, child_id );
            this.children[3] = node;
            break;
        case 4:
            console.log( "adding child 4" );
            var child_aabb = new AABB( vec3.create([highCorner[0],highCorner[1],highCorner[2]-halfDiagonal[2]]), vec3.create([centroid[0],centroid[1],centroid[2]-halfDiagonal[2]]) );
            var child_id = this.getChildIdAt(4);
            node = new OctreeNode( child_aabb, child_id );
            this.children[4] = node;
            break;
        case 5:
            console.log( "adding child 5" );
            var child_aabb = new AABB( vec3.create([highCorner[0]-halfDiagonal[0],highCorner[1],highCorner[2]-halfDiagonal[2]]), vec3.create([centroid[0]-halfDiagonal[0],centroid[1],centroid[2]-halfDiagonal[2]]) );
            var child_id = this.getChildIdAt(5);
            node = new OctreeNode( child_aabb, child_id );
            this.children[5] = node;
            break;
        case 6:
            console.log( "adding child 6" );
            var child_aabb = new AABB( vec3.create([highCorner[0]-halfDiagonal[0],highCorner[1]-halfDiagonal[1],highCorner[2]-halfDiagonal[2]]), vec3.create([centroid[0]-halfDiagonal[0],centroid[1]-halfDiagonal[1],centroid[2]-halfDiagonal[2]]) );
            var child_id = this.getChildIdAt(6);
            node = new OctreeNode( child_aabb, child_id );
            this.children[6] = node;
            break;
        case 7:
            console.log( "adding child 7" );
            var child_aabb = new AABB( vec3.create([highCorner[0],highCorner[1]-halfDiagonal[1],highCorner[2]-halfDiagonal[2]]), vec3.create([centroid[0],centroid[1]-halfDiagonal[1],centroid[2]-halfDiagonal[2]]) );
            var child_id = this.getChildIdAt(7);
            node = new OctreeNode( child_aabb, child_id );
            this.children[7] = node;
            break;
        default:
            console.err( "error, how did we get here?" );
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



