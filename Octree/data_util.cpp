#include "data_util.h"
#include <jsoncpp/json/json.h>
#include <iostream>
#include <fstream>
#include <limits>
#include "Point.h"

using namespace std;
vector<glm::vec3>* parseJSONPositions(char* filename){
    ifstream curr_file(filename); 

     // Let's parse it  
     Json::Value root;
     Json::Reader reader;
     bool parsedSuccess = reader.parse(curr_file, 
                                       root, 
                                       false);
      
     if(not parsedSuccess)
     {
       // Report failures and their locations 
       // in the document.
       cout<<"Failed to parse JSON"<<endl 
           <<reader.getFormatedErrorMessages()
           <<endl;
       return NULL;
     }
      
     // Let's extract the array contained 
     // in the root object
     const Json::Value array = root["positions"];
     

    vector<glm::vec3>* toReturn = new vector<glm::vec3>();
       
    // Iterate over sequence elements and put them into the vector
     for(unsigned int index=0; index<array.size(); ++index)  
     { 
        float x = array[index][0].asFloat();
        float y = array[index][1].asFloat();
        float z = array[index][2].asFloat();
        glm::vec3 currPos(x,y,z);
        toReturn->push_back(currPos);
     }
    
    curr_file.close();
     
    return toReturn;
}

std::vector<Point>* parseJSONData(char* filename){
    ifstream curr_file(filename); 
     Json::Value root;
     Json::Reader reader;
     bool parsedSuccess = reader.parse(curr_file, 
                                       root, 
                                       false);
     if(not parsedSuccess)
     {
       // Report failures and their locations 
       // in the document.
       cout<<"Failed to parse JSON"<<endl 
           <<reader.getFormatedErrorMessages()
           <<endl;
       return NULL;
     }
      
    //extract both positions AND colors
     const Json::Value posArray = root["positions"];
     const Json::Value colorArray = root["colors"];
     

    vector<Point>* toReturn = new vector<Point>();
       
    // Iterate over sequence elements and put them into the vector
    
    if( posArray.size() != colorArray.size() ){
        cout << "Position array and color array not the same size!" << endl;
        return NULL;
    }

     for(unsigned int index=0; index < posArray.size(); ++index)  
     { 
        float x = posArray[index][0].asFloat();
        float y = posArray[index][1].asFloat();
        float z = posArray[index][2].asFloat();
        glm::vec3 currPos(x,y,z);

        float r = colorArray[index][0].asFloat();
        float g = colorArray[index][1].asFloat();
        float b = colorArray[index][2].asFloat();
        glm::vec3 currColor(r,g,b);

        Point newPoint; 
        newPoint.pos = currPos;
        newPoint.color = currColor; 

        toReturn->push_back(newPoint); 
     }
    
    curr_file.close();
     
    return toReturn;
}

AABB calcAABB(const std::vector<Point>* pts){
    float inf = std::numeric_limits<int>::infinity();
    glm::vec3 highCorner = glm::vec3(-inf, -inf, -inf); //corner with the highest x, y, z coords
    glm::vec3 lowCorner =  glm::vec3(inf, inf, inf); //corner with lowest x, y, z coords
    for(unsigned long i = 0; i < pts->size(); i++){
        glm::vec3 currPos = (pts->at(i)).pos;
        if(currPos.x > highCorner.x)
            highCorner.x = currPos.x;
        if(currPos.y > highCorner.y)
            highCorner.y = currPos.y;
        if(currPos.z > highCorner.z)
            highCorner.z = currPos.z;
        if(currPos.x < lowCorner.x)
            lowCorner.x = currPos.x;
        if(currPos.y < lowCorner.y)
            lowCorner.y = currPos.y;
        if(currPos.z < lowCorner.z)
            lowCorner.z = currPos.z;
    } 
    AABB toReturn;
    toReturn.lowCorner = lowCorner;
    toReturn.highCorner = highCorner;
    return toReturn;
}

void drawAABB( glm::vec3 lowCorner, glm::vec3 highCorner ){
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
