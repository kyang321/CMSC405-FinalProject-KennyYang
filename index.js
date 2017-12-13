"use strict";

var gl;   // The webgl context.

var xval = -7;
var yval = 5.5;
var xvalStart = -7;
var yvalStart = 5.5;
var kval = 90; // Kick leg start
var carXPos = -6;

var a_coords_loc;         // Location of the a_coords attribute variable in the shader program.
var a_normal_loc;         // Location of a_normal attribute
var a_texCoords_loc;
var texture;


var u_modelview;       // Locations for uniform matrices
var u_projection;
var u_textureTransform;
var u_texture;
var u_normalMatrix;

var u_material;     // An object tolds uniform locations for the material.
var u_lights;       // An array of objects that holds uniform locations for light properties.

var projection = mat4.create();    // projection matrix
var modelview;                     // modelview matrix; value comes from rotator
var normalMatrix = mat3.create();  // matrix, derived from modelview matrix, for transforming normal vectors
var textureTransform = mat3.create();

var rotator;  // A TrackballRotator to implement rotation by mouse.
var textureLoaded;

var frameNumber = 0;  // frame number during animation (actually only goes up by 0.5 per frame)

var torus, sphere, cone, cylinder, disk, ring, cube;  // basic objects, created using function createModel

var matrixStack = [];           // A stack of matrices for implementing hierarchical graphics.

var currentColor = [1, 1, 1, 1];   // The current diffuseColor; render() functions in the basic objects set
                                   // the diffuse color to currentColor when it is called before drawing the object.
                                   // Other color properties, which don't change often are handled elsewhere.
var textureURLs = [
    "textures/brick001.jpg",
    "textures/Earth-1024x512.jpg",
    "textures/NightEarth-512x256.jpg",
    "textures/marble.jpg",
    "textures/metal003.gif",
    "textures/mandelbrot.jpeg"
];


/**
 * Draws the image, which consists of either the "world" or a closeup of the "car".
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!textureLoaded) {
        return;
    }


    mat4.perspective(projection, Math.PI / 4, 1, 1, 50);
    gl.uniformMatrix4fv(u_projection, false, projection);

    modelview = rotator.getViewMatrix();

    lights();
    drawGround();
    drawHouse();
    drawTrees();
    drawCar(carXPos);
    drawMountains();
    drawSky();
}

/* Loads a texture image, based on the selected image in a popup menu.
   When the texture has been loaded, the scene is redrawn with the texture.
   While the texture is loading, the canvas is blank.
*/
function loadTexture() {
    textureLoaded = false;
    animating = false;
    draw();
    var textureNum = 0;
    //var textureNum = Number(document.getElementById("texture").value);
    document.getElementById("message").innerHTML = "<b>LOADING TEXTURE</b>";
    var img = new Image();
    img.onload = function () {
        try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        }
        catch (e) {
            document.getElementById("message").innerHTML =
                "<b>SORRY, can't access texture image.  Note that some<br>browsers can't use a texture from a local disk.</b>";
            return;
        }
        gl.generateMipmap(gl.TEXTURE_2D);
        textureLoaded = true;
        document.getElementById("message").innerHTML = "Drag your mouse on the object to rotate it.";
        draw();
        /*
        doAnimationCheckbox();
        if (!animating) {
            draw();
        }
        */
    };
    img.onerror = function () {
        document.getElementById("message").innerHTML = "<b>SORRY, COULDN'T LOAD TEXTURE IMAGE.</b>";
    };
    img.src = textureURLs[textureNum];
}

function lights() {
    // Three of four lights used, all enabled
    // Use lights to enhance models looks
    gl.uniform1i(u_lights[0].enabled, 1);
    // Looking down z
    gl.uniform4f(u_lights[0].position, 0, 0, 1, 0);
    gl.uniform3f(u_lights[0].color, .5, .5, .5);

    // Looking down X
    gl.uniform1i(u_lights[1].enabled, 1);
    gl.uniform4f(u_lights[1].position, 1, 0, 0, 0);
    gl.uniform3f(u_lights[1].color, .5, .5, .5);

    // Light from sun
    gl.uniform1i(u_lights[2].enabled, 1);
    gl.uniform4f(u_lights[2].position, xval, yval, 0, 0);
    gl.uniform3f(u_lights[2].color, 1, 1, 0);


    currentColor = [0.3, 0.3, 0.3, 1];

    // show the sun
    pushMatrix();
    mat4.translate(modelview, modelview, [xval, yval, 1.5]);//
    mat4.scale(modelview, modelview, [1.4, 1.4, 1.4]);
    gl.uniform3f(u_material.emissiveColor, 1, 1, 0);
    sphere.render();

    // Modifying this material will change the Boxman look
    gl.uniform3f(u_material.emissiveColor, 0, 0, 0);
    popMatrix();


}

