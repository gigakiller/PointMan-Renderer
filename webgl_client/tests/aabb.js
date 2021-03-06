(function() {
    "use strict";
    /*global window,document,Float32Array,Uint16Array,mat4,vec3,snoise*/
    /*global getShaderSource,createWebGLContext,createProgram*/

    // Octree stuff
    /*global OctreeNode */
   
     

    var NUM_WIDTH_PTS = 200;
    var NUM_HEIGHT_PTS = 200;

    var message = document.getElementById("message");
    var canvas = document.getElementById("canvas");
    var context = createWebGLContext(canvas, message);
    if (!context) {
        return;
    }

    ///////////////////////////////////////////////////////////////////////////

    context.viewport(0, 0, canvas.width, canvas.height);
    context.clearColor(1.0, 1.0, 1.0, 1.0);
    context.enable(context.DEPTH_TEST);

    var persp = mat4.create();
    mat4.perspective(45.0, 0.5, 0.1, 100.0, persp);

    var eye = [2.0, 1.0, 3.0];
    var center = [0.0, 0.0, 0.0];
    var up = [0.0, 0.0, 1.0];
    var view = mat4.create();
    mat4.lookAt(eye, center, up, view);

    var positionLocation = 0;
    var heightLocation = 1;
    var u_modelViewPerspectiveLocation;
    var u_timeLocation;
    var u_time = 0.0;

    (function initializeShader() {
        var program;
        var vs = getShaderSource(document.getElementById("vs"));
        var fs = getShaderSource(document.getElementById("fs"));

		var program = createProgram(context, vs, fs, message);
		context.bindAttribLocation(program, positionLocation, "position");
		u_modelViewPerspectiveLocation = context.getUniformLocation(program,"u_modelViewPerspective");
                u_timeLocation = context.getUniformLocation(program, "u_time");

        context.useProgram(program);
    })();

    var heights;
    var numberOfIndices;

    (function initializeGrid() {
        function uploadMesh(positions, heights, indices) {
            console.log(positions);
            console.log(indices);
            // Positions
            var positionsName = context.createBuffer();
            context.bindBuffer(context.ARRAY_BUFFER, positionsName);
            context.bufferData(context.ARRAY_BUFFER, new Float32Array(positions), context.STATIC_DRAW);
            context.vertexAttribPointer(positionLocation, 3, context.FLOAT, false, 0, 0);
            context.enableVertexAttribArray(positionLocation);

            // Indices
            var indicesName = context.createBuffer();
            context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indicesName);
            context.bufferData(context.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), context.STATIC_DRAW);
        
        }

      /*
        var positions = [];
        var indices = [];

        var test_aabb = new AABB( vec3.create(-width,-width,-width), vec3.create(width,width,width) );
        //test_aabb.draw( positions, indices );
        */
        /*
        var width = 0.1
        var positions = [];
        var indices = [];

        var test_aabb = new AABB( vec3.create([-width,-width,-width]), vec3.create([width,width,width]) );
        test_aabb.draw( positions, indices, 0 );

        var width = 0.05;
        var test_aabb2 = new AABB( vec3.create([-width,-width,-width]), vec3.create([width,width,width]) );
        test_aabb2.draw( positions, indices, 1 );
        console.log(positions);
        console.log(indices);
        */
        var width = 0.1
        var aabb = new AABB( vec3.create([width,width,width]), vec3.create([-width,-width,-width]) );

        var root = new OctreeNode( aabb );
        
        root.createChildAt(0);
        root.createChildAt(1);
        root.createChildAt(2);
        root.createChildAt(3);
        root.createChildAt(4);
        root.createChildAt(5);
        root.createChildAt(6);
        root.createChildAt(7);
        console.log( root.children[0].position );

        /* Battling with gl-matrix
        var v = vec3.create();
        vec3.subtract( root.aabb.highCorner, root.aabb.lowCorner, v );
        var centroid = vec3.create();
        vec3.scale( v, 0.5 )
        vec3.add( root.aabb.lowCorner, v, centroid );
        console.log( centroid );
        */

        /*
        var width = 0.05
        var aabb = new AABB( vec3.create([-width,-width,-width]), vec3.create([width,width,width]) );
        root.children[0] = new OctreeNode( aabb );
        */

       
        /* 
        var positions = [];
        var indices = [];
        console.log( root.aabb.lowCorner );
        console.log( root.aabb.highCorner );
        root.aabb.draw( positions, indices, 0 );
        console.log(positions);
        console.log(indices);
        */
        
       
         
        var octree = new Octree( root );
        var octDrawer = new OctreeDrawer( octree, context );
        octDrawer.draw();
        console.log(octDrawer.positions);
        console.log(octDrawer.indices);
        
        

        /*
        var lowCorner = [-width,-width,-width]
        var highCorner = [width,width,width]
      
        var positions = [
            // z-bottom
            lowCorner[0], lowCorner[1], lowCorner[2],
            lowCorner[0], highCorner[1], lowCorner[2],
            highCorner[0], highCorner[1], lowCorner[2],
            highCorner[0], lowCorner[1], lowCorner[2],
            // z-top
            lowCorner[0], lowCorner[1], highCorner[2],
            lowCorner[0], highCorner[1], highCorner[2],
            highCorner[0], highCorner[1], highCorner[2],
            highCorner[0], lowCorner[1], highCorner[2],
            ];
        var indices = [
            // z-bottom
            0,1,
            0,3,
            1,2,
            2,3,
            // z-top
            4,5,
            4,7,
            5,6,
            6,7,
            // x-left
            0,4,
            0,1,
            4,5,
            5,1,
            // x-right
            3,7,
            3,2,
            7,6,
            6,2
            ];
         
            */
        uploadMesh(octDrawer.positions, heights, octDrawer.indices);
        numberOfIndices = octDrawer.indices.length;
        //uploadMesh(positions, heights, indices);
        //numberOfIndices = indices.length;
    })();

    (function animate(){
        ///////////////////////////////////////////////////////////////////////////
        // Update

        var model = mat4.create();
        mat4.identity(model);
        mat4.translate(model, [-0.5, -0.5, 0.0]);
        var mv = mat4.create();
        mat4.multiply(view, model, mv);
        var mvp = mat4.create();
        mat4.multiply(persp, mv, mvp);

        u_time += 0.01;

        ///////////////////////////////////////////////////////////////////////////
        // Render
        context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
          
        context.uniformMatrix4fv(u_modelViewPerspectiveLocation, false, mvp);
        context.uniform1f( u_timeLocation, u_time );
        context.drawElements(context.LINES, numberOfIndices, context.UNSIGNED_SHORT,0);

		window.requestAnimFrame(animate);
    })();

}());
