'''
  Basic PointCloud Server. 
  Just reads in a file from data. ie: chappes.json and
  sends that data over a websocket when requested by the
  client
'''

from tornado import websocket, web, ioloop
from json import load, loads, dumps
from os import listdir

# Get list of .json files in data
files = listdir('data')
loaded_clouds = {}
for file in files:
  if file.find('.json') == -1:
    continue
  loaded_clouds[file.strip('json')[:-1]] = None

print "PointClouds Available: ", [k for k in loaded_clouds.iterkeys()]

class PointCloudReqWS(websocket.WebSocketHandler):
    def open(self):
        print "WebSocket opened"

    def on_message(self, message):
        msg = loads(message)
        cloud = msg['pointcloud']
        print "PointCloud Requested: ", cloud
        # Check if requested cloud is in our "database"
        if not loaded_clouds.has_key(cloud):
          print "Error: pointcloud " + cloud + " not available"
        # Check if we have loaded it into RAM, if not load it
        if loaded_clouds[cloud] is None:
          print "Loading ..."
          loaded_clouds[cloud] = load(open('data/'+cloud+'.json', 'r'))
        # And respond 
        print "Sending pointcloud"
        self.write_message( dumps(loaded_clouds[cloud]) )

    def on_close(self):
        print "WebSocket closed"

app = web.Application( [
  (r'/pointcloud_ws', PointCloudReqWS),
])

if __name__ == '__main__':
  print "Starting Server"
  app.listen('8888')
  ioloop.IOLoop.instance().start()
