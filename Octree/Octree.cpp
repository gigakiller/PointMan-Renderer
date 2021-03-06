#include "Octree.h"
#include <iostream>
#include <fstream>
#include <assert.h>
#include <queue>
#include <glm/ext.hpp>
#include "data_util.h"
#include <algorithm>

//OctreeNode: Nodes that make up the Octree
OctreeNode::OctreeNode(AABB boundingBox, unsigned long newIdx) : aabb(boundingBox) {
    children = new OctreeNode*[8];
    for( int i = 0; i < 8; i++){
        children[i] = NULL;
    } 
    isLeaf = true;
    glm::vec3 aabbDiagonal = aabb.highCorner - aabb.lowCorner;
    //the position of each node is the center of its aabb.
    nodePosition = aabb.lowCorner + 0.5f*aabbDiagonal; 
    containsPoints = false;
    bfsIdx = newIdx;
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

glm::vec3 OctreeNode::getPosition() const{
    return nodePosition;
}

AABB OctreeNode::getAABB() const{
    return aabb;
}

unsigned long OctreeNode::getChildIdx(unsigned int i){
    return 8*bfsIdx + i + 1;
}


unsigned long OctreeNode::getBfsIdx() const{
    return bfsIdx; 
}

//add a child to the correct octant based on the position, then return the child
//IF there is already a child at that octant, DO NOT create a new child, return
//the child that is already there
OctreeNode* OctreeNode::addChild( glm::vec3 position ){
    isLeaf = false;
    //find out which octant the child is in
    unsigned int octNum;
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
        children[octNum] = new OctreeNode(childAABB, getChildIdx(octNum));
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

        /*
        Point oldData = data[0];
        data.pop_back(); //pop the old data
        //create children based on where both the old data and the new data are.
        OctreeNode* childOldData = addChild( oldData.pos );
        OctreeNode* childNewData = addChild( newData.pos );
        //re-insert the old point and the new point into the new children
        //this may occur several times during insert if points are close to each other
        childOldData->insertRecursive(oldData);
        childNewData->insertRecursive(newData);
        */

        data.push_back( newData );        
        if( data.size() >  MAX_PTS_PER_LEAF ){ //if below limit, simply add to data
        //too many points in leaf!
            while( !data.empty() ){
                Point currPt = data.back(); 
                data.pop_back(); //pop returns null in C++
                OctreeNode* currPtNode = addChild( currPt.pos );
                currPtNode->insertRecursive( currPt );
            }
        } 
    } else if ( !isLeaf ){ //not a leaf. insert child, recurse on that child.
        OctreeNode* newChild = addChild( newData.pos );
        newChild->insertRecursive( newData );
    } else {
        assert(true);
        std::cerr << "Insert hit invalid case!" << std::endl;
    }
}

void OctreeNode::popRandomSample(){
    if ( isLeaf )
        return;

    int num_valid_children = 0; //number of non null children
    //compute the number of valid children, and also MAKE SURE CHILDREN ARE POPULATED 
    for( int i=0; i<8; i++ ){
        OctreeNode* currChild = getChildAt(i);
        if (currChild != NULL) {
            num_valid_children++; 
            currChild->popRandomSample();
        }
    }
    for( int i=0; i<8; i++){
        OctreeNode* currChild = getChildAt(i);
        if( currChild != NULL) { //for each valid child
            int child_num_pts = static_cast<int>((currChild->data).size());
            int num_samples = std::max( child_num_pts / num_valid_children, 1 );
            int* rand_idxs = new int[num_samples];
            getNrandom(rand_idxs, num_samples, child_num_pts - 1);
            for(int j=0; j < num_samples; j++){
                int curr_idx = rand_idxs[j];
                data.push_back( currChild->data[ static_cast<unsigned long>(curr_idx) ] );
            }
            delete rand_idxs;
        } 
    } 
}

