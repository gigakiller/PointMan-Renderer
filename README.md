PointMan-Renderer
=================

A massive WebGL point cloud renderer by Nathan Marshak and Uriah Baalke. [See LIVE online demo here! (Wait a few moments to allow points to load.)](http://nmarshak1337.github.io/PointMan-Renderer/webgl_client/frag_globe.html)

Below, a low-res render of the church as seen from the client:
![client_lowres](screenshots/lowres_church.png)

Below, the octree as seen from the server (the church is sideways in this picture):
![client_lowres](screenshots/church_octree.png)

TODO: We need to integrate octrees / LOD into the client!

##Usage:

In terminal:
  * $ python server/pointcloud_server.py

Then start html application.

Controls:
* Click and drag mouse to look.
* WASD to fly.
* Q and E to roll.
  
Credits
=================
* Some base code from the [CIS565 WebGL assignment](https://github.com/CIS565-Fall-2013).
* Trick for drawing circular points from [Movania Muhammad Mobeen](http://mmmovania.blogspot.com/2010/12/circular-point-sprites-in-opengl-33.html).
* Octree based on notes from http://www.brandonpelfrey.com/blog/coding-a-simple-octree/
* Server-side visualizer based on "OpenGL GLUT Shapes" sample from http://openglsamples.sourceforge.net/
