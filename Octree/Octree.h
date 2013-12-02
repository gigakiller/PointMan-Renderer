#ifndef OCTREE_H
#define OCTREE_H

#include <glm/glm.hpp>
#include "Point.h"

class OctreeNode 
{
public:
    OctreeNode();
    ~OctreeNode();
    OctreeNode** children; //octree has eight children
};

#endif
