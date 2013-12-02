#include "Octree.h"

OctreeNode::OctreeNode(){
    children = new OctreeNode*[8];
    for( int i = 0; i < 8; i++){
        children[i] = NULL;
    } 
}
OctreeNode::~OctreeNode(){
    delete children;
}
