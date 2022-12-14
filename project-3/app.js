import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { lookAt, flatten, normalMatrix, vec2, vec3, rotateX, rotateY, mult } from "../../libs/MV.js";
import { modelView, loadMatrix, multScale, multTranslation, popMatrix, pushMatrix } from "../../libs/stack.js";

import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js'
import * as TORUS from '../../libs/objects/torus.js'
import * as BUNNY from '../../libs/objects/bunny.js'
import { perspective } from "../libs/MV.js";
import { GUI } from "../libs/dat.gui.module.js";




function setup(shaders) {
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    /**  
     * Mouse
    */
    let angleX = 0;
    let angleY = 0; 
    let lastX = 0;
    let lastY = 0;
    let mouseDown = false; 

    /**
     * GUI Variables
     */
    let options = { backfaceCulling: true, zBuffer: true };

    let camera = {
        fovy: 45,
        near: 0.1,
        far: 40,
        eye: vec3(0.0, 5.0, 10.0),
        at: vec3(0.0, 0.0, 0.0),
        up: vec3(0.0, 1.0, 0.0)
    };

    let lights = [];
    lights.push({   // Starts as spotlight
        position: [0.0, 0.0, 10.0, 1.0],
        intensities: {
            ambient: [50.0, 50.0, 50.0],
            diffuse: [60.0, 60.0, 60.0],
            specular: [200.0, 200.0, 200.0]
        },
        axis: [0.0, 0.0, -1.0],
        aperture: 10,
        cutoff: 10
    });

    lights.push({   // Starts as point light
        position: [5.0, 5.0, 10.0, 1],
        intensities: {
            ambient: [75.0, 75.0, 100.0],
            diffuse: [75.0, 75.0, 100.0],
            specular: [150.0, 150.0, 175.0]
        },
        axis: [-5.0, 5.0, -2.0],
        aperture: 180,
        cutoff: -1
    });

    lights.push({   // Starts as directional light
        position: [-20.0, 5.0, 5.0, 0.0],
        intensities: {
            ambient: [100.0, 75.0, 75.0],
            diffuse: [100.0, 75.0, 75.0],
            specular: [175.0, 150.0, 150.0]
        },
        axis: [20.0, -5.0, -5.0],
        aperture: 180,
        cutoff: -1
    });

    let bunnyMaterial = {
        ka: [150.0, 150.0, 150.0],
        kd: [150.0, 150.0, 150.0],
        ks: [200.0, 200.0, 200.0],
        shininess: 100.0
    }

    /** Other materials */
    let groundMaterial = {
        ka: [150.0, 150.0, 75.0],
        kd: [125.0, 125.0, 125.0],
        ks: [0.0, 0.0, 0.0],
        shininess: 1.0
    };
    let cubeMaterial = {
        ka: [150.0, 75.0, 75.0],
        kd: [150.0, 75.0, 75.0],
        ks: [200.0, 200.0, 200.0],
        shininess: 100.0
    };
    let torusMaterial = {
        ka: [75.0, 150.0, 75.0],
        kd: [75.0, 150.0, 75.0],
        ks: [200.0, 200.0, 200.0],
        shininess: 10.0
    };
    let cylinderMaterial = {
        ka: [75.0, 75.0, 150.0],
        kd: [75.0, 75.0, 150.0],
        ks: [200.0, 200.0, 200.0],
        shininess: 50.0
    };


    /**
     * Graphics User Interface
     */
    const gui = new GUI();

    /**
     * Options - GUI
     */
    let folderOptions = gui.addFolder("options");

    folderOptions.add(options, "backfaceCulling").name("backface culling");
    folderOptions.add(options, "zBuffer").name("depth test");


    /**
     * Camera - GUI
     */
    let folderCamera = gui.addFolder("camera");

    folderCamera.add(camera, "fovy", 1, 179, 1);   
    folderCamera.add(camera, "near", 0.1, 40, 0.1); 
    folderCamera.add(camera, "far", 0.1, 40, 0.1);


    let eyeFolder = folderCamera.addFolder("eye");

    eyeFolder.add(camera.eye, 0).name("x").step(0.1);
    eyeFolder.add(camera.eye, 1).name("y").step(0.1);
    eyeFolder.add(camera.eye, 2).name("z").step(0.1);


    let atFolder = folderCamera.addFolder("at");

    atFolder.add(camera.at, 0).name("x").step(0.1);
    atFolder.add(camera.at, 1).name("y").step(0.1);
    atFolder.add(camera.at, 2).name("z").step(0.1);


    let upFolder = folderCamera.addFolder("up");

    upFolder.add(camera.up, 0, -1, 1, 0.02).name("x");
    upFolder.add(camera.up, 1, -1, 1, 0.02).name("y");
    upFolder.add(camera.up, 2, -1, 1, 0.02).name("z");


    /**
     * Lights - GUI
     */
    let lightsFolder = gui.addFolder("lights");

    for (let i = 0; i < lights.length; i++) {
        let newLightFolder = lightsFolder.addFolder("Light" + (i + 1));

        let positionFolder = newLightFolder.addFolder("position");

        positionFolder.add(lights[i].position, 0).name("x");
        positionFolder.add(lights[i].position, 1).name("y");
        positionFolder.add(lights[i].position, 2).name("z");
        positionFolder.add(lights[i].position, 3).name("w");


        let intensitiesFolder = newLightFolder.addFolder("intensities");

        intensitiesFolder.addColor(lights[i].intensities, "ambient").onChange(function (value) {
            lights[i].intensities.ambient[0] = value[0];
            lights[i].intensities.ambient[1] = value[1];
            lights[i].intensities.ambient[2] = value[2];
        });
        intensitiesFolder.addColor(lights[i].intensities, "diffuse").onChange(function (value) {
            lights[i].intensities.diffuse[0] = value[0];
            lights[i].intensities.diffuse[1] = value[1];
            lights[i].intensities.diffuse[2] = value[2];
        });
        intensitiesFolder.addColor(lights[i].intensities, "specular").onChange(function (value) {
            lights[i].intensities.specular[0] = value[0];
            lights[i].intensities.specular[1] = value[1];
            lights[i].intensities.specular[2] = value[2];
        });


        let axisFolder = newLightFolder.addFolder("axis");

        axisFolder.add(lights[i].axis, 0).name("x").step(0.1);
        axisFolder.add(lights[i].axis, 1).name("y").step(0.1);
        axisFolder.add(lights[i].axis, 2).name("z");    // z cannot be 0

        newLightFolder.add(lights[i], "aperture", 0, 90, 1);
        // Cutoff does not need to be lower than -1 for intended effect in lighting
        newLightFolder.add(lights[i], "cutoff").min(-1); 
    }


    /**
     * Material - GUI
     */
    let materialFolder = gui.addFolder("material");

    materialFolder.addColor(bunnyMaterial, "ka").onChange(function (value) {
        bunnyMaterial.ka[0] = value[0];
        bunnyMaterial.ka[1] = value[1];
        bunnyMaterial.ka[2] = value[2];
    });

    materialFolder.addColor(bunnyMaterial, "kd").onChange(function (value) {
        bunnyMaterial.kd[0] = value[0];
        bunnyMaterial.kd[1] = value[1];
        bunnyMaterial.kd[2] = value[2];
    });

    materialFolder.addColor(bunnyMaterial, "ks").onChange(function (value) {
        bunnyMaterial.ks[0] = value[0];
        bunnyMaterial.ks[1] = value[1];
        bunnyMaterial.ks[2] = value[2];
    });


    materialFolder.add(bunnyMaterial, "shininess");



    /** @type WebGL2RenderingContext */
    let gl = setupWebGL(canvas);

    // Drawing mode (gl.LINES or gl.TRIANGLES)
    let mode = gl.TRIANGLES;

    let program = buildProgramFromSources(gl, shaders["phong.vert"], shaders["phong.frag"]);

    let mProjection = perspective(camera.fovy, aspect, camera.near, camera.far);
    let mView = lookAt(camera.eye, camera.at, camera.up);

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    CUBE.init(gl);
    CYLINDER.init(gl);
    TORUS.init(gl);
    BUNNY.init(gl);

    window.requestAnimationFrame(render);

    canvas.addEventListener("mousedown", function(event) {
        const point = getCursorPosition(canvas, event);
        lastX = point[0];
        lastY = point[1];
        mouseDown = true;
    });

    canvas.addEventListener("mousemove", function(event) {
        const point = getCursorPosition(canvas, event);
        
        if (mouseDown){
            // Rotation speed factor
            // dx and dy are how the x or y in the mouse moved
            const factor = 100/canvas.height;
            const dx = factor * (point[0] - lastX);
            const dy = factor * (point[1] - lastY);

            // update latest angle
            angleX += dy;
            angleY += dx;
        }
        // update last mouse position
        lastX = point[0];
        lastY = point[1];
       
    });

    canvas.addEventListener("mouseup", function(event) {
       mouseDown = false;
      
    });

    function getCursorPosition(canvas, event) {
        const rect = canvas.getBoundingClientRect(); // abs. size of element
        const scaleX = canvas.width / rect.width;    // relationship bitmap vs. element for x
        const scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y

        const x = (event.clientX - rect.left) * scaleX;   // scale mouse coordinates after they have
        const y = (event.clientY - rect.top) * scaleY;     // been adjusted to be relative to element

        return vec2(x,y);
    }

    function resize_canvas(event) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0, 0, canvas.width, canvas.height);
        mProjection = perspective(camera.fovy, aspect, camera.near, camera.far);
    }

    function uploadObject(object) {
        const uKaOfMaterial = gl.getUniformLocation(program, "uMaterial.Ka");    
        const uKdOfMaterial = gl.getUniformLocation(program, "uMaterial.Kd");    
        const uKsOfMaterial = gl.getUniformLocation(program, "uMaterial.Ks"); 
           
        const uShininess = gl.getUniformLocation(program, "uMaterial.shininess");
        
        gl.uniform3fv(uKaOfMaterial, object.ka);
        gl.uniform3fv(uKdOfMaterial, object.kd);
        gl.uniform3fv(uKsOfMaterial, object.ks);

        gl.uniform1f(uShininess, object.shininess);
    }

    function uploadMatrix(name, m) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, flatten(m));
    }

    function uploadLighting() {
        const uNLights = gl.getUniformLocation(program, "uNLights");
        gl.uniform1i(uNLights, lights.length);
        
        for (let i = 0; i < lights.length; i++) {
            const uKaOfLight = gl.getUniformLocation(program, "uLights[" + i + "].ambient");
            const uKdOfLight = gl.getUniformLocation(program, "uLights[" + i + "].diffuse");
            const uKsOfLight = gl.getUniformLocation(program, "uLights[" + i + "].specular");

            const uPosition = gl.getUniformLocation(program, "uLights[" + i + "].position");
            const uAxis = gl.getUniformLocation(program, "uLights[" + i + "].axis");

            const uAperture = gl.getUniformLocation(program, "uLights[" + i + "].aperture");
            
            const uCutoff = gl.getUniformLocation(program, "uLights[" + i + "].cutoff");

            gl.uniform3fv(uKaOfLight, lights[i].intensities.ambient);
            gl.uniform3fv(uKdOfLight, lights[i].intensities.diffuse);
            gl.uniform3fv(uKsOfLight, lights[i].intensities.specular);

            gl.uniform4fv(uPosition, lights[i].position);
            gl.uniform3fv(uAxis, lights[i].axis);

            gl.uniform1f(uAperture, lights[i].aperture);
            gl.uniform1f(uCutoff, lights[i].cutoff);   
        }
    }

    function drawObjects() {
        multTranslation([0, -0.5, 0]);
        // ground
        pushMatrix();
            multScale([10, 0.5, 10]);

            uploadObject(groundMaterial);
            uploadMatrix("mModelView", modelView());
            uploadMatrix("mNormals", normalMatrix(modelView()));
            CUBE.draw(gl, program, mode);
        popMatrix();

        // cube
        pushMatrix();
            // y = 1 = yCube/2
            multTranslation([-2.5, 1, -2.5]);   // left back quandrant
            multScale([2, 2, 2]);

            uploadObject(cubeMaterial);
            uploadMatrix("mModelView", modelView());
            uploadMatrix("mNormals", normalMatrix(modelView()));
            CUBE.draw(gl, program, mode);
        popMatrix();

        // torus
        pushMatrix();
            // y = 0.5 to undo y translation at the start + 0.1 to lift up object
            multTranslation([-2.5, 0.6, 2.5]);    // left front quandrant
            multScale([2, 2, 2]);

            uploadObject(torusMaterial);
            uploadMatrix("mModelView", modelView());
            uploadMatrix("mNormals", normalMatrix(modelView()));
            TORUS.draw(gl, program, mode);
        popMatrix();

        // cylinder
        pushMatrix();
            // y = 1 = yCylinder/2
            multTranslation([2.5, 1, -2.5]);   // right back quandrant
            multScale([2, 2, 2]);

            uploadObject(cylinderMaterial);
            uploadMatrix("mModelView", modelView());
            uploadMatrix("mNormals", normalMatrix(modelView()));
            CYLINDER.draw(gl, program, mode);
        popMatrix();

        // bunny
        // y = 0.25 to move up a little
        multTranslation([2.5, 0.1, 2.5]);  // right front quandrant, 
        multScale([20, 20, 20]);

        uploadObject(bunnyMaterial);
        uploadMatrix("mModelView", modelView());
        uploadMatrix("mNormals", normalMatrix(modelView()));
        BUNNY.draw(gl, program, mode);
    }

    function render() {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        mProjection = perspective(camera.fovy, aspect, camera.near, camera.far);
        // Send the mProjection matrix to the GLSL program
        uploadMatrix("mProjection", mProjection);
        
        // Rotate according to mouse drag
        mView = mult(lookAt(camera.eye, camera.at, camera.up), mult(rotateX(angleX), rotateY(angleY)));

        // Send the mView matrix to the GLSL program
        uploadMatrix("mView", mView);

        // Load the ModelView matrix with the World to Camera (View) matrix
        loadMatrix(mView);

        // Send the lighting information to the GLSL program
        uploadLighting();

        // Draw objects in the scene
        drawObjects();

        /*
         * Enable or disable options
         */
        if (options.backfaceCulling) {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK); // gl.BACK is the default value anyway
        }

        else {
            gl.disable(gl.CULL_FACE);
        }

        if (options.zBuffer) {
            gl.enable(gl.DEPTH_TEST);
        }

        else {
            gl.disable(gl.DEPTH_TEST);
        }
    }
}

const urls = ["phong.vert", "phong.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))