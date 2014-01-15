/* exported drawOctreeGreen, drawOctreeFront, drawFront, Octree */
var vec4, vec3, mat4, str, positionsName, indicesName, positions, positionLocation, indices;
/*
  Javascript Octree implementation and other such utility functions
*/

/*
  Basic algorithm:
    * Note: I think we need to do a frustrum cull first
    * Transform octree AABB centroid into view space, pre-persperpective
    * Use (highCorner-lowCorner)/2 as the sphere radius
    * Then use algebraic sphere sse computation as per:
      * http://www.clownfrogfish.com/2012/09/14/on-the-perspective-projection-of-a-sphere/  
      * http://article.gmane.org/gmane.games.devel.algorithms/21697
      * https://github.com/farbrausch/fr_public/blob/master/werkkzeug3/engine.cpp#L4265
*/
function calcFrontScreenSpaceError( front, screen_space_error, Model, View, Persp ) {
    "use strict";
    // TODO: ....
    // Model,View, Model is identity
    //var mv = mat4.create();
    //mat4.multiply(View, Model, mv); //is the correct order? it matches what we have elsewhere...

    for ( var i=0; i<front.length; i++ ) {
        //console.log(i);
        // Transform

        //"Centroid" refers to the vector from one corner of the AABB to the other!
        var halfVec = vec4.create();
        halfVec[0] = (front[i].highCorner.x - front[i].lowCorner.x)/2.0;
        halfVec[1] = (front[i].highCorner.y - front[i].lowCorner.y)/2.0;
        halfVec[2] = (front[i].highCorner.z - front[i].lowCorner.z)/2.0;
        halfVec[3] = 0.0;

        //mat4.multiply( View, halfVec, halfVec ); //transform the halfVec to camera space
        //var radius = vec4.length(halfVec)/2; //radius in camera space
        
        //I don't **think** we divide by 2 because we already do so above
        //var radius = vec4.length(halfVec); //radius in camera space
        //var maxErr;

        var centroid_pos = vec4.create();
        centroid_pos[0] = front[i].lowCorner.x + halfVec[0];
        centroid_pos[1] = front[i].lowCorner.y + halfVec[1];
        centroid_pos[2] = front[i].lowCorner.z + halfVec[2];
        centroid_pos[3] = 0; 

        //screen_space_error[i] = calcScreenSpaceError( halfVec, radius, Persp, View );
        //WARNING, BOLD ASSUMPTION: assume model is identity! 
        screen_space_error[i] = calcScreenSpaceError( centroid_pos, Persp, View );
    }
}

//For now I'm going to do something REALLY DUMB, and just use the Z-distance of the 
//projected centroid position
function calcScreenSpaceError( centroid_pos, Persp, modelview ) {
    "use strict";
    //var centroid_pos = Persp * modelveiw * centroid; 
    var fullTransform = mat4.create();   
    mat4.multiply(Persp, modelview, fullTransform);
    var centroid_ss = vec4.create(); 
    mat4.multiply(fullTransform, centroid_pos, centroid_ss);

    //var hv_length = vec4.length(centroid_ss); 
    var maxError;

    //console.log( centroid_ss[2] );
    //do a very simple z-cull: if the circle is behind us, don't draw it

    //floating point epsilon, which is there to prevent division by very small number
    //right now I'm just guessing the magnitude.
    var sse_epsilon = 0.0001; 

    if(centroid_ss[2] < sse_epsilon){ //assuming +z is INTO screen
        maxError = 0; //not on the screen, we don't need to draw
    } else {
        //maxError = Math.PI * hv_length * hv_length; //use the area of the "circle"    
        maxError = 1 / centroid_ss[2];
    }

    return maxError;
}
       
