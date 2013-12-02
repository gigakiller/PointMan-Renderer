/*
 * OpenGLSamples (openglsamples.sf.net) tutorials
 * VC++ users should create a Win32 Console project and link 
 * the program with glut32.lib, glu32.lib, opengl32.lib
 *
 * GLUT can be downloaded from http://www.xmission.com/~nate/glut.html
 * OpenGL is by default installed on your system.
 * For an installation of glut on windows for MS Visual Studio 2010 see: http://nafsadh.wordpress.com/2010/08/20/glut-in-ms-visual-studio-2010-msvs10/
 *
 *
 * main.cpp		
 *
 */

#include <stdio.h>
#include <GL/gl.h>		   // Open Graphics Library (OpenGL) header
#include <GL/glut.h>	   // The GL Utility Toolkit (GLUT) Header
#include <glm/glm.hpp>
#include <glm/ext.hpp>
#include <cstdio>
#include <cstring>
#include <jsoncpp/json/json.h>
#include <iostream>
#include <fstream>
#include <vector>
#include "data_util.h"
#include "Point.h"
#include "Octree.h"
#include "render_util.h"

using namespace std;
#define KEY_ESCAPE 27

//root for testing purposes
OctreeNode* testRoot;

//forward declarations:
void display();
void initialize();
//void keyboard ( unsigned char key, int mousePositionX, int mousePositionY );
void keyboard ( unsigned char key, int mousePositionX, int mousePositionY );
int json_pointcloud_test();
int json_cpp_test();

vector<Point>* pts;

//ignore the warning that we need to pad to align to 4 bytes
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpadded"
typedef struct {
    int width;
	int height;
	char* title;

	float field_of_view_angle;
	float z_near;
	float z_far;
} glutWindow;
#pragma clang diagnostic pop

glutWindow win;
float Rotation;
//glm::vec3 eyePos(8, 3, 0); 
//glm::vec3 vdir(-8,-3,0);
float eyePosArray[] = {8.0f, 3.0f, 0.0f};
float vdirArray[] = {-8.0f, -3.0f, 0.0f};


void display() 
{
    glm::vec3 eyePos( eyePosArray[0], eyePosArray[1], eyePosArray[2] );
    glm::vec3 vdir( vdirArray[0], vdirArray[1], vdirArray[2] );
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);		     // Clear Screen and Depth Buffer
	glLoadIdentity();
    vdir = glm::normalize(vdir);
    glm::vec3 center = eyePos + vdir;
	gluLookAt( eyePos.x,eyePos.y,eyePos.z, center.x,center.y,center.z, 0,1,0);					  // Define a viewing transformation

    /*
	
	glPushMatrix();										  // Push the current matrix stack
		glColor3f(1,0,0);
		glTranslatef(0,0,-2);							  // Multiply the current matrix by a translation matrix
		//glRotatef(Rotation,0,1,0);						  // Multiply the current matrix by a rotation matrix 
		glRotatef(90,0,1,0);							  // Multiply the current matrix by a rotation matrix
	    glutWireTeapot(1);								  // render a wire­frame teapot respectively. 
	glPopMatrix();										  // Pop the current matrix stack

	glPushMatrix();										  // Push the current matrix stack	
		glColor3f(0,1,0);
		glTranslatef(0,0,2);							  // Multiply the current matrix by a translation matrix
		//glRotatef(Rotation,0,1,0);
		glRotatef(90,0,1,0);
	    glutSolidTeapot(1);
	glPopMatrix();										  // Pop the current matrix stack

	glPushMatrix();										  // Push the current matrix stack
		glColor3f(0,0,1);
		//glRotatef(-Rotation,0,1,0);
		glRotatef(90,0,1,0);							  // Multiply the current matrix by a rotation matrix 
		glTranslatef(0,2,0);							  // Multiply the current matrix by a translation matrix
		glutSolidCube  (1.3); 
	glPopMatrix();										  // Pop the current matrix stack

	glPushMatrix();									      // Push the current matrix stack
		glColor3f(1,1,1);
		glTranslatef(0,-2.5,0);							  // Multiply the current matrix by a translation matrix
		//glRotatef(-Rotation,1,1,0);					 	  // Multiply the current matrix by a rotation matrix 
		glRotatef(90,0,1,0);							  // Multiply the current matrix by a rotation matrix 
		glutSolidSphere  (1 , 32 , 32 ); 	
	glPopMatrix();									      // Pop the current matrix stack

    */

    //draw each point that we've loaded
    glDisable(GL_LIGHTING); //needed for color to work
    glPushMatrix();
    glEnable(GL_POINT_SMOOTH);
    glPointSize(2.0);
    glBegin(GL_POINTS);
    for(unsigned long i = 0; i < pts->size(); i++){
        glm::vec3 currPos = (pts->at(i)).pos;
        glVertex3f(currPos.x, currPos.y, currPos.z);
        glm::vec3 currColor = (pts->at(i)).color;
        currColor = (1.0f/255.0f) * currColor; //normalize to range between 0 and 1
        glColor3f(currColor.x, currColor.y, currColor.z);
    }
    glEnd();
    glPopMatrix();

    //drawAABB(testRoot->getAABB());
    drawOctree(testRoot);
	
	Rotation++;

	glutSwapBuffers();
}


