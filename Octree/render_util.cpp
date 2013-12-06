#include "render_util.h"

void drawOctree(OctreeNode* root, int depth, int max_depth, int draw_mode){
    // If node is null then return
    if ( root == NULL ) 
        return;

    depth++;
    if ( depth > max_depth )
        return;

    // Draw things based on draw_mode
    if ( draw_mode == OCTREE_DRAW_AABB || draw_mode == OCTREE_DRAW_ALL ) 	    	
	drawPoints(&(root->data));
    if ( draw_mode == OCTREE_DRAW_POINTS || draw_mode == OCTREE_DRAW_ALL )
	drawAABB(root->getAABB());
    for(int i = 0; i < 8; i++){
	OctreeNode* currChild = root->getChildAt(i);  
	drawOctree(currChild, depth, max_depth, draw_mode);
    }
}

void drawPoints( std::vector<Point> *pts ) {
    glDisable(GL_LIGHTING); //needed for color to work
    glPushMatrix();
    glEnable(GL_POINT_SMOOTH);
    glPointSize(2.0);
    glBegin(GL_POINTS);
    for(unsigned long i = 0; i < pts->size(); i++){
        glm::vec3 currColor = (pts->at(i)).color;
        currColor = (1.0f/255.0f) * currColor; //normalize to range between 0 and 1
        glColor3f(currColor.x, currColor.y, currColor.z);
        glm::vec3 currPos = (pts->at(i)).pos;
        glVertex3f(currPos.x, currPos.y, currPos.z);
    }
    glEnd();
    glPopMatrix();
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
