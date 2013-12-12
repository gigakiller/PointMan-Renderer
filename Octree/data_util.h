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

//fill an array with N random numbers between 0 and max_val (inclusive)
//read into an array "buf", with size buf_len (# of ints).
void getNrandom(int* buf, const int buf_len, const int max_val); 

#endif
