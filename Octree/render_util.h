#ifndef RENDER_UTIL_H
#define RENDER_UTIL_H

#include <GL/gl.h>		   // Open Graphics Library (OpenGL) header
#include <GL/glut.h>	   // The GL Utility Toolkit (GLUT) Header
#include <glm/glm.hpp>
#include "Octree.h"

#define OCTREE_DRAW_POINTS 0
#define OCTREE_DRAW_AABB 1
#define OCTREE_DRAW_ALL 2 

void drawAABB(AABB toDraw);
void drawPoints( std::vector<Point> *pts );
void drawOctree(OctreeNode* root, int depth, int max_depth, int draw_mode);

#endif
