#include "AABB.h"
#include <assert.h>
#include <iostream>

AABB::AABB(){ //default constructor. not hugely useful.
    highCorner = glm::vec3(0,0,0);
    lowCorner = glm::vec3(0,0,0);
    centroid = glm::vec3(0,0,0);
}

AABB::AABB(glm::vec3 newHighCorner, glm::vec3 newLowCorner){
    setBounds( newHighCorner, newLowCorner );
}

void AABB::setBounds( glm::vec3 newHighCorner, glm::vec3 newLowCorner ){
    lowCorner = newLowCorner;
    highCorner = newHighCorner; 
    glm::vec3 aabbDiagonal = highCorner - lowCorner;
    centroid = lowCorner + 0.5f*aabbDiagonal;
}

glm::vec3 AABB::getCentroid(){
    return centroid;
}


//  8 Octant Cases
//  Number  x   y   z
//  *****************
//  0       +   +   +
//  1       -   +   +
//  2       -   -   +
//  3       +   -   +
//  4       +   +   -
//  5       -   +   -
//  6       -   -   -
//  7       +   -   -
bool AABB::getOctant(const glm::vec3 pos, int* outOctNum, AABB* outAABB){
    if( !isInside(pos) )
        return false;

    //the local coordinate system is centered at the centroid of the AABB
    glm::vec3 localPosition = pos - centroid;
    glm::vec3 halfDiagonal = highCorner - centroid;
    glm::vec3 halfX(halfDiagonal.x, 0.0f, 0.0f);
    glm::vec3 halfY(0.0, halfDiagonal.y, 0.0f);
    glm::vec3 halfZ(0.0f, 0.0f, halfDiagonal.z);

    
    //Octant # | x y z
    //***************
    //octant 0 | + + +
    if ( localPosition.x >= 0.0 && localPosition.y >= 0.0 && localPosition.z >= 0.0 ) {
        *outOctNum = 0; 
        *outAABB = AABB(highCorner, centroid); 
    //octant 1 | - + + 
    } else if ( localPosition.x < 0.0 && localPosition.y >= 0.0 && localPosition.z >= 0.0 ) {
        *outOctNum = 1; 
        *outAABB = AABB(highCorner - halfX, centroid - halfX); 
    //octant 2 | - - + 
    } else if ( localPosition.x < 0.0 && localPosition.y < 0.0 && localPosition.z >= 0.0 ) {
        *outOctNum = 2; 
        *outAABB = AABB(highCorner - halfX - halfY, centroid - halfX - halfY); 
    //octant 3 | + - + 
    } else if ( localPosition.x >= 0.0 && localPosition.y < 0.0 && localPosition.z >= 0.0 ) {
        *outOctNum = 3; 
        *outAABB = AABB(highCorner - halfY, centroid - halfY); 
    //octant 4 | + + - 
    } else if ( localPosition.x >= 0.0 && localPosition.y >= 0.0 && localPosition.z < 0.0 ) {
        *outOctNum = 4; 
        *outAABB = AABB(highCorner - halfZ, centroid - halfZ); 
    //octant 5 | - + - 
    } else if ( localPosition.x < 0.0 && localPosition.y >= 0.0 && localPosition.z < 0.0 ) {
        *outOctNum = 5; 
        *outAABB = AABB(highCorner - halfX - halfZ, centroid - halfX - halfZ); 
    //octant 6 | - - - 
    } else if ( localPosition.x < 0.0 && localPosition.y < 0.0 && localPosition.z < 0.0 ) {
        *outOctNum = 6; 
        *outAABB = AABB(highCorner - halfX - halfY - halfZ, centroid - halfX - halfY - halfZ); 
    //octant 7 | + - - 
    } else if ( localPosition.x >= 0.0 && localPosition.y < 0.0 && localPosition.z < 0.0 ) {
        *outOctNum = 7; 
        *outAABB = AABB(highCorner - halfY - halfZ, centroid - halfY - halfZ); 
    } else {
        assert(true);        
        std::cout << "Octant not found!" << std::endl;        
    }

    return true;
}

bool AABB::isInside(const glm::vec3 pos){
    return ( pos.x >= lowCorner.x - AABB_EPSILON && pos.y >= lowCorner.y - AABB_EPSILON && pos.z >= lowCorner.z - AABB_EPSILON && pos.x <= highCorner.x + AABB_EPSILON && pos.y <= highCorner.y + AABB_EPSILON && pos.z <= highCorner.z + AABB_EPSILON );
}
