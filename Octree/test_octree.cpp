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
#include "Camera.h"
#include "render_util.h"

using namespace std;
#define KEY_ESCAPE 27

//root for testing purposes
OctreeNode* testRoot = NULL;

// Octree 
Octree* myOctree = NULL;
int max_depth = 5;

//forward declarations:
void display();
void initialize();
//void keyboard ( unsigned char key, int mousePositionX, int mousePositionY );
void keyboard ( unsigned char key, int mousePositionX, int mousePositionY );
void mouse( int x, int y );
int json_pointcloud_test();
int json_cpp_test();
//void sphere_to_cart( float r, float a, float e, glm::vec3 *pos );

//void sphere_to_cart( float r, float a, float e, glm::vec3 *pos ) {
    //float x = r*cos(e)*cos(a);
    //float y = r*sin(e);
    //float z = r*cos(e)*sin(a);
    //*pos = glm::vec3( x,y,z );
//}

vector<Point>* pts;

// Eye camera
//glm::mat4 camera(1.0);
Camera* myCam = NULL;

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

// This is a super naive camera, controller using euler angles ( gross ) 
//glm::vec3 camera_rotation = glm::vec3( 0.0, 0.0, 0.0 );
//glm::vec3 sphere( 0.0, 0.0, 8.0 );

int draw_mode = OCTREE_DRAW_ALL;

void display() 
{
    glm::vec3 eyePos( eyePosArray[0], eyePosArray[1], eyePosArray[2] );
    glm::vec3 vdir( vdirArray[0], vdirArray[1], vdirArray[2] );
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);		     // Clear Screen and Depth Buffer
    glLoadIdentity();
    vdir = glm::normalize(vdir);
    glm::vec3 center = eyePos + vdir;

    // Update eyePos based on spherical coordinates
    //gluLookAt( eyePos.x,eyePos.y,eyePos.z, center.x,center.y,center.z, 0,1,0 );
    glm::mat4 view = glm::inverse( myCam->camMatrix );
    glMultMatrixf( &view[0][0] );

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
   
    /* 
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
    */

    /*
    // Draw first and second layer of the octree
    drawAABB(myOctree->getRoot()->getAABB());
    // Draw second layer
    for(int i = 0; i < 8; i++){
	OctreeNode* currChild = myOctree->getRoot()->getChildAt(i);  
	if ( currChild != NULL ){
	  drawAABB(currChild->getAABB());
	}
    }
    */
    drawOctree(myOctree->getRoot(), 0, max_depth, draw_mode);
    
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
//glm::mat4 trans;
void keyboard ( unsigned char key, int mousePositionX, int mousePositionY )		
{ 
  switch ( key ) 
  {
    case KEY_ESCAPE:        
      exit ( 0 );   
    case 119: //w
	myCam->trans = glm::translate( 0.0f, 0.0f, -2.0f );
	myCam->camMatrix = myCam->camMatrix*myCam->trans;
        break;
    case 115: //s
	myCam->trans = glm::translate( 0.0f, 0.0f, 2.0f );
	myCam->camMatrix = myCam->camMatrix*myCam->trans;
        break;
    case 97: //a
	myCam->trans = glm::translate( -2.0f, 0.0f, 0.0f );
	myCam->camMatrix = myCam->camMatrix*myCam->trans;
        break;
    case 100: //d
	myCam->trans = glm::translate( 2.0f, 0.0f, 0.0f );
	myCam->camMatrix = myCam->camMatrix*myCam->trans;
        break;
    case 'u':
	myCam->trans = glm::translate( 0.0f, 2.0f, 0.0f );
	myCam->camMatrix = myCam->camMatrix*myCam->trans;
	break;
    case 'i':
	myCam->trans = glm::translate( 0.0f, -2.0f, 0.0f );
	myCam->camMatrix = myCam->camMatrix*myCam->trans;
	break;
    case '1':
	draw_mode = OCTREE_DRAW_ALL;
	break;
    case '2':
	draw_mode = OCTREE_DRAW_AABB;
	break;
    case '3':
	draw_mode = OCTREE_DRAW_POINTS;
	break;
    case 'q':
	myCam->camMatrix = glm::rotate( myCam->camMatrix, 2.0f, glm::vec3( 0,0,1 ) );
	break;
    case 'e':
	myCam->camMatrix = glm::rotate( myCam->camMatrix, -2.0f, glm::vec3( 0,0,1 ) );
	break;
    case 'j':
	max_depth++;
	break;
    case 'k':
	max_depth--;
	break;

    default:      
      break;
  }
}

int prev_x = -1;
int prev_y = -1;
//glm::mat4 rot;
void mouse( int x, int y ) {
    if ( prev_x == -1 )
	prev_x = x;
    if ( prev_y == -1 )
	prev_y = y;

    myCam->camMatrix = glm::rotate( myCam->camMatrix, -0.01f*(x - prev_x), glm::vec3( 0,1,0 ) );
    myCam->camMatrix = glm::rotate( myCam->camMatrix, -0.01f*(y - prev_y), glm::vec3( 1,0,0 ) );
}
#pragma clang diagnostic pop

int main(int argc, char **argv) 
{

    myCam = new Camera;
    myCam->camMatrix = glm::mat4(1.0);
    //Load points as unstructured data
    const char* file_loc = "../data/chappes_sml.json";
    //const char* file_loc = "../data/chappes.json";
    
    // NOTE: this large file 650M uses up all of my RAM in the parseJSONData function
    //const char* file_loc = "../data/chappes_full.json";

    cout << "Parsing Json" << endl;	
    pts = parseJSONData( const_cast<char*>(file_loc) );
    cout << "Calculating full AABB " << endl;
    AABB currAABB = calcAABB(pts);
    cout << "AABB High Corner: " << glm::to_string(currAABB.highCorner) << endl; 
    cout << "AABB Low Corner: " << glm::to_string(currAABB.lowCorner) << endl; 

    //testRoot = new OctreeNode(currAABB); 
    //testRoot->spawnChildren();
    cout << "Creating Octree" << endl;
    myOctree = new Octree(pts);

    cout << "Populating Octree" << endl;
    myOctree->populateOctree();
    
    cout << "Now testing AABB... there will be cake!" << endl;

    cout << "Serializing octree... " << endl;
    myOctree->serialize("chappes_sml.octopus");
 
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
    glutMotionFunc( mouse );
    initialize();
    glutMainLoop();												// run GLUT mainloop
    
    delete myCam;
    delete pts;
    delete myOctree;
    return 0;
}
