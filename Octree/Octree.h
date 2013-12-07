#ifndef OCTREE_H
#define OCTREE_H

#include <glm/glm.hpp>
#include "Point.h"
#include <vector>
#include "data_util.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpadded"
class OctreeNode 
{
public:
    OctreeNode(AABB boundingBox);
    ~OctreeNode();
    //getters
    bool getIsLeaf();
    AABB getAABB();
    OctreeNode* getChildAt(int i); //get child at index

    void spawnChildren();
    //under a multiresolution scheme, a node could hold multiple points
    std::vector<Point> data; 
     
    //true means that there is data in this node, or in its descendants 
    //false means this node just contains empty space
    bool containsPoints;

    //Insert data into this node, following octree rules. We may have to create children
    //and recurse. See http://www.brandonpelfrey.com/blog/coding-a-simple-octree/
    void insertRecursive( Point data );

    // Populate this node by looking at its children, computing the position and color 
    //   average of their points 
    void populateRecursive( glm::vec3* parent_ave_pos, glm::vec3* parent_ave_color, bool isFirst ); 

    //add a child to the correct octant based on the position, then return the child
    //IF there is already a child at that octant, DO NOT create a new child, return
    //the child that is already there
    OctreeNode* addChild( glm::vec3 position );
private:
    OctreeNode** children; //octree has eight children
    glm::vec3 nodePosition; //center of the AABB
    AABB aabb;
    bool isLeaf; 
};

//Our convention for octrees is as follows:
// + and - are RELATIVE to the parent node
//
//  Number  x   y   z
//  *****************
//  0       +   +   +
//  1       -   +   +
//  2       -   -   +
//  3       +   -   +
//  4       +   +   -
//  5       -   +   -
//  6       -   -   -
//  7       +   -   -
class Octree
{
public:
    Octree(std::vector<Point>* points); //build octree based on unstructured data
    void insertPoint( Point p );
    OctreeNode* getRoot( void );
    void populateOctree( void );
    //writes the octree to a .octopus file, either for the Python server to read, or so that
    //we don't have to spend time building it again
    //.oct is already taken as the RADIANCE octree format... we don't want to pretend to do that
    void serialize(char* filename);
    
    //reads a .octopus file into an octree in memory. This is mostly used to test to see if 
    //serialization actually worked properly 
    OctreeNode* deserialize(char* filename);
    ~Octree();
private:
    OctreeNode* buildOctree(std::vector<Point>* points);
    OctreeNode* root;
};
#pragma clang diagnostic pop

#endif
