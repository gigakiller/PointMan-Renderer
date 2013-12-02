#ifndef OCTREE_H
#define OCTREE_H

#include <glm/glm.hpp>
#include "Point.h"
#include <vector>

class OctreeNode 
{
public:
    OctreeNode();
    ~OctreeNode();
    //under a multiresolution scheme, a node could hold multiple points
    std::vector<Point> data; 
    OctreeNode** children; //octree has eight children
};

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