function drawNodeAABB( highCorner, lowCorner, positions, colors, indices, aabb_num ) {
    "use strict";
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
    var curr_color = [0.0, 1.0, 0.0];
    colors.push(
        curr_color[0], curr_color[1], curr_color[2],
        curr_color[0], curr_color[1], curr_color[2],
        curr_color[0], curr_color[1], curr_color[2],
        curr_color[0], curr_color[1], curr_color[2],
        curr_color[0], curr_color[1], curr_color[2],
        curr_color[0], curr_color[1], curr_color[2],
        curr_color[0], curr_color[1], curr_color[2],
        curr_color[0], curr_color[1], curr_color[2]
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

//function drawOctreeGreen( front, positions, indices ) {
    //"use strict";
    //for( var i=0; i<front.length; i++ ) {
        //drawNodeAABB( front[i].highCorner, front[i].lowCorner, positions, indices, i, 0 );
    //}         
//}

function drawOctreeFront( front, positions, colors, indices) {
    "use strict";
    //var ss_error = [];
    //calcFrontScreenSpaceError(front, ss_error, model, view, persp); 
    for( var i=0; i<front.length; i++ ) {
        //console.log("Drawing front at position: ".concat(i));
        drawNodeAABB( front[i].highCorner, front[i].lowCorner, positions, colors, indices, i);
    }         
}

function drawFront( curr_draw_lvl, positions, colors ){
    "use strict";
    //positions = [];
    //colors = [];
    var pointsCount = 0;
    for( var i=0; i<curr_draw_lvl.length; i++ ){
        if ( curr_draw_lvl[i].hasOwnProperty("points") ){
            var curr_draw_lvl_pts = curr_draw_lvl[i].points;
            for ( var j=0; j<curr_draw_lvl_pts.length; j++ ){
                positions.push( curr_draw_lvl_pts[j].x );
                positions.push( curr_draw_lvl_pts[j].y );
                positions.push( curr_draw_lvl_pts[j].z );
                colors.push( curr_draw_lvl_pts[j].r/255.0 );
                colors.push( curr_draw_lvl_pts[j].g/255.0 );
                colors.push( curr_draw_lvl_pts[j].b/255.0 );
                pointsCount += 1;
            }
        }
    }
    return pointsCount;
}

function AABB( highCorner, lowCorner ) {
    "use strict";
    /* TODO: figure outthe right way to do this
    if ( !(lowCorner instanceof vec3) || !(highCorner instanceof vec3) ) {
      console.log( "Low Corner or High Corner not vec3" );
    }
    */
    this.lowCorner = lowCorner;
    this.highCorner = highCorner;
    var aabbDiagonal = vec3.create();
    this.centroid = vec3.create();
    this.sse = 0; //screen space error

    // Compute centroid given low and high corners
    vec3.subtract( this.highCorner, this.lowCorner, aabbDiagonal );
    vec3.scale( aabbDiagonal, 0.5 );
    vec3.add( this.lowCorner, aabbDiagonal, this.centroid );
}

AABB.prototype.draw = function( positions, indices, aabb_num ) {
    "use strict";
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
    "use strict";
    /* TODO
    if ( !(boundingBox instanceof AABB) ) {
      alert( "boundingBox not instance of AABB" );
    }
    */
    this.id = id;
    this.aabb = boundingBox;
    this.position = this.aabb.centroid;
    // Some space for data points 
    this.data = [];
    // Initialize all children to null
    this.children = [];
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
    "use strict";
    return 8*this.id + (i+1);
};

OctreeNode.prototype.getChildrenIds = function(){
    "use strict";
    var child_ids = Array();
    for( var i=0; i<8; i++ ){
        child_ids.push( this.getChildIdAt(i) );
    }
    return child_ids;
};

OctreeNode.prototype.getChildAt = function(i){
    "use strict";
    if ( i < 0 || i > 7 ) {
        alert( "Accessing OctreeNode at invalid index: " + str(i) );
        return;
    }
    return this.children[i];
};

OctreeNode.prototype.createChildAt = function(i){
    "use strict";
    if ( i < 0 || i > 7 ) {
        alert( "Accessing OctreeNode at invalid index: " + str(i) );
        return;
    }
    // Check if this node already has a child
    if ( this.children[i] !== null ) {
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
            this.children[0] = node;
            break;
        //octant 1 | - + + 
        case 1:
            console.log( "adding child 1" );
            child_aabb = new AABB( vec3.create([highCorner[0]-halfDiagonal[0],highCorner[1],highCorner[2]]), vec3.create([centroid[0]-halfDiagonal[0],centroid[1],centroid[2]]) );
            child_id = this.getChildIdAt(1);
            node = new OctreeNode( child_aabb, child_id );
            this.children[1] = node;
            break;
        //octant 2 | - - + 
        case 2:
            console.log( "adding child 2" );
            child_aabb = new AABB( vec3.create([highCorner[0]-halfDiagonal[0],highCorner[1]-halfDiagonal[1],highCorner[2]]), vec3.create([centroid[0]-halfDiagonal[0],centroid[1]-halfDiagonal[1],centroid[2]]) );
            child_id = this.getChildIdAt(2);
            node = new OctreeNode( child_aabb, child_id );
            this.children[2] = node;
            break;
        case 3:
            console.log( "adding child 3" );
            child_aabb = new AABB( vec3.create([highCorner[0],highCorner[1]-halfDiagonal[1],highCorner[2]]), vec3.create([centroid[0],centroid[1]-halfDiagonal[1],centroid[2]]) );
            child_id = this.getChildIdAt(3);
            node = new OctreeNode( child_aabb, child_id );
            this.children[3] = node;
            break;
        case 4:
            console.log( "adding child 4" );
            child_aabb = new AABB( vec3.create([highCorner[0],highCorner[1],highCorner[2]-halfDiagonal[2]]), vec3.create([centroid[0],centroid[1],centroid[2]-halfDiagonal[2]]) );
            child_id = this.getChildIdAt(4);
            node = new OctreeNode( child_aabb, child_id );
            this.children[4] = node;
            break;
        case 5:
            console.log( "adding child 5" );
            child_aabb = new AABB( vec3.create([highCorner[0]-halfDiagonal[0],highCorner[1],highCorner[2]-halfDiagonal[2]]), vec3.create([centroid[0]-halfDiagonal[0],centroid[1],centroid[2]-halfDiagonal[2]]) );
            child_id = this.getChildIdAt(5);
            node = new OctreeNode( child_aabb, child_id );
            this.children[5] = node;
            break;
        case 6:
            console.log( "adding child 6" );
            child_aabb = new AABB( vec3.create([highCorner[0]-halfDiagonal[0],highCorner[1]-halfDiagonal[1],highCorner[2]-halfDiagonal[2]]), vec3.create([centroid[0]-halfDiagonal[0],centroid[1]-halfDiagonal[1],centroid[2]-halfDiagonal[2]]) );
            child_id = this.getChildIdAt(6);
            node = new OctreeNode( child_aabb, child_id );
            this.children[6] = node;
            break;
        case 7:
            console.log( "adding child 7" );
            child_aabb = new AABB( vec3.create([highCorner[0],highCorner[1]-halfDiagonal[1],highCorner[2]-halfDiagonal[2]]), vec3.create([centroid[0],centroid[1]-halfDiagonal[1],centroid[2]-halfDiagonal[2]]) );
            child_id = this.getChildIdAt(7);
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
    "use strict";
    this.root = root;
}

/*
  Little class for drawing octrees
*/
function OctreeDrawer( octree, context ) { 
    "use strict";
    this.octree = octree;
    this.context = context;
    this.positions = [];
    this.indices = [];
}

/* 
    Walk down octree, drawing as we go
*/
OctreeDrawer.prototype.drawRecursive = function( node ){
    "use strict";
    // If node is null then return
    if ( node === null ){
        return;
    }

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
    "use strict";
    this.draw_num = 0;
    this.drawRecursive( this.octree.root );
};

/*
    uploadMesh, copied from aabb.js
*/
OctreeDrawer.prototype.uploadMesh = function(){
    "use strict";
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



