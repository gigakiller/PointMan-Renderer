/*global vec3*/

/*
  Javascript Octree implementation
*/

function AABB( lowCorner, highCorner ) {
  if ( lowCorner instanceof vec3 || highCorner instanceof vec3 ) {
    alert( "Low Corner or High Corner not vec3" );
  }
  this.lowCorner = lowCorner;
  this.highCorner = highCorner;
  var aabbDiagonal = highCorner - lowCorner;
  this.centroid = lowCorner + 0.5*aabbDiagonal;
}

function OctreeNode() {
    // Since we don't have null pointer using -1
    this.children = new Array();
    for ( var i=0; i<7; i++ ) {
      this.children.push( null );
    }
}

OctreeNode.prototype.getChildAt = function(i){
    if ( i < 0 || i > 7 ) {
        alert( "Accessing OctreeNode at invalid index: " + str(i) );
    }
    return this.children[i];
};

/*
  This octree is special in that it holds nodes in the following 
  order:
    [ n0 nc0 nc1 nc2 nc3 nc4 nc5 nc6 nc7 nc0c1 nc0c2 ... ]
*/
function Octree() {
  this.nodes = new Array();
}

Octree.prototype.getNode = function( node_index ){
  // TODO: out of bounds check
  return this.nodes[node_index];
}
   

