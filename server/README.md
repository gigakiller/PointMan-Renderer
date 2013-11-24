PointCloud Server

Right now its super simple. It just looks to see what .json files 
exist in the 'data' directory, when a request comes in the server
loads the pointcloud into ram once and holds on to it, so the next time
there is a request it can resend that pointcloud.

Depends:
  python2.7 or greater
  Tornado

Usage:
  python pointcloud_server.py
   

