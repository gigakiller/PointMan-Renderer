#!/usr/bin/env python
from json import dump
'''
Read in .pts file, subsample and convert to json 
'''
fname = 'chappes'
fh = open(fname+'.pts', 'r')

# Skip first line
fh.readline()

positions = []
colors = []

cnt = 0
num_lines = 0
while True:
  l = fh.readline()
  if l == '':
    break
  cnt += 1
  num_lines += 1
  if cnt < 5000:
    continue
  dat = map( float, l.strip('\n\r').split(' ') )
  positions.append( dat[0:3] )
  colors.append( dat[-3:] )
  cnt = 0
  print 'num_lines: ', num_lines

pointCloud = {'filename':fname, 'positions':positions, 'colors':colors }

fh_out = open(fname+'.json', 'w')
dump( pointCloud, fh_out )


