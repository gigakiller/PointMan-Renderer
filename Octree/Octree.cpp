#include "Octree.h"

//OctreeNode: Nodes that make up the Octree
OctreeNode::OctreeNode(AABB boundingBox){
    children = new OctreeNode*[8];
    for( int i = 0; i < 8; i++){
        children[i] = NULL;
    } 
    aabb = boundingBox; 
    isLeaf = true;
}

OctreeNode::~OctreeNode(){
    delete children;
}

bool OctreeNode::getIsLeaf(){
    return isLeaf;
}

void OctreeNode::spawnChildren(){
    //if you have children, then by definition you are not a leaf
    //...unless you are Adam or Eve
    isLeaf = false; 

    //TODO: fill in the rest.
    //Child 0 should be Octant 1
    //Child 1 should be Octant 2
    //Child 2 should be Octant 3
    //...
    //Child 7 should be Octant 8
    //Octants should be arranged spatially in the convention on the Wikipedia page:
    //http://en.wikipedia.org/wiki/Octant_(solid_geometry)
}

//************************************************
//Octree: makes up the octree itself

Octree::Octree(std::vector<Point>* points){
    root = buildOctree(points);
}

Octree::~Octree(){
    if(root)
        delete root;
}

OctreeNode* Octree::buildOctree(std::vector<Point>* points){
    return NULL;
}
