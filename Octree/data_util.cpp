#include "data_util.h"
#include <jsoncpp/json/json.h>
#include <iostream>
#include <fstream>

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