/** Draws the ground using transformations from a cube. **/
function drawGround() {
    pushMatrix();
    mat4.translate(modelview, modelview, [0, -3, -10]);
    mat4.rotate(modelview, modelview, (90) / 180 * Math.PI, [1, 0, 0]);
    mat4.scale(modelview, modelview, [30.0, 30.0, 1.0]);
    currentColor = [0.1, 0.4, 0.1, 1];
    cube.render();
    popMatrix();
}

function drawSky() {
    pushMatrix();
    mat4.translate(modelview, modelview, [0, 0, -30]);
    mat4.rotate(modelview, modelview, (0) / 180 * Math.PI, [1, 0, 0]);
    mat4.scale(modelview, modelview, [50.0, 30.0, 1]);
    gl.uniform3f(u_material.emissiveColor, .1, .1, 1);
    cube.render();
    gl.uniform3f(u_material.emissiveColor, 0, 0, 0);
    popMatrix();

}

function drawTree(xPos, zPos) {
    // draw trunk
    pushMatrix();
    mat4.translate(modelview, modelview, [xPos, -1.5, zPos]);
    mat4.rotate(modelview, modelview, (90) / 180 * Math.PI, [1, 0, 0]);
    mat4.scale(modelview, modelview, [.5, .5, 3]);
    currentColor = [83 / 255.0, 49 / 255.0, 24 / 255.0, 1];
    cube.render();
    popMatrix();

    // draw leaves
    pushMatrix();
    mat4.translate(modelview, modelview, [xPos, 1, zPos]);
    mat4.scale(modelview, modelview, [1.4, 1.4, 1.4]);
    currentColor = [58 / 255.0,
        95 / 255.0,
        11 / 255.0, 1];
    sphere.render();
    popMatrix();
}

function drawTrees() {
    drawTree(-8, -4);
    drawTree(4, -4);
    drawTree(6, 0);
    drawTree(-4, 0);
}

function drawHouse() {
    // draw base of house
    pushMatrix();
    mat4.translate(modelview, modelview, [0, -1.5, 0]);
    mat4.rotate(modelview, modelview, (90) / 180 * Math.PI, [1, 0, 0]);
    mat4.scale(modelview, modelview, [2, 2, 2]);
    currentColor = [210 / 255.0, 180 / 255.0, 150 / 255.0, 1];
    //gl.uniformMatrix3fv(u_textureTransform, false, textureTransform);
    cube.render();
    popMatrix();

    // draw roof of house
    pushMatrix();
    mat4.translate(modelview, modelview, [0, -.5, 0]);
    mat4.rotate(modelview, modelview, (90 + 180) / 180 * Math.PI, [1, 0, 0]);
    mat4.scale(modelview, modelview, [2, 2, 2]);
    currentColor = [160 / 255.0, 82 / 255.0, 45 / 255.0, 1.0];
    cone.render();
    popMatrix();

}

function drawWheel(xPos, zPos) {
    pushMatrix();
    mat4.translate(modelview, modelview, [xPos, -2, zPos]);
    mat4.rotate(modelview, modelview, (0) / 180 * Math.PI, [1, 0, 0]);
    mat4.scale(modelview, modelview, [1, 1, 0.2]);
    currentColor = [0.2, 0.2, 0.2, 1];
    cylinder.render();
    popMatrix();
}

function drawCar(xPos) {
    drawWheel(xPos + 0, 2);
    drawWheel(xPos + 2, 2);
    drawWheel(xPos + 0, 4);
    drawWheel(xPos + 2, 4);

    // Long segment of car
    pushMatrix();
    mat4.translate(modelview, modelview, [xPos + 1, -1.5, 3.25]);
    mat4.rotate(modelview, modelview, (0) / 180 * Math.PI, [1, 0, 0]);
    mat4.scale(modelview, modelview, [3.5, 1, 2]);
    currentColor = [0.6, 0.0, 0.0, 1];
    cube.render();
    popMatrix();

    // Box segment of car
    pushMatrix();
    mat4.translate(modelview, modelview, [xPos + 1, -1, 0.25]);
    mat4.rotate(modelview, modelview, (0) / 180 * Math.PI, [1, 0, 0]);
    mat4.scale(modelview, modelview, [2, 1.5, 2]);
    currentColor = [0.6, 0.0, 0.0, 1];
    cylinder.render();
    popMatrix();
}

