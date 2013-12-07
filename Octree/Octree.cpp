#include "Octree.h"
#include <iostream>
#include <assert.h>
#include <glm/ext.hpp>

//OctreeNode: Nodes that make up the Octree
OctreeNode::OctreeNode(AABB boundingBox) : aabb(boundingBox) {
    children = new OctreeNode*[8];
    for( int i = 0; i < 8; i++){
        children[i] = NULL;
    } 
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
    AABB currChildBB( glm::vec3(0.0f, 0.0f, 0.0f), glm::vec3(0.0f, 0.0f, 0.0f) );
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

//add a child to the correct octant based on the position, then return the child
//IF there is already a child at that octant, DO NOT create a new child, return
//the child that is already there
OctreeNode* OctreeNode::addChild( glm::vec3 position ){
    isLeaf = false;
    //find out which octant the child is in
    int octNum;
    AABB childAABB;
    if( !aabb.getOctant(position, &octNum, &childAABB) ){
        std::cout << "Low corner: " << glm::to_string(aabb.lowCorner) << std::endl;
        std::cout << "High corner: " << glm::to_string(aabb.highCorner) << std::endl;
        std::cout << "Position: " << glm::to_string(position) << std::endl;
        assert(true);
    }
    //insert it into the correct child
    if( children[octNum] != NULL ){
        return children[octNum];
    } else {
        children[octNum] = new OctreeNode(childAABB);
        return children[octNum];
    }
}

//based on http://www.brandonpelfrey.com/blog/coding-a-simple-octree/
void OctreeNode::insertRecursive( Point newData ){
    if( isLeaf && data.size() == 0 ){ //if the node is a leaf, and it has no data 
        data.push_back(newData); 
    } else if( isLeaf && data.size() > 0 ){ //if it is a leaf, and it has data
        //we only store one point in a leaf
        //take the current point already in the node, and the new point, figure out which
        //octant they are in, and then insert 

        //BOLD ASSUMPTION: we only have one data so far! 
        Point oldData = data[0];
        data.pop_back(); //pop the old data
        
        //create children based on where both the old data and the new data are.
        OctreeNode* childOldData = addChild( oldData.pos );
        OctreeNode* childNewData = addChild( newData.pos );

        //re-insert the old point and the new point into the new children
        //this may occur several times during insert if points are close to each other
        childOldData->insertRecursive(oldData);
        childNewData->insertRecursive(newData);
    } else if ( !isLeaf ){ //not a leaf. insert child, recurse on that child.
        OctreeNode* newChild = addChild( newData.pos );
        newChild->insertRecursive( newData );
    } else {
        assert(true);
        std::cerr << "Insert hit invalid case!" << std::endl;
    }
}

// Populate this node by looking at its children, computing the position and color 
//   average of their points 
void OctreeNode::populateRecursive( glm::vec3* parent_ave_pos, glm::vec3* parent_ave_color, bool isFirst ) {
    glm::vec3 ave_position;
    glm::vec3 ave_color;
    int cnt=0;
    bool first = false;

    // Update our parents average pos and color
    if ( isFirst ) {
	*parent_ave_pos = data[0].pos;
	*parent_ave_color = data[0].color;
    } else {
	*parent_ave_pos += data[0].pos;
	*parent_ave_color += data[0].color;
    }

    // If we are a leaf then we don't have children     
    if ( isLeaf ) 
	return;

    // Recurse down the tree 
    for( int i=0; i<8; i++ ){
	OctreeNode* currChild = getChildAt(i);
	if (currChild == NULL )
	    continue;
	if ( cnt == 0 ) {
	    first = true;
	} else {
	    first = false;
	}
	cnt++;
	currChild->populateRecursive(&ave_position, &ave_color, first);
    }

    // Finally update our own data 
    Point newData;
    newData.pos = ave_position/float(cnt);
    newData.color = ave_color/float(cnt);
    data.push_back( newData );
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

OctreeNode* Octree::getRoot( void ){
  return root;
}

void Octree::insertPoint(Point p){
    root->insertRecursive(p);
}

// Populate the octree:
//   Start at the leafs and create representative points and each level that are the 
//   position and color average of the node points below
void Octree::populateOctree( void ) {
    // Dummy average pos and color
    glm::vec3 ave_position;
    glm::vec3 ave_color;
    // Kickoff recursion
    root->populateRecursive(&ave_position, &ave_color, true);
}

OctreeNode* Octree::buildOctree(std::vector<Point>* points){
   
    AABB rootAABB = calcAABB(points); 
    OctreeNode* currRoot = new OctreeNode(rootAABB);
    for(unsigned long i = 0; i < points->size(); i++){
	if ( i%100000 == 0 ) 
	    std::cout << "Inserting node #" << i << std::endl;
        if( i == 199 ){
            int leet = 1337;
        }
        currRoot->insertRecursive(points->at(i)); 
    }
    return currRoot;
}

//Serializes octree in following format:
//The line # is the numbering in the breadth-first traversal of the tree (see diagram on page 2 of the spec sheet on Google Docs)
//Each line looks like one of two things:
//The string "NULL" for null nodes, and a line break.
//A bunch of triplets of floats separated by tabs, finally ended with a line break
//f f f\tf f f\tf f f\tf f f...\n
//The first 3 float are the position. The second three floats are the lower corner of the AABB
//the third three floats are the upper corner of the AABB. All tirplets after that are positions of points
//stored inside the node (there may be none)
void Octree::serialize(char* filename){
    //TODO: Actually implement
}

void Octree::deserialize(char* filename){
    //TODO: Actually implement
}


