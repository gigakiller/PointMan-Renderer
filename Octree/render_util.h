#ifndef RENDER_UTIL_H
#define RENDER_UTIL_H

#include <GL/gl.h>		   // Open Graphics Library (OpenGL) header
#include <GL/glut.h>	   // The GL Utility Toolkit (GLUT) Header
#include <glm/glm.hpp>
#include "Octree.h"

void drawAABB(AABB toDraw);
void drawOctree(OctreeNode* root, int depth, int max_depth);

#endif
