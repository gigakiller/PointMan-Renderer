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
#include <cstdio>
#include <cstring>
#include <jsoncpp/json/json.h>
#include <iostream>
#include <fstream>

using namespace std;
#define KEY_ESCAPE 27

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

    glPushMatrix();
        glEnable(GL_POINT_SMOOTH);
        glPointSize(10.0);
        glBegin(GL_POINTS);
        glVertex3f(0.0, 0.0, 0.0);
        glVertex3f(0.0, 1.0, 0.0);
        glVertex3f(1.0, 0.0, 0.0);
        glVertex3f(0.0, 0.0, 1.0);
        glEnd();
    glPopMatrix();
	
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

	GLfloat amb_light[] = { 0.1, 0.1, 0.1, 1.0 };
    GLfloat diffuse[] = { 0.6, 0.6, 0.6, 1 };
    GLfloat specular[] = { 0.7, 0.7, 0.3, 1 };
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
	glClearColor(0.0, 0.0, 1.0, 1.0);

}


void keyboard ( unsigned char key, int mousePositionX, int mousePositionY )		
{ 
  switch ( key ) 
  {
    case KEY_ESCAPE:        
      exit ( 0 );   
      break;      
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

int json_cpp_test(){
    string json_example = "{\"array\": \
                                [\"item1\", \
                                \"item2\"], \
                                \"not an array\": \
                                \"asdf\" \
                             }";

     // Let's parse it  
     Json::Value root;
     Json::Reader reader;
     bool parsedSuccess = reader.parse(json_example, 
                                       root, 
                                       false);
      
     if(not parsedSuccess)
     {
       // Report failures and their locations 
       // in the document.
       cout<<"Failed to parse JSON"<<endl 
           <<reader.getFormatedErrorMessages()
           <<endl;
       return 1;
     }
      
     // Let's extract the array contained 
     // in the root object
     const Json::Value array = root["array"];
     
     // Iterate over sequence elements and 
     // print its values
     for(unsigned int index=0; index<array.size(); 
         ++index)  
     {  
       cout<<"Element " 
           <<index 
           <<" in array: "
           <<array[index].asString()
           <<endl;
     }
      
     // Lets extract the not array element 
     // contained in the root object and 
     // print its value
     const Json::Value notAnArray = 
                   root["not an array"];
     
     if(not notAnArray.isNull())
     {
       cout<<"Not an array: "
           <<notAnArray.asString()
           <<endl;
     }
     
     // If we want to print JSON is as easy as doing:
     cout<<"Json Example pretty print: "
         <<endl<<root.toStyledString()
         <<endl;
     
     return 0;
}

int json_pointcloud_test(){

    //open our file
    ifstream curr_file("../data/chappes_sml.json"); 

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
       return 1;
     }
      
     // Let's extract the array contained 
     // in the root object
     const Json::Value array = root["positions"];
     
     // Iterate over sequence elements and 
     // print its values
     for(unsigned int index=0; index<array.size(); 
         ++index)  
     {  
       cout<<"Element " 
           <<index 
           <<" in array: "
           <<array[index][0]
           <<endl;
     }
      
    curr_file.close();
     
     return 0;
} 

int main(int argc, char **argv) 
{
    //json_cpp_test();
    json_pointcloud_test();
    glm::vec3 testVec(0.0, 1.0, 2.0);
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
	return 0;
}
