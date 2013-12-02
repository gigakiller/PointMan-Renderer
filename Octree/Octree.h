#ifndef OCTREE_H
#define OCTREE_H

#include <glm/glm.hpp>
#include "Point.h"
#include <vector>

struct AABB
{
    glm::vec3 aabbLowCorner;  
    glm::vec3 aabbHighCorner;  
};

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
