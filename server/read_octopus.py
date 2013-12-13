#got the following from http://stackoverflow.com/questions/434287/what-is-the-most-pythonic-way-to-iterate-over-a-list-in-chunks
from itertools import izip_longest
from octree_node import OctreeNode

def grouper(iterable, n, fillvalue=None):
    nathan_args = [iter(iterable)] * n
    return izip_longest(*nathan_args, fillvalue=fillvalue)

#read in an .octopus file (output from the C++ octree builder)
#parse the input
#return a dictionary of OctreeNode objects, indexed by the the bfsIndex of the node.
def read_octree(filename):

    f = open(filename, 'r')
    octree_dict = {}

    centroid_x = 0;
    centroid_y = 0;
    centroid_z = 0;
    num_internal_pts = 0;

    for line in f:
        tokens = line.split()
        bfsIdx = int(tokens[0])
        position = {} #position of the node centroid
        position['x'] = float(tokens[1])
        position['y'] = float(tokens[2])
        position['z'] = float(tokens[3])
        lowCorner = {} #low corner of the AABB
        lowCorner['x'] = float(tokens[4])
        lowCorner['y'] = float(tokens[5])
        lowCorner['z'] = float(tokens[6])
        highCorner = {} #high corner of the AABB
        highCorner['x'] = float(tokens[7])
        highCorner['y'] = float(tokens[8])
        highCorner['z'] = float(tokens[9])

        points = [] #points that are INSIDE the node
        #everything here comes as a tuple of six (which I'm calling a sixlet). 
        for sixlet in grouper(tokens[10:], 6):
            currPt = {}
            currX = float(sixlet[0])
            currY = float(sixlet[1])
            currZ = float(sixlet[2])
            currPt['x'] = currX 
            currPt['y'] = currY 
            currPt['z'] = currZ 
            currPt['r'] = float(sixlet[3]) 
            currPt['g'] = float(sixlet[4]) 
            currPt['b'] = float(sixlet[5]) 
            points.append(currPt)
            centroid_x += currX
            centroid_y += currY
            centroid_z += currZ
            num_internal_pts += 1

        my_node = OctreeNode(bfsIdx, position, highCorner, lowCorner, points) 
        octree_dict[bfsIdx] = my_node #hash each node by its unique ID (its bfsIdx)
            
    f.close()
    if(num_internal_pts > 0):
        centroid_x = centroid_x / num_internal_pts;
        centroid_y = centroid_y / num_internal_pts;
        centroid_z = centroid_z / num_internal_pts;
    else:
        print 'ERROR: no internal points!'

    return (octree_dict, centroid_x, centroid_y, centroid_z)
