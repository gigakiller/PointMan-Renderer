#ifndef DATA_UTIL_H
#define DATA_UTIL_H

#include <vector>
#include <glm/glm.hpp>
#include <string>
#include <GL/gl.h>		   // Open Graphics Library (OpenGL) header
#include <GL/glut.h>	   // The GL Utility Toolkit (GLUT) Header
#include "Point.h"
#include "AABB.h"


//gets positions from JSON file
std::vector<glm::vec3>* parseJSONPositions(char* filename);

//gets any data relevant to points from JSON file
std::vector<Point>* parseJSONData(char* filename); 

//compute AABB of the point cloud
AABB calcAABB(const std::vector<Point>* pts); 

#endif
