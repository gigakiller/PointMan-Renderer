#include "Octree.h"
#include <iostream>

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
    containsPoints = false;
}

OctreeNode::~OctreeNode(){
    for(int i = 0; i < 8; i++){
        if(children[i])
            delete children[i];
    }
    delete children;
}

bool OctreeNode::getIsLeaf(){
    return isLeaf;
}

//get child at index (from 0 to 7)
OctreeNode* OctreeNode::getChildAt(int i){
    if( i < 0 || i > 7){
        std::cerr << "Accessing OctreeNode at invalid index: " << i << std::endl;
        return NULL;
    }
    return children[i]; 
}

void OctreeNode::spawnChildren(){
    //if you have children, then by definition you are not a leaf
    //...unless you are the Blessed Virgin Mary
    isLeaf = false; 
    
    //the lowCorner + halfDiagonal is the centroid of the AABB
    glm::vec3 halfDiagonal = 0.5f*(aabb.highCorner - aabb.lowCorner);

    //The AABB for each child is different. We are going to pass in 
    //curChildBB as the "current child's" AABB. 
    //Since we are passing-by-copy, this works and is cleaner than explicitly declaring 8 AABBs
    AABB currChildBB;
    //octants number 0 to 7, according to convention documented in Octree.h 
    // + and - are RELATIVE to the parent node

    //Octant # | x y z
    //***************
    //octant 0 | + + +
    currChildBB.lowCorner = nodePosition;  
    currChildBB.highCorner = aabb.highCorner; 
    children[0] = new OctreeNode(currChildBB); 
    //octant 1 | - + + 
    currChildBB.lowCorner = nodePosition - glm::vec3(halfDiagonal.x, 0.0f, 0.0f);  
    currChildBB.highCorner = aabb.highCorner - glm::vec3(halfDiagonal.x, 0.0f, 0.0f); 
    children[1] = new OctreeNode(currChildBB); 
    //octant 2 | - - + 
    currChildBB.lowCorner = nodePosition - glm::vec3(halfDiagonal.x, halfDiagonal.y, 0.0f);  
    currChildBB.highCorner = aabb.highCorner - glm::vec3(halfDiagonal.x, halfDiagonal.y, 0.0f); 
    children[2] = new OctreeNode(currChildBB); 
    //octant 3 | + - + 
    currChildBB.lowCorner = nodePosition - glm::vec3(0.0f, halfDiagonal.y, 0.0f);  
    currChildBB.highCorner = aabb.highCorner - glm::vec3(0.0f, halfDiagonal.y, 0.0f); 
    children[3] = new OctreeNode(currChildBB); 
    //octant 4 | + + - 
    currChildBB.lowCorner = nodePosition - glm::vec3(0.0f, 0.0f, halfDiagonal.z);  
    currChildBB.highCorner = aabb.highCorner - glm::vec3(0.0f, 0.0f, halfDiagonal.z); 
    children[4] = new OctreeNode(currChildBB); 
    //octant 5 | - + - 
    currChildBB.lowCorner = nodePosition - glm::vec3(halfDiagonal.x, 0.0f, halfDiagonal.z);  
    currChildBB.highCorner = aabb.highCorner - glm::vec3(halfDiagonal.x, 0.0f, halfDiagonal.z); 
    children[5] = new OctreeNode(currChildBB); 
    //octant 6 | - - - 
    currChildBB.lowCorner = nodePosition - glm::vec3(halfDiagonal.x, halfDiagonal.y, halfDiagonal.z);  
    currChildBB.highCorner = aabb.highCorner - glm::vec3(halfDiagonal.x, halfDiagonal.y, halfDiagonal.z); 
    children[6] = new OctreeNode(currChildBB); 
    //octant 7 | + - - 
    currChildBB.lowCorner = nodePosition - glm::vec3(0.0f, halfDiagonal.y, halfDiagonal.z);  
    currChildBB.highCorner = aabb.highCorner - glm::vec3(0.0f, halfDiagonal.y, halfDiagonal.z); 
    children[7] = new OctreeNode(currChildBB); 
}

AABB OctreeNode::getAABB(){
    return aabb;
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
