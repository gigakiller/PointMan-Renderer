#ifndef CAMERA_H
#define CAMERA_H
#include <glm/glm.hpp>
struct Camera{
    glm::mat4 camMatrix; //matrix for non-translation related camera transformations
    glm::mat4 trans; //camera translation
};
#endif
