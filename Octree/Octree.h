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
    ~Octree();
private:
    OctreeNode* buildOctree(std::vector<Point>* points);
    OctreeNode* root;
};
#pragma clang diagnostic pop

#endif