void initialize () 
{
    glMatrixMode(GL_PROJECTION);												// select projection matrix
    glViewport(0, 0, win.width, win.height);									// set the viewport
    glMatrixMode(GL_PROJECTION);												// set matrix mode
    glLoadIdentity();															// reset projection matrix
    GLfloat aspect = (GLfloat) win.width / win.height;
	gluPerspective(win.field_of_view_angle, aspect, win.z_near, win.z_far);		// set up a perspective projection matrix
    glMatrixMode(GL_MODELVIEW);													// specify which matrix is the current matrix
    glShadeModel( GL_SMOOTH );
    glClearDepth( 1.0f );														// specify the clear value for the depth buffer
    glEnable( GL_DEPTH_TEST );
    glDepthFunc( GL_LEQUAL );
    glHint( GL_PERSPECTIVE_CORRECTION_HINT, GL_NICEST );						// specify implementation-specific hints

	GLfloat amb_light[] = { 0.1f, 0.1f, 0.1f, 1.0f };
    GLfloat diffuse[] = { 0.6f, 0.6f, 0.6f, 1.0f };
    GLfloat specular[] = { 0.7f, 0.7f, 0.3f, 1.0f };
    glLightModelfv( GL_LIGHT_MODEL_AMBIENT, amb_light );
    glLightfv( GL_LIGHT0, GL_DIFFUSE, diffuse );
    glLightfv( GL_LIGHT0, GL_SPECULAR, specular );
    glEnable( GL_LIGHT0 );
    glEnable( GL_COLOR_MATERIAL );
    glShadeModel( GL_SMOOTH );
    glLightModeli( GL_LIGHT_MODEL_TWO_SIDE, GL_FALSE );
    glDepthFunc( GL_LEQUAL );
    glEnable( GL_DEPTH_TEST );
    glEnable(GL_LIGHTING);
    glEnable(GL_LIGHT0); 
	glClearColor(0.0f, 0.0f, 1.0f, 1.0f);

}


//we are required to read mousePositionX and mousePositionY, but we don't use them
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-parameter"
void keyboard ( unsigned char key, int mousePositionX, int mousePositionY )		
{ 
  switch ( key ) 
  {
    case KEY_ESCAPE:        
      exit ( 0 );   
    case 119: //w
        eyePosArray[0] -= 1;
        break;
    case 115: //s
        eyePosArray[0] += 1;
        break;
    case 97: //a
        eyePosArray[2] += 1;
        break;
    case 100: //d
        eyePosArray[2] -= 1;
        break;
    case 113: //a
        eyePosArray[1] += 1;
        break;
    case 101: //d
        eyePosArray[1] -= 1;
        break;

    default:      
      break;
  }
}
#pragma clang diagnostic pop

int main(int argc, char **argv) 
{

    //Load points as unstructured data
    const char* file_loc = "../data/chappes_sml.json";

    pts = parseJSONData( const_cast<char*>(file_loc) );
    AABB currAABB = calcAABB(pts);
    testRoot = new OctreeNode(currAABB); 
    testRoot->spawnChildren();
    
    cout << "Now testing AABB... there will be cake!" << endl;
    cout << "Low corner: " << glm::to_string(testRoot->getAABB().lowCorner) << endl;
    cout << "High corner: " << glm::to_string(testRoot->getAABB().highCorner) << endl;
 
	// set window values
	win.width = 640;
	win.height = 480;
	//win.title = "OpenGL/GLUT Window.";
	win.field_of_view_angle = 45;
	win.z_near = 1.0f;
	win.z_far = 500.0f;

	// initialize and run program
	glutInit(&argc, argv);                                      // GLUT initialization
	glutInitDisplayMode(GLUT_RGB | GLUT_DOUBLE | GLUT_DEPTH );  // Display Mode
	glutInitWindowSize(win.width,win.height);					// set window size
	glutCreateWindow(win.title);								// create Window
	glutDisplayFunc(display);									// register Display Function
	glutIdleFunc( display );									// register Idle Function
    glutKeyboardFunc( keyboard );								// register Keyboard Handler
	initialize();
	glutMainLoop();												// run GLUT mainloop
    delete pts;
    delete testRoot;
	return 0;
}