// Populate this node by looking at its children, computing the position and color 
//   average of their points 
void OctreeNode::populateRecursive( glm::vec3* parent_ave_pos, glm::vec3* parent_ave_color) {
    glm::vec3 ave_position(0, 0, 0);
    glm::vec3 ave_color(0, 0, 0);
    int cnt=0;

    // Update our parents average pos and color
    *parent_ave_pos += data[0].pos;
    *parent_ave_color += data[0].color;

    // If we are a leaf then we don't have children     
    if ( isLeaf ) 
        return;

    // Recurse down the tree 
    for( int i=0; i<8; i++ ){
        OctreeNode* currChild = getChildAt(i);
        if (currChild == NULL )
            continue;
        cnt += data.size();
        currChild->populateRecursive(&ave_position, &ave_color);
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

int Octree::getNumNodes(){
   int count = 0; 
   getNumDescendants(root, count);
   return count;
}

void Octree::getNumDescendants(OctreeNode* currNode, int& count){
    count++;
    for(int i = 0; i < 8; i++){
       OctreeNode* currChild = currNode->getChildAt(i);  
       if( currChild != NULL ){
           getNumDescendants(currChild, count);
       }
    }  
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
    //root->populateRecursive(&ave_position, &ave_color);
    root->popRandomSample();
}

OctreeNode* Octree::buildOctree(std::vector<Point>* points){
   
    AABB rootAABB = calcAABB(points); 
    //the root starts out with bfsIdx of zero! 
    OctreeNode* currRoot = new OctreeNode(rootAABB, 0);
    for(unsigned long i = 0; i < points->size(); i++){
	if ( i%100000 == 0 ) 
	    std::cout << "Inserting node #" << i << std::endl;
        currRoot->insertRecursive(points->at(i)); 
    }
    return currRoot;
}

//Serializes octree in following format:
//The line # is the numbering in the breadth-first traversal of the tree (see diagram on page 2 of the spec sheet on Google Docs)
//Each line looks like one of two things:
//A bunch of triplets of floats separated by tabs, finally ended with a line break
//i f f f\tf f f\tf f f\tf f f...\n
//The first number is an INT, which is the bfs index!
//The first 3 float are the position. The second three floats are the lower corner of the AABB
//the third three floats are the upper corner of the AABB. 
//Then, after that we have groups of 6 floats. "f f f f f f". There are six floats for each
//piece of data inside an inner node. The first 3 are position (xyz), the second 3 are color (rgb)
void Octree::serialize(const char* filename){
    std::ofstream currFile(filename);
    if( currFile.is_open() ){
        //serialize in a BREADTH-FIRST fashion
        std::queue<OctreeNode*> bfsQueue;
        bfsQueue.push(root);
        while( !bfsQueue.empty() ){
            OctreeNode* currNode = bfsQueue.front();
            bfsQueue.pop(); //pop returns void in C++
            writeNodeToFile(currNode, currFile); //serialize currNode to file
            //enqueue children of currNode
            for(int i = 0; i < 8; i++){
                if( currNode != NULL){
                    OctreeNode* currChild = currNode->getChildAt(i);
                    bfsQueue.push(currChild);
                }
            }
        }
    } else {
        std::cerr << "Failed to open file: " << filename << " for writing!" << std::endl;
    }
    currFile.close();
}

void Octree::writeNodeToFile(const OctreeNode* currNode, std::ofstream& fileStream){
    if( currNode == NULL ){
        return; //don't write null nodes
    }
    fileStream << currNode->getBfsIdx() << " ";
    glm::vec3 nodePos = currNode->getPosition();
    glm::vec3 lowCorn = currNode->getAABB().lowCorner;
    glm::vec3 highCorn = currNode->getAABB().highCorner;
    fileStream << nodePos.x << " " << nodePos.y << " " << nodePos.z << " "; //position of AABB centroid
    fileStream << lowCorn.x << " " << lowCorn.y << " " << lowCorn.z << " "; //AABB low corner
    fileStream << highCorn.x << " " << highCorn.y << " " << highCorn.z << " "; //AABB high corner

    //write six-lets (groups of 6 floats) that represent points stored inside node
    std::vector<Point> data = currNode->data;
    for(unsigned long i = 0; i < data.size(); i++){
        glm::vec3 currPos = data[i].pos;
        glm::vec3 currColor = data[i].color;
        fileStream << currPos.x << " " << currPos.y << " " << currPos.z << " "; //AABB high corner
        fileStream << currColor.x << " " << currColor.y << " " << currColor.z << " "; //AABB high corner
    }
    fileStream << std::endl; //denotes that "this" OctreeNode is finished. The next line is another node
}
