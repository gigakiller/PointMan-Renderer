'''
  Basic PointCloud Server. 
  Just reads in a file from data. ie: chappes.json and
  sends that data over a websocket when requested by the
  client
'''

from tornado import websocket, web, ioloop
from json import load, loads, dumps
from os import listdir

def subcloud( cloud, num_pts ):
  start = cloud["pointsSent"]
  end = start+num_pts
  positions = cloud["data"]["positions"][start:end]
  colors = cloud["data"]["colors"][start:end]
  return {"data":{"positions":positions, "colors":colors}, "pointsSent":start, "numberOfPoints":cloud["numberOfPoints"]}


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
          loaded_clouds[cloud] = {"data":load(open('data/'+cloud+'.json', 'r')), "pointsSent":0, "numberOfPoints":0}
          loaded_clouds[cloud]["numberOfPoints"] = len(loaded_clouds[cloud]["data"]["positions"])

        # And respond 
        print "Sending pointcloud"
        num_points = 10000
        self.write_message( dumps(subcloud(loaded_clouds[cloud], num_points)) )
        loaded_clouds[cloud]["pointsSent"] += num_points

    def on_close(self):
        print "WebSocket closed"

app = web.Application( [
  (r'/pointcloud_ws', PointCloudReqWS),
])

if __name__ == '__main__':
  print "Starting Server"
  app.listen('8888')
  ioloop.IOLoop.instance().start()
