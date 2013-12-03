#ifndef AABB_H
#define AABB_H
#include <glm/glm.hpp>
class AABB
{
public:
    AABB();
    AABB(glm::vec3 newHighCorner, glm::vec3 newLowCorner);
    //given a position pos, if it is outside the AABB, return false.
    //if it is inside the AABB, return true and read the octant number into outOctNum,
    //read the AABB of that octant into outAABB
    bool getOctant(const glm::vec3 pos, int* outOctNum, AABB* outAABB);
    //is the position pos inside the AABB?
    bool isInside(const glm::vec3 pos); 
    void setBounds( glm::vec3 newHighCorner, glm::vec3 newLowCorner );
    glm::vec3 getCentroid();
    glm::vec3 lowCorner;  
    glm::vec3 highCorner;  
private:
    glm::vec3 centroid;
};
#endif
