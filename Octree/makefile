INCDIRS = -I/usr/openwin/include -I/usr/local/include -I/usr/include/
LIBDIRS = -L/usr/openwin/lib -L/usr/local/lib      

CC = clang++
CFLAGS = -O3 $(INCDIRS)
LIBS = -lX11 -lXi -lXmu -lglut -lGL -lGLU -lm -ljsoncpp

test_octree:
	$(CC) $(CFLAGS) -o test_octree $(LIBDIRS) test_octree.cpp $(LIBS)  

clean:
	rm -f *.o test_octree