function drawSingleMountain(xPos, scale) {
    pushMatrix();
    mat4.translate(modelview, modelview, [xPos, scale * -.5 - 1, -20]);
    mat4.rotate(modelview, modelview, (270) / 180 * Math.PI, [1, 0, 0]);
    mat4.scale(modelview, modelview, [scale * 2, scale, scale]);
    currentColor = [0.6, 0.6, 0.6, 1];
    cone.render();
    popMatrix();
}

function drawMountains() {
    drawSingleMountain(0, 9);
    drawSingleMountain(-7, 4);
    drawSingleMountain(8, 6);
}

/**
 *  Push a copy of the current modelview matrix onto the matrix stack.
 */
function pushMatrix() {
    matrixStack.push(mat4.clone(modelview));
}


/**
 *  Restore the modelview matrix to a value popped from the matrix stack.
 */
function popMatrix() {
    modelview = matrixStack.pop();
}

<!-- As is no changes -->
/**
 *  Create one of the basic objects.  The modelData holds the data for
 *  an IFS using the structure from basic-objects-IFS.js.  This function
 *  creates VBOs to hold the coordinates, normal vectors, and indices
 *  from the IFS, and it loads the data into those buffers.  The function
 *  creates a new object whose properties are the identifies of the
 *  VBOs.  The new object also has a function, render(), that can be called to
 *  render the object, using all the data from the buffers.  That object
 *  is returned as the value of the function.  (The second parameter,
 *  xtraTranslate, is there because this program was ported from a Java
 *  version where cylinders were created in a different position, with
 *  the base on the xy-plane instead of with their center at the origin.
 *  The xtraTranslate parameter is a 3-vector that is applied as a
 *  translation to the rendered object.  It is used to move the cylinders
 *  into the position expected by the code that was ported from Java.)
 */
function createModel(modelData, xtraTranslate) {
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;
    if (xtraTranslate)
        model.xtraTranslate = xtraTranslate;
    else
        model.xtraTranslate = null;
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
    model.render = function () {  // This function will render the object.
        // Since the buffer from which we are taking the coordinates and normals
        // change each time an object is drawn, we have to use gl.vertexAttribPointer
        // to specify the location of the data. And to do that, we must first
        // bind the buffer that contains the data.  Similarly, we have to
        // bind this object's index buffer before calling gl.drawElements.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(a_coords_loc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(a_normal_loc, 3, gl.FLOAT, false, 0, 0);
        gl.uniform4fv(u_material.diffuseColor, currentColor);
        if (this.xtraTranslate) {
            pushMatrix();
            mat4.translate(modelview, modelview, this.xtraTranslate);
        }
        gl.uniformMatrix4fv(u_modelview, false, modelview);
        mat3.normalFromMat4(normalMatrix, modelview);
        gl.uniformMatrix3fv(u_normalMatrix, false, normalMatrix);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        if (this.xtraTranslate) {
            popMatrix();
        }
    };
    return model;
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type String is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 *    The second and third parameters are the id attributes for <script>
 * elementst that contain the source code for the vertex and fragment
 * shaders.
 */
function createProgram(gl, vertexShaderID, fragmentShaderID) {
    function getTextContent(elementID) {
        // This nested function retrieves the text content of an
        // element on the web page.  It is used here to get the shader
        // source code from the script elements that contain it.
        var element = document.getElementById(elementID);
        var node = element.firstChild;
        var str = "";
        while (node) {
            if (node.nodeType == 3) // this is a text node
                str += node.textContent;
            node = node.nextSibling;
        }
        return str;
    }

    try {
        var vertexShaderSource = getTextContent(vertexShaderID);
        var fragmentShaderSource = getTextContent(fragmentShaderID);
    }
    catch (e) {
        throw "Error: Could not get shader source code from script elements.";
    }
    var vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vertexShaderSource);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
    }
    var fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}


