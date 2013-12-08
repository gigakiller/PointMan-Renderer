#got the following from http://stackoverflow.com/questions/434287/what-is-the-most-pythonic-way-to-iterate-over-a-list-in-chunks
def grouper(iterable, n, fillvalue=None):
    nathan_args = [iter(iterable)] * n
    pdb.set_trace()
    return izip_longest(*nathan_args, fillvalue=fillvalue)

#read in an .octopus file (output from the C++ octree builder)
#parse the input
#return a dictionary of OctreeNode objects, indexed by the the bfsIndex of the node.
def read_octree(filename):
    f = open(filename, 'r')
    octree_dict = {}
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
            currPt['x'] = float(sixlet[0]) 
            currPt['y'] = float(sixlet[1]) 
            currPt['z'] = float(sixlet[2]) 
            currPt['r'] = float(sixlet[3]) 
            currPt['g'] = float(sixlet[4]) 
            currPt['b'] = float(sixlet[5]) 
            points.append(currPt)

        my_node = OctreeNode(bfsIdx, position, highCorner, lowCorner, points) 
        octree_dict[bfsIdx] = my_node #hash each node by its unique ID (its bfsIdx)
            
    f.close()
    return octree_dict
