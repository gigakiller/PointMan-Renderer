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
    var positions = [];
    var colors = [];
    var pointsCount = 0;

    var octree_positions = [];
    var indices = [];

    var expansion_req = new Array();
    // ID of root node
    //expansion_req.push(0); 
    function handleMsg() { 
        if(msg[0].bfsIdx == 0){ //we have recieved the root. this only happens once! 
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
                    colors.push( front_pts[j].r );
                    colors.push( front_pts[j].g );
                    colors.push( front_pts[j].b );
                    pointsCount += 1;
                }
            }
        }
        // Positions
        gl.useProgram(globe_program);
        var positionsName = gl.createBuffer();
        /*
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
        positions = new Float32Array(positions);
        colors = new Float32Array(colors);
        

        //Render everything in the current front
        octree_positions = [];
        indices = [];
        drawFront( front, octree_positions, indices );
        numberOfIndices = indices.length;
        //console.log(positions);
        //console.log(indices);
        //console.log(numberOfIndices);

        gl.useProgram(octree_program);
        // Positions
        var octreePositionsName = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, octreePositionsName);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(octree_positions), gl.STATIC_DRAW);
        gl.vertexAttribPointer(octreePositionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(octreePositionLocation);

        // Indices
        var indicesName = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

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
        console.log( "keycode: " + event.keyCode + "\n" );
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

        //toggle between round and square points
        if ( currentKeys[82] ) {
            use_RoundPoints = !use_RoundPoints;  
            initializeShader();
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
            console.log(cam);
        }
        // 's'
        if ( currentKeys[83] ) {
            //console.log("moving backwards\n");
            mat4.translate( cam, [0,0,cam_vel] );
            console.log(cam);
        }

        // 'a'
        if ( currentKeys[65] ) {
            mat4.translate( cam, [-cam_vel,0,0] );
            console.log(cam);
        }
        // 'd'
        if ( currentKeys[68] ) {
            mat4.translate( cam, [cam_vel,0,0] );
            console.log(cam);
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
            console.log(cam);
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
        if ( pointsCount > 0 ) {
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
      
        /* 
        // Octree Rendering program 
        gl.useProgram(octree_program);

        gl.uniformMatrix4fv(u_octreeModelLocation, false, model);
        gl.uniformMatrix4fv(u_octreeViewLocation, false, view);
        gl.uniformMatrix4fv(u_octreePerspLocation, false, persp);

        var octreePositionsName = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, octreePositionsName);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(octree_positions), gl.STATIC_DRAW);
        gl.vertexAttribPointer(octreePositionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(octreePositionLocation);

        // Indices
        var indicesName = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        gl.drawElements(gl.LINES, numberOfIndices, gl.UNSIGNED_SHORT,0);
        */

        time += 0.001;
        window.requestAnimFrame(animate);
    };
}());