/* Initialize the WebGL context.  Called from init() */
function initGL() {
    var prog = createProgram(gl, "vshader-source", "fshader-source");
    gl.useProgram(prog);
    gl.enable(gl.DEPTH_TEST);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    a_coords_loc = gl.getAttribLocation(prog, "a_coords");
    a_normal_loc = gl.getAttribLocation(prog, "a_normal");
    a_texCoords_loc = gl.getAttribLocation(prog, "a_texCoords");

    gl.enableVertexAttribArray(a_coords_loc);
    gl.enableVertexAttribArray(a_normal_loc);
    gl.enableVertexAttribArray(a_texCoords_loc);

    u_modelview = gl.getUniformLocation(prog, "modelview");
    u_projection = gl.getUniformLocation(prog, "projection");
    u_normalMatrix = gl.getUniformLocation(prog, "normalMatrix");
    u_texture = gl.getUniformLocation(prog, "texture");
    u_textureTransform = gl.getUniformLocation(prog, "textureTransform");

    u_material = {
        diffuseColor: gl.getUniformLocation(prog, "material.diffuseColor"),
        specularColor: gl.getUniformLocation(prog, "material.specularColor"),
        emissiveColor: gl.getUniformLocation(prog, "material.emissiveColor"),
        specularExponent: gl.getUniformLocation(prog, "material.specularExponent")
    };
    u_lights = new Array(4);
    for (var i = 0; i < 4; i++) {
        u_lights[i] = {
            enabled: gl.getUniformLocation(prog, "lights[" + i + "].enabled"),
            position: gl.getUniformLocation(prog, "lights[" + i + "].position"),
            color: gl.getUniformLocation(prog, "lights[" + i + "].color")
        };
    }

    gl.uniform3f(u_material.specularColor, 0.1, 0.1, 0.1);  // specular properties don't change
    gl.uniform1f(u_material.specularExponent, 16);
    gl.uniform3f(u_material.emissiveColor, 0, 0, 0);  // default, will be changed temporarily for some objects


    for (var i = 1; i < 4; i++) { // set defaults for lights
        gl.uniform1i(u_lights[i].enabled, 0);
        gl.uniform4f(u_lights[i].position, 0, 0, 1, 0);
        gl.uniform3f(u_lights[i].color, 1, 1, 1);
    }

    gl.uniform1i(u_texture, 0);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    loadTexture();


} // end initGL()


//--------------------------------- animation framework ------------------------------


var animating = false;

/*
This is where you control the animation by changing positions,
and rotations values as needed.
Trial and error works on the numbers. Graph paper design is more efficient.
*/

function frame() {
    if (animating) {
        frameNumber += 1;
        // Positions of the sun
        xval += 0.02;
        carXPos += 0.1;
        // Rotation of kick leg
        // Not perfect by anymeans but Okay for at least one viewing angle.
        kval -= .1;
        if (xval > 8.5 || yval < -8.5) {
            xval = xvalStart;
            yval = yvalStart;
            kval = 90;
        }
        if (kval < 45) {
            kval = 45; // Don't overextend the soccer all
        }
        draw();
        requestAnimationFrame(frame);
    }
}

function setAnimating(run) {
    if (run != animating) {
        animating = run;
        if (animating)
            requestAnimationFrame(frame);
    }
}

//-------------------------------------------------------------------------


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    try {
        var canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("message").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    initGL();
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("message").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context:" + e + "</p>";
        return;
    }
    document.getElementById("animCheck").checked = false;
    document.getElementById("reset").onclick = function () {
        rotator.setView(17, [0, 1, 2]);
        frameNumber = 0;
        // Initialize soccer ball positions
        xval = xvalStart;
        yval = yvalStart;
        animating = false;
        document.getElementById("animCheck").checked = false;
        draw();
    };

    // Not really using all of these
    // As you create your scene use these or create from primitives
    torus = createModel(uvTorus(0.5, 1, 16, 8));   // Create all the basic objects.
    sphere = createModel(uvSphere(1));
    cone = createModel(uvCone(), [0, 0, .5]);
    cylinder = createModel(uvCylinder(), [0, 0, 1.5]);
    disk = createModel(uvCylinder(5.5, 0.5, 64), [0, 0, .25]);
    ring = createModel(ring(3.3, 4.8, 40));
    cube = createModel(cube());

    // This controls the zoom and initial placement
    rotator = new TrackballRotator(canvas, function () {
        if (!animating)
            draw();
    }, 17, [0, 1, 2]);
    draw();
}
