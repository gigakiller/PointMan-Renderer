INCDIRS = -I/usr/openwin/include -I/usr/local/include -I/usr/include/
LIBDIRS = -L/usr/openwin/lib -L/usr/local/lib      

CC = g++
CFLAGS = -O3 $(INCDIRS)
LIBS = -lX11 -lXi -lXmu -lglut -lGL -lGLU -lm 

test_octree: test_octree.o
	$(CC) $(CFLAGS) -o test_octree $(LIBDIRS) test_octree.cpp $(LIBS)  

clean:
	rm -f *.o test_octree
