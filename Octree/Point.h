#ifndef POINT_H
#define POINT_H

#include <glm/glm.hpp>

//Represents a point in our tree. Right now a point contains position and color.
//It could be extended to contain other things (e.g. temperature)
struct Point
{
    glm::vec3 pos; //position - this is ESSENTIAL for the octree
    glm::vec3 color; //color - this is an "auxillary" piece of data
};

#endif
