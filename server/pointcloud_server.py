'''
  Basic PointCloud Server. 
  Just reads in a file from data. ie: chappes.json and
  sends that data over a websocket when requested by the
  client
'''
import jsonpickle
from read_octopus import read_octree
from tornado import websocket, web, ioloop
from json import load, loads, dumps
from os import listdir
from time import sleep
from numpy import array

#read in the .octopus file that represents our octree
my_octree_dict = read_octree("data/chappes_sml.octopus")
print "Read in the .octopus file!"
#for key, val in my_octree_dict.iteritems():
    #print key, jsonpickle.encode(val)

#below line is for testing purposes
print jsonpickle.encode(my_octree_dict[0]);

# Get list of .json files in data
files = listdir('data')
loaded_clouds = {}
centroids = {}
for file in files:
  if file.find('.json') == -1:
    continue
  cloud_name = file.strip('json')[:-1]
  loaded_clouds[cloud_name] = None
  centroids[cloud_name] = None

print "PointClouds Available: ", [k for k in loaded_clouds.iterkeys()]

'''
Point Cloud Request handler:
  Each message contains the following:
    {data: subcloud of data, numElements: total number of elements in cloud, msg_index: current message index}   
  Transcations occur as follows:
    client: requests cloud and provides unique id as per:
      http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
      ```
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
              return v.toString(16);
      });
      ```
    host: responds with subset of cloud 
      continue until not data remaining 
    host: responds with data of len == 0
    client: no longer sends cloud requests
'''
class PointCloudReqWS(websocket.WebSocketHandler):
    def open(self):
        print "WebSocket opened"

    def on_message(self, message):
        msg = loads(message)
        cloud = msg['pointcloud']
        nodeIdx = int(cloud)
        self.write_message( jsonpickle.encode(my_octree_dict[nodeIdx]) ) 

        #if cloud == "1337": 
            #print "Received m3ssage from teh l337 h4x0rZ!"    
            #self.write_message('{ "power_level": 9000.1 }');
        #else:
            #print "PointCloud Requested: ", cloud
            ## Check if requested cloud is in our "database"
            #if not loaded_clouds.has_key(cloud):
              #print "Error: pointcloud " + cloud + " not available"
            ## Check if we have loaded it into RAM, if not load it
            #if loaded_clouds[cloud] is None:
              #print "Loading ..."
              #data = load(open('data/'+cloud+'.json', 'r'))
              #loaded_clouds[cloud] = data
              #positions = array(data['positions'])
              #centroids[cloud] = (sum(positions)/len(positions)).tolist()
            ## And respond 
            #print "Sending pointcloud"
            ##self.write_message( dumps(loaded_clouds[cloud]) )
            #numberOfPoints = len(loaded_clouds[cloud]['positions'])
             
            #start = 0
            #fragLen = 10000
            #while start+fragLen < numberOfPoints:
              #self.write_message( dumps(self.pack_msg(loaded_clouds[cloud], centroids[cloud], start, int(fragLen))) )
              #start += fragLen
              #print "sending data:", start
              #sleep(0.1)
            #remainder = numberOfPoints - start
            #self.write_message( dumps(self.pack_msg(loaded_clouds[cloud], centroids[cloud], start, int(remainder))) )
        
    def pack_msg( self, cloud, centroid, start, fragLen ):
      positions = cloud['positions'][start:start+fragLen]
      colors = cloud['colors'][start:start+fragLen]
      return {"data":{'positions':positions, 'colors':colors}, "numberOfPoints":len(cloud['positions']), "centroid":centroid}

    def on_close(self):
        print "WebSocket closed"

app = web.Application( [
  (r'/pointcloud_ws', PointCloudReqWS),
])

if __name__ == '__main__':
  print "Starting Server"
  app.listen('8888')
  ioloop.IOLoop.instance().start()
