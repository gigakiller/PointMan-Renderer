#ifndef OCTREE_H
#define OCTREE_H

#include <glm/glm.hpp>
#include "Point.h"
#include <vector>
#include "data_util.h"

class OctreeNode 
{
public:
    OctreeNode(AABB boundingBox);
    ~OctreeNode();
    bool getIsLeaf();
    void spawnChildren();
    //under a multiresolution scheme, a node could hold multiple points
    std::vector<Point> data; 
    OctreeNode** children; //octree has eight children
private:
    glm::vec3 nodePosition; //center of the AABB
    AABB aabb;
    bool isLeaf; 
};

//Our convention for octrees is as follows:
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

#endif
