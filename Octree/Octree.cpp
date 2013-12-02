#include "Octree.h"

//OctreeNode: Nodes that make up the Octree
OctreeNode::OctreeNode(AABB boundingBox){
    children = new OctreeNode*[8];
    for( int i = 0; i < 8; i++){
        children[i] = NULL;
    } 
    aabb = boundingBox; 
    isLeaf = true;
    glm::vec3 aabbDiagonal = aabb.highCorner - aabb.lowCorner;
    //the position of each node is the center of its aabb.
    nodePosition = aabb.lowCorner + 0.5f*aabbDiagonal; 
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

    //The AABB for each child is different. We are going to pass in 
    //curChildBB as the "current child's" AABB. 
    AABB currChildBB;
    //octants number 0 to 7, according to convention documented in Octree.h 
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
