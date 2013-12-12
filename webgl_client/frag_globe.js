(function() {
    "use strict";
    //[>global window,document,Float32Array,Uint16Array,mat4,vec3,snoise<]
    //[>global getShaderSource,createWebGLContext,createProgram<]

    function sphericalToCartesian( r, a, e ) {
        var x = r * Math.cos(e) * Math.cos(a);
        var y = r * Math.sin(e);
        var z = r * Math.cos(e) * Math.sin(a);

        return [x,y,z];
    }

    var message = document.getElementById("message");
    var canvas = document.getElementById("canvas");

    var gl = createWebGLContext(canvas, message);
    // Check for GL features
    if (!gl) {
        return;
    }

    //function drawSingleAABB( curr_aabb ){
        //var curr_root  = new OctreeNode( curr_aabb, 0 );
        //var curr_octree = new Octree( curr_root ); 
        //var octDrawer = new OctreeDrawer( curr_octree, gl );
        //octDrawer.draw();
        //var positions = octDrawer.positions;
        //var indices = octDrawer.indices;
        //numberOfIndices = indices.length; 
        //console.log(positions);
        //console.log(indices);
        //console.log(numberOfIndices);

        //// Positions
        //var octreePositionsName = gl.createBuffer();
        //gl.bindBuffer(gl.ARRAY_BUFFER, octreePositionsName);
        //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        //gl.vertexAttribPointer(octreePositionLocation, 3, gl.FLOAT, false, 0, 0);
        //gl.enableVertexAttribArray(octreePositionLocation);

        //// Indices
        //var indicesName = gl.createBuffer();
        //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName);
        //gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    //}

    ///////////////////////////////////////////////////////////////////////////

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    //assuming that we are drawing one cube at a time
    var numIndices = 32;

    var SUBSET_SIZE = 65534;

    //pos_subsets and ind_subsets form a partition of our octree_positions array and our 
    //index array, respectively. this will be used later when we draw the octree, in order
    //to split our draw into multiple draw calls. (In WebGL, draw is limited to 65536 indices). 
    var pos_subsets = [];
    var ind_subsets = [];

    var persp = mat4.create();
    mat4.perspective(45.0, canvas.width/canvas.height, 0.1, 100.0, persp);

    var radius = 5.0;
    var azimuth = Math.PI;
    var elevation = 0.0001;

    var camera_yaw = 0;
    var camera_pitch = 0;

    // Initialize camera
    var cam_vel = 0.25;
    var cam = mat4.create();
    mat4.identity(cam);

    var eye = sphericalToCartesian(radius, azimuth, elevation);
    var center = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];
    var view = mat4.create();
    mat4.lookAt(eye, center, up, view);

    //centroid
    var centroid = vec3.create();
    centroid[0] = 0.0;
    centroid[1] = 0.0;
    centroid[2] = 0.0;

    // Drawing mode, toggle between squares and circles
    var drawMode = 0;

    // Rendering modes, points/octree
    var renderMode = 0;

    // Number of octree indices
    var numberOfIndices = 0;

    //position, normal, texCoord location for the earth
    var positionLocation;
    var colorLocation;
    var normalLocation;
    var texCoordLocation;

    var octree_dict = {};

    // For octree
    var octreePositionLocation;
    var u_octreeModelLocation;
    var u_octreeViewLocation;
    var u_octreePerspLocation;
    var octree_program;

    var u_InvTransLocation;
    var u_ModelLocation;
    var u_ViewLocation;
    var u_PerspLocation;
    var u_timeLocation;
    var u_CentroidLocation;
    var u_drawMode;
    var globe_program;

    var use_RoundPoints = true;

    function initializeShader() {
        
        var vs = getShaderSource(document.getElementById("vs"));
        var fs;

        if( use_RoundPoints ){
            fs = getShaderSource(document.getElementById("fs"));
        } else {
            fs = getShaderSource(document.getElementById("square-fs"));
        }
        globe_program = createProgram(gl, vs, fs, message);


        // Optional binding ( mostly for performance on mac and opengl-es devices
        gl.bindAttribLocation(globe_program, 0, "Position");
        gl.bindAttribLocation(globe_program, 1, "Color");
        gl.bindAttribLocation(globe_program, 2, "Normal");

        gl.linkProgram(globe_program);
        if (!gl.getProgramParameter(globe_program, gl.LINK_STATUS)) {
            alert(gl.getProgramInfoLog(globe_program));
            return;
        } 

        positionLocation = gl.getAttribLocation(globe_program, "Position");
        colorLocation = gl.getAttribLocation(globe_program, "Color");
        normalLocation = gl.getAttribLocation(globe_program, "Normal");
        u_ModelLocation = gl.getUniformLocation(globe_program,"u_Model");
        u_ViewLocation = gl.getUniformLocation(globe_program,"u_View");
        u_PerspLocation = gl.getUniformLocation(globe_program,"u_Persp");
        u_InvTransLocation = gl.getUniformLocation(globe_program,"u_InvTrans");
        u_CentroidLocation = gl.getUniformLocation(globe_program,"u_Centroid");
        u_drawMode= gl.getUniformLocation(globe_program,"u_drawMode");
        //gl.useProgram(globe_program);
        

        // Set up octree shaders
        var octree_fs = getShaderSource(document.getElementById("octree-fs"));
        var octree_vs = getShaderSource(document.getElementById("octree-vs"));
        octree_program = createProgram(gl, octree_vs, octree_fs, message);

        gl.bindAttribLocation(octree_program, 0, "position");
        // Gotta link 
        gl.linkProgram(octree_program);
        if (!gl.getProgramParameter(octree_program, gl.LINK_STATUS)) {
            alert(gl.getProgramInfoLog(octree_program));
            return;
        } 

        octreePositionLocation = gl.getAttribLocation(octree_program, "position");
        u_octreeModelLocation = gl.getUniformLocation(octree_program,"u_Model");
        u_octreeViewLocation = gl.getUniformLocation(octree_program,"u_View");
        u_octreePerspLocation = gl.getUniformLocation(octree_program,"u_Persp");
        //gl.useProgram(octree_program);
    }

    initializeShader();

    // Message passing globals
    var pointsIndex=0;
    var numberOfPoints=0;
    var pointsCount=0;
    var positions;
    var indices;
    var colors;
    var msg;
    var new_msg=false;

    function loadPointCloud() { 
        //$.getJSON("data/chappes.json", function( pointCloud ) {

        // Unpack message
        var pointCloud = msg["data"];
        numberOfPoints = msg["numberOfPoints"];
        centroid = msg["centroid"];

        //console.log( numberOfPoints );
        var fragLen = pointCloud.positions.length;
        pointsCount += fragLen;
        //console.log( pointsCount );

        // Upon first message allocate memory for entire cloud
        if ( pointsIndex == 0 ) {
            // Initialize pointcloud memory
            positions = new Float32Array(3 * numberOfPoints);
            colors = new Float32Array(3 * numberOfPoints);

            // Set up camera pointing towareds centroid 
            gl.uniform3f(u_CentroidLocation, centroid[0], centroid[1], centroid[2]);

            //assuming the camera starts at the origin, the desired view direction is 
            //the coordinates of the centroid itself

            //I am assuming that we peer down the "+z" axis of camera space. We're going
            //to have to rotate the +z axis onto the desired view direction (i.e. the 
            //direction of the centroid).

            var plusZ = [0, 0, -1];
            var centroidDir = centroid;
            var centroidDir = vec3.normalize(centroid);//normalized vector pointing to centroid
            var desiredRotation = vec3.rotationTo(plusZ, centroidDir); 
            var startingRot3 = quat4.toMat3(desiredRotation);
            var startingRot4 = mat3.toMat4(startingRot3);
            mat4.multiply(cam, startingRot4); 
        }

        //console.log( pointCloud.positions.length );
        for ( var i=0; i<fragLen; i++ ) {
            //console.log( pointCloud.positions[i] );
            positions[pointsIndex] = pointCloud.positions[i][0];
            //  centroid[0] += pointCloud.positions[i][0];
            colors[pointsIndex] = pointCloud.colors[i][0]/255.0;
            pointsIndex++;
            positions[pointsIndex] = pointCloud.positions[i][1];
            //  centroid[1] += pointCloud.positions[i][1];
            colors[pointsIndex] = pointCloud.colors[i][1]/255.0;
            pointsIndex++;
            positions[pointsIndex] = pointCloud.positions[i][2];
            //  centroid[2] += pointCloud.positions[i][1];
            colors[pointsIndex] = pointCloud.colors[i][2]/255.0;
            pointsIndex++;
        }

        //centroid = (1.0/numberOfPoints) * centroid;
        //centroid[0] = centroid[0]/numberOfPoints;
        //centroid[1] = centroid[1]/numberOfPoints;
        //centroid[2] = centroid[2]/numberOfPoints;
        // Set up Points
        // Positions
        var positionsName = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionsName);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);
        // Colors
        var colorsName = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorsName);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLocation);

        //centroid = (1.0/numberOfPoints) * centroid;
        /*
           centroid[0] = centroid[0]/numberOfPoints;
           centroid[1] = centroid[1]/numberOfPoints;
           centroid[2] = centroid[2]/numberOfPoints;
           */

        //console.log("Centroid position:");
        //console.log(centroid[0]);
        //console.log(centroid[1]);
        //console.log(centroid[2]);
        //console.log( positions );
        //console.log( colors );

        // Kickoff animation cycle
        //animate();
        console.log(pointsIndex);

        // Indicate that the message has been handled 
        new_msg = false;
    }

    // Front Queue
    var root = null;
    var octree = new Octree( root );
    //var front = new Queue(); //the current nodes that we're using for rendering
    var front = []; //the current nodes that we're using for rendering
    var expansion_front = []; //the nodes we want to get the children of 
    //the expansion front is always a subset of the front.
    var curr_draw_lvl = [];
    var positions = [];
    var colors = [];
    var pointsCount = 0;

    var octree_positions = [];
    var indices = [];

    var expansion_req = new Array();

    //this takes lvl_array, and replaces its contents with its children
    function down_one_level( lvl_array ){
        var new_lvl_array = [];
        console.log("Going down one level!");
        for(var i=0; i < lvl_array.length; i++){
            console.log("At lvl_array item:".concat(i));
            var currParent = lvl_array[i];   
            var currIdx = currParent.bfsIdx;
            var child_cnt = 0;
            for(var j=0; j < 8; j++){
                var child_idx = 8*currIdx + j + 1; 
                if( child_idx in octree_dict ) {
                    child_cnt+=1;
                    new_lvl_array.push(octree_dict[child_idx]); 
                }
            }
            // If we don't have any children then add ourselves
            if ( child_cnt == 0 ) {
                new_lvl_array.push(currParent); 
            }
                
        }
        return new_lvl_array;
    }

    // this takes lvl_array and replaces its contents with the parents
    function up_one_level( lvl_array ){
        var new_lvl_array = [];
        var parents_pushed = {};
        console.log("Going up one level!");
        for( var i=0; i < lvl_array.length; i++){
            console.log("At lvl_array item:".concat(i));
            var currChild = lvl_array[i];
            var currIdx = currChild.bfsIdx;
            var parent_idx = Math.floor((currIdx - ((currIdx-1)%8)-1)/8)
            // If we have already added the parents, then go to the next child
            if ( parent_idx in parents_pushed ) {
                continue;
            }
            // If the parent is in the octree_dict then add it to the new_lvl_array
            if ( parent_idx in octree_dict ) {
                parents_pushed[parent_idx] = octree_dict[parent_idx];
                new_lvl_array.push(octree_dict[parent_idx]); 
            }
        }
        return new_lvl_array;
    }

    // ID of root node
    //expansion_req.push(0); 
    function handleMsg() { 
        if(msg[0].bfsIdx == 0){ //we have recieved the root. this only happens once! 
            curr_draw_lvl.push(msg[0]);

            octree_positions = [];
            indices = [];
            drawOctreeFront( curr_draw_lvl, octree_positions, indices );

            numberOfIndices = indices.length;
            octree_positions = new Float32Array(octree_positions);
            indices = new Uint16Array(indices);

            var highCorner = msg[0].highCorner;
            var lowCorner = msg[0].lowCorner;
            var new_highCorner = vec3.create([highCorner.x, highCorner.y, highCorner.z]); 
            var new_lowCorner = vec3.create([lowCorner.x, lowCorner.y, lowCorner.z]); 

            var new_aabb = new AABB( new_highCorner, new_lowCorner );
            var new_root  = new OctreeNode( new_aabb, 0 );
            octree = new Octree(new_root); 

            //centroid = new_root.position;
            // Set up camera pointing towareds centroid 
            gl.uniform3f(u_CentroidLocation, centroid[0], centroid[1], centroid[2]);

            //assuming the camera starts at the origin, the desired view direction is 
            //the coordinates of the centroid itself

            //I am assuming that we peer down the "+z" axis of camera space. We're going
            //to have to rotate the +z axis onto the desired view direction (i.e. the 
            //direction of the centroid).

            var plusZ = [0, 0, -1];
            var centroidDir = centroid;
            var centroidDir = vec3.normalize(centroid);//normalized vector pointing to centroid
            var desiredRotation = vec3.rotationTo(plusZ, centroidDir); 
            var startingRot3 = quat4.toMat3(desiredRotation);
            var startingRot4 = mat3.toMat4(startingRot3);
            mat4.multiply(cam, startingRot4); 
        }

        //put the children into the current front
        //also put them into the tree.
    
        for( var i=0; i < msg.length; i++ ){
            //front.enqueue( msg[i] );
            front.push( msg[i] );
            expansion_front.push( msg[i] );
            octree_dict[msg[i].bfsIdx] = msg[i]; 
        }

        // Update points to render based on current front
        /* 
        var front_pts;
        positions = [];
        colors = [];
        pointsCount = 0;
        for( var i=0; i<front.length; i++ ){
            if ( front[i].hasOwnProperty("points") ){
                front_pts = front[i].points;
                for ( var j=0; j<front_pts.length; j++ ){
                    positions.push( front_pts[j].x );
                    positions.push( front_pts[j].y );
                    positions.push( front_pts[j].z );
                    colors.push( front_pts[j].r/255.0 );
                    colors.push( front_pts[j].g/255.0 );
                    colors.push( front_pts[j].b/255.0 );
                    pointsCount += 1;
                }
            }
        }
        */
        /*
        var curr_draw_lvl_pts;
        positions = [];
        colors = [];
        pointsCount = 0;
        for( var i=0; i<curr_draw_lvl.length; i++ ){
            if ( curr_draw_lvl[i].hasOwnProperty("points") ){
                curr_draw_lvl_pts = curr_draw_lvl[i].points;
                for ( var j=0; j<curr_draw_lvl_pts.length; j++ ){
                    positions.push( curr_draw_lvl_pts[j].x );
                    positions.push( curr_draw_lvl_pts[j].y );
                    positions.push( curr_draw_lvl_pts[j].z );
                    colors.push( curr_draw_lvl_pts[j].r/255.0 );
                    colors.push( curr_draw_lvl_pts[j].g/255.0 );
                    colors.push( curr_draw_lvl_pts[j].b/255.0 );
                    pointsCount += 1;
                }
            }
        }
        */
        
        // Positions
        /*
        gl.useProgram(globe_program);
        var positionsName = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionsName);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);
        
        // Colors
        var colorsName = gl.createBuffer();
        
        gl.bindBuffer(gl.ARRAY_BUFFER, colorsName);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLocation);
        */
        positions = [];
        colors = [];
        pointsCount = drawFront( curr_draw_lvl, positions, colors );
        positions = new Float32Array(positions);
        colors = new Float32Array(colors);
        console.log(positions);
        console.log(pointsCount);
        

        //Render everything in the current front
        //octree_positions = [];
        //indices = [];
        //drawOctreeFront( curr_draw_lvl, octree_positions, indices );
        
        //initialize our 2D arrays that partition octree_positions and indices
        pos_subsets.length = Math.ceil(indices.length / SUBSET_SIZE);
        for( i=0; i < pos_subsets.length; i++){
            pos_subsets[i] = [];
            ind_subsets[i] = [];
        }

        //numberOfIndices = indices.length;
        //octree_positions = new Float32Array(octree_positions);
        //indices = new Uint16Array(indices);

        //make a request based on the children of everything in the current expansion front
        var requested_children = [];
        while( expansion_front.length > 0 ){
            var currParent = expansion_front.pop(); 
            var currIdx = currParent.bfsIdx;
            for(i=0; i < 8; i++){
                requested_children.push( 8*currIdx + i + 1 );
            }
        } 

        ws.send( JSON.stringify(requested_children) );
        // Indicate that the message has been handled 
        new_msg = false;
    }

    var time = 0;

    var mouseLeftDown = false;
    var mouseRightDown = false;
    var lastMouseX = null;
    var lastMouseY = null;

    var currentKeys = {};
    // Handle Keyboard Events
    function handleKeyDown(event) {
        //console.log( "keycode: " + event.keyCode + "\n" );
        currentKeys[event.keyCode] = true; 

        // For events that update once
        // 't' for toggling drawing mode
        if ( currentKeys[84] ) {
            if ( drawMode == 0 ) {
                drawMode = 1;
            } else {
                drawMode = 0;
            }
            console.log(drawMode);
        }

        if ( currentKeys[49] ) {
            // Draw points 
            renderMode = 0;
        }
        if ( currentKeys[50] ) {
            // Draw octree
            renderMode = 1;
        }
        if ( currentKeys[51] ) {
            // Draw points and octree
            renderMode = 2;
        }

        //toggle between round and square points
        if ( currentKeys[82] ) {
            use_RoundPoints = !use_RoundPoints;  
            initializeShader();
        }

        //user presses J, we go DOWN a level! 
        if ( currentKeys[74] ) {
            curr_draw_lvl = down_one_level( curr_draw_lvl ); 
            // Update octree drawing
            octree_positions = [];
            indices = [];
            drawOctreeFront( curr_draw_lvl, octree_positions, indices );
            numberOfIndices = indices.length;
            octree_positions = new Float32Array(octree_positions);
            indices = new Uint16Array(indices);
            // Update points drawing
            positions = [];
            colors = [];
            pointsCount = drawFront( curr_draw_lvl, positions, colors );
            positions = new Float32Array(positions);
            colors = new Float32Array(colors);
        } 

        //user presses K, we go UP on level!
        if ( currentKeys[75] ) {
            curr_draw_lvl = up_one_level( curr_draw_lvl ); 
            // Update octree drawing
            octree_positions = [];
            indices = [];
            drawOctreeFront( curr_draw_lvl, octree_positions, indices );
            numberOfIndices = indices.length;
            octree_positions = new Float32Array(octree_positions);
            indices = new Uint16Array(indices);
            // Update points drawing
            positions = [];
            colors = [];
            pointsCount = drawFront( curr_draw_lvl, positions, colors );
            positions = new Float32Array(positions);
            colors = new Float32Array(colors);
        }

    }

    function handleKeyUp(event) {
        currentKeys[event.keyCode] = false;
    }

    function handleUserInput(event) {
        handleMovement();
    }

    function handleMovement(event) {

        // 'w'
        if ( currentKeys[87] ) {
            //console.log("moving forward\n");
            mat4.translate( cam, [0,0,-cam_vel] );
            //console.log(cam);
        }
        // 's'
        if ( currentKeys[83] ) {
            //console.log("moving backwards\n");
            mat4.translate( cam, [0,0,cam_vel] );
            //console.log(cam);
        }

        // 'a'
        if ( currentKeys[65] ) {
            mat4.translate( cam, [-cam_vel,0,0] );
            //console.log(cam);
        }
        // 'd'
        if ( currentKeys[68] ) {
            mat4.translate( cam, [cam_vel,0,0] );
            //console.log(cam);
        }
        //'q' OR 'e' 
        if( currentKeys[81] || currentKeys[69] ) {
            //roll camera 
            var camera_roll = 0;
            var roll_vel = 0.025;
            currentKeys[81] ? camera_roll = roll_vel : camera_roll = -roll_vel;
            //mat4.identity(cam);
            var identity = mat4.create();
            mat4.identity(identity);

            var roll_mat = mat4.create(); 
            mat4.rotate(identity, camera_roll, [0,0,1], roll_mat);
            mat4.multiply(cam, roll_mat); 
            //console.log(cam);
        }
    }

    // Handle Mouse Events
    function handleMouseDown(event) {
        if( event.button == 2 ) {
            mouseLeftDown = false;
            mouseRightDown = true;
        }
        else {
            mouseLeftDown = true;
            mouseRightDown = false;
        }
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }

    function handleMouseUp(event) {
        mouseLeftDown = false;
        mouseRightDown = false;
    }

    function handleMouseMove(event) {
        if (!(mouseLeftDown || mouseRightDown)) {
            return;
        }
        var newX = event.clientX;
        var newY = event.clientY;

        var deltaX = newX - lastMouseX;
        var deltaY = newY - lastMouseY;

        camera_pitch = -0.01*deltaX;
        camera_yaw = -0.01*deltaY;
        var identity = mat4.create();
        mat4.identity(identity);


        if( mouseLeftDown )
        {
            //LOCAL yaw
            var yaw_mat = mat4.create(); 
            mat4.rotate(identity, camera_yaw, [1,0,0], yaw_mat);
            mat4.multiply(cam, yaw_mat); 

            //LOCAL pitch
            var pitch_mat = mat4.create(); 
            mat4.rotate(identity, camera_pitch, [0,1,0], pitch_mat);
            mat4.multiply(cam, pitch_mat); 
        }
        else
        {
            /*
               radius += 0.01 * deltaY;
               radius = Math.min(Math.max(radius, 2.0), 10.0);
               */
        }

        lastMouseX = newX;
        lastMouseY = newY;
    }

    canvas.onmousedown = handleMouseDown;
    canvas.oncontextmenu = function(ev) {return false;};
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;


    var prevTime = new Date().getTime();

    var elapsedTime = 5000;

    // PointCloud Websocket ... refactored with lighter callbacks
    var ws = new WebSocket("ws://localhost:8888/pointcloud_ws");
    //var ws = new WebSocket("ws://54.201.72.50:8888/pointcloud_ws");

    ws.onopen = function() {
        //var req = [2, 18];
        //ws.send( JSON.stringify(req) );
        ws.send("centroid");

        //trigger client-server cascade by requesting root  

        var req = [0]; 
        ws.send( JSON.stringify(req) );
    };

    ws.onmessage = function (evt) {
        // If we haven't yet handled the previous message then ignore current one
        // Note: A better thing would be to queue 
        if ( new_msg ) {
            return;
        }
        msg = JSON.parse(evt.data);
        if( msg.length === 0 ){
            return;
        } else if( msg.hasOwnProperty('centroid') ){
            console.log("Got centroid!");
            centroid[0] = msg.centroid[0];
            centroid[1] = msg.centroid[1];
            centroid[2] = msg.centroid[2];
            console.log(centroid[0]);
            console.log(centroid[1]);
            console.log(centroid[2]);
            return;
        }
        new_msg = true; 
    };


    // Positions
    var positionsName = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionsName);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);
    // Colors
    var colorsName = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsName);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);

    // Positions
    var octreePositionsName = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, octreePositionsName);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(octreePositionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(octreePositionLocation);

    // Indices
    var indicesName = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([]), gl.STATIC_DRAW);

    //initializeShader();
    animate();


    //loadPointCloud();
    //animate();

    function animate(){
        var currTime = new Date().getTime();
        var dt = currTime - prevTime;
        elapsedTime += dt;
        prevTime = currTime;


        // If we have a new message then update the pointcloud data
        if ( new_msg ) {
            //loadPointCloud();
            //Temporary: for now we are going to load an AABB to test to see 
            //if we are getting the octree from the server correctly
            handleMsg(); 
        }

        // Request pending nodes from server
        //if ( ws.readyState == ws.OPEN ) {
          //if ( expansion_req.length > 0 ) {
            //console.log( "Sending expansion req" + String(expansion_req) );
            //console.log( expansion_req );
            //console.log(JSON.stringify( expansion_req ))
            //ws.send( JSON.stringify( expansion_req ) );
            //expansion_req = [];
          //}
        //}

        // Handle user keyboard inputs
        handleUserInput();
        //handleMouseMove();

        // Invert camera pose to get view matrix
        view = mat4.create();
        mat4.inverse( cam, view );

        // Update Transforms
        var model = mat4.create();
        mat4.identity(model);
        var mv = mat4.create();
        mat4.multiply(view, model, mv);

        var invTrans = mat4.create();
        mat4.inverse(mv, invTrans);
        mat4.transpose(invTrans);

        // Render
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Pointcloud Rendering program
        
        gl.useProgram(globe_program);
        gl.uniformMatrix4fv(u_ModelLocation, false, model);
        gl.uniformMatrix4fv(u_ViewLocation, false, view);
        gl.uniformMatrix4fv(u_PerspLocation, false, persp);
        gl.uniformMatrix4fv(u_InvTransLocation, false, invTrans);

       
        //var positionsName = gl.createBuffer();
        if ( pointsCount > 0 && ( renderMode == 0 || renderMode == 2 )) {
          gl.bindBuffer(gl.ARRAY_BUFFER, positionsName);
          gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
          gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(positionLocation);
          // Colors
          //var colorsName = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, colorsName);
          gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
          gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(colorLocation);

          //gl.drawArrays( gl.POINTS, 0, pointsIndex/3);
          gl.drawArrays( gl.POINTS, 0, pointsCount );
        }
        //gl.drawElements( gl.LINES, numIndices, gl.UNSIGNED_SHORT, 0 );
        //gl.drawArrays( gl.LINES, 0, pointsCount );
        
      
         
        // Octree Rendering program 
        gl.useProgram(octree_program);

        gl.uniformMatrix4fv(u_octreeModelLocation, false, model);
        gl.uniformMatrix4fv(u_octreeViewLocation, false, view);
        gl.uniformMatrix4fv(u_octreePerspLocation, false, persp);

        if ( indices.length  > 0 && ( renderMode == 1 || renderMode == 2 )){
            gl.bindBuffer(gl.ARRAY_BUFFER, octreePositionsName);
            gl.bufferData(gl.ARRAY_BUFFER, octree_positions, gl.STATIC_DRAW);
            gl.vertexAttribPointer(octreePositionLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(octreePositionLocation);

            //Indices
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

            gl.drawElements(gl.LINES, numberOfIndices, gl.UNSIGNED_SHORT,0);
            
            //*********************************************************************
            
            //first, populate pos_subsets and ind_subsets
            //for(var i=0; i < indices.length; i++){
                //var curr_idx = indices[i];
                //var curr_subset = Math.floor(i / SUBSET_SIZE); //integer division
                //var subset_idx = i % SUBSET_SIZE;
                //pos_subsets[curr_subset][3*subset_idx] = octree_positions[curr_idx];
                //pos_subsets[curr_subset][3*subset_idx + 1] = octree_positions[curr_idx + 1];
                //pos_subsets[curr_subset][3*subset_idx + 2] = octree_positions[curr_idx + 2];
                //ind_subsets[curr_subset][subset_idx] = subset_idx;
            //}

            ////loop through each subset, and make a draw call for each
            //for(i=0; i < pos_subsets.length; i++){
                //var curr_positions = new Float32Array(pos_subsets[i]);  
                //var curr_idxs = new Uint16Array(ind_subsets[i]);  

                //gl.bindBuffer(gl.ARRAY_BUFFER, octreePositionsName);
                //gl.bufferData(gl.ARRAY_BUFFER, curr_positions, gl.STATIC_DRAW);
                ////gl.bufferData(gl.ARRAY_BUFFER, octree_positions, gl.STATIC_DRAW);
                //gl.vertexAttribPointer(octreePositionLocation, 3, gl.FLOAT, false, 0, 0);
                //gl.enableVertexAttribArray(octreePositionLocation);

                ////Indices
                ////gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName);
                ////gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, curr_idxs, gl.STATIC_DRAW);
                ////gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

                ////gl.drawElements(gl.LINES, curr_idxs.length, gl.UNSIGNED_SHORT,0);
                //gl.drawArrays( gl.POINTS, 0, curr_idxs.length );
            //}
        }

        time += 0.001;
        window.requestAnimFrame(animate);
    };
}());
