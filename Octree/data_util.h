#ifndef DATA_UTIL_H
#define DATA_UTIL_H

#include <vector>
#include <glm/glm.hpp>
#include <string>
#include "Point.h"

//gets positions from JSON file
std::vector<glm::vec3>* parseJSONPositions(char* filename);

//gets any data relevant to points from JSON file
std::vector<Point>* parseJSONData(char* filename); 

#endif
