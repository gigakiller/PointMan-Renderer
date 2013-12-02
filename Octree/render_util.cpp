#include "render_util.h"

void drawOctree(OctreeNode* root){
    drawAABB(root->getAABB());
    if( !root->getIsLeaf() ){ //if we have children
        for(int i = 0; i < 8; i++){
            OctreeNode* currChild = root->getChildAt(i);  
            drawOctree(currChild);
        }
    }
}

void drawAABB( AABB toDraw ){
    glm::vec3 highCorner = toDraw.highCorner;
    glm::vec3 lowCorner = toDraw.lowCorner;
    glm::vec3 aabbSize = highCorner - lowCorner; 
    //identify all 8 corners of the AABB (we already know lowCorner and highCorner)
    glm::vec3 plusX = lowCorner + glm::vec3(aabbSize.x, 0.0, 0.0);
    glm::vec3 plusY = lowCorner + glm::vec3(0, aabbSize.y, 0);
    glm::vec3 plusZ = lowCorner + glm::vec3(0, 0, aabbSize.z);
    glm::vec3 plusXY = lowCorner + glm::vec3(aabbSize.x, 0, 0) + glm::vec3(0, aabbSize.y, 0);
    glm::vec3 plusXZ = lowCorner + glm::vec3(aabbSize.x, 0, 0) + glm::vec3(0, 0, aabbSize.z);
    glm::vec3 plusYZ = lowCorner + glm::vec3(0, aabbSize.y, 0) + glm::vec3(0, 0, aabbSize.z);
    glPushMatrix();
    glBegin(GL_LINES);
    glColor3f(1.0f, 0.0f, 0.0f);
    
    //draw tweleve edges, equal to 24 calls to glVertex3f
    //edge 1
    glVertex3f(lowCorner.x, lowCorner.y, lowCorner.z);
    glVertex3f(plusX.x, plusX.y, plusX.z);
    //edge 2
    glVertex3f(lowCorner.x, lowCorner.y, lowCorner.z);
    glVertex3f(plusY.x, plusY.y, plusY.z);
    //edge 3
    glVertex3f(lowCorner.x, lowCorner.y, lowCorner.z);
    glVertex3f(plusZ.x, plusZ.y, plusZ.z);
    //edge 4
    glVertex3f(plusY.x, plusY.y, plusY.z);
    glVertex3f(plusYZ.x, plusYZ.y, plusYZ.z);
    //edge 5
    glVertex3f(plusY.x, plusY.y, plusY.z);
    glVertex3f(plusXY.x, plusXY.y, plusXY.z);
    //edge 6
    glVertex3f(plusX.x, plusX.y, plusX.z);
    glVertex3f(plusXY.x, plusXY.y, plusXY.z);
    //egde 7
    glVertex3f(plusX.x, plusX.y, plusX.z);
    glVertex3f(plusXZ.x, plusXZ.y, plusXZ.z);
    //edge 8 
    glVertex3f(plusZ.x, plusZ.y, plusZ.z);
    glVertex3f(plusYZ.x, plusYZ.y, plusYZ.z);
    //edge 9 
    glVertex3f(plusZ.x, plusZ.y, plusZ.z);
    glVertex3f(plusXZ.x, plusXZ.y, plusXZ.z);
    //edge 10
    glVertex3f(highCorner.x, highCorner.y, highCorner.z);
    glVertex3f(plusYZ.x, plusYZ.y, plusYZ.z);
    //edge 11
    glVertex3f(highCorner.x, highCorner.y, highCorner.z);
    glVertex3f(plusXZ.x, plusXZ.y, plusXZ.z);
    //edge 12
    glVertex3f(highCorner.x, highCorner.y, highCorner.z);
    glVertex3f(plusXY.x, plusXY.y, plusXY.z);

    glEnd();
    glPopMatrix();
}
