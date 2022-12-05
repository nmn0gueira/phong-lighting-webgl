import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten } from "../../libs/MV.js";
import {modelView, loadMatrix, multRotationX, multRotationY, multRotationZ, multScale, multTranslation, popMatrix, pushMatrix} from "../../libs/stack.js";

import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js'
import { perspective } from "../libs/MV.js";
import { GUI } from "../libs/dat.gui.module.js";




function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    /**
     * Graphics User Interface
     */
    const gui = new GUI();

    /**
     * Options - GUI
     */
    let folderOptions = gui.addFolder("options");
    let options = {backfaceCulling: true, zBuffer: true};
    folderOptions.add(options, "backfaceCulling").name("backface culling");
    folderOptions.add(options, "zBuffer").name("depth test");

    /**
     * Camera - GUI
     */
    let folderCamera = gui.addFolder("camera");
    let camera = {fovy: 45, near: 0.1, far: 40, eye:{x: 0, y:0, z:1}, at: {x:0, y:0, z:0}, up: {x:0, y:1, z:0}};
    folderCamera.add(camera, "fovy", 0, 100, 1);   // PODE SE ALTERAR OS VALORES
    folderCamera.add(camera, "near", 0.1, 1, 0.1); // PODE SE ALTERAR OS VALORES
    folderCamera.add(camera, "far", 20, 40, 1);    // PODE SE ALTERAR OS VALORES

    let eyeFolder = folderCamera.addFolder("eye");
    eyeFolder.add(camera.eye, "x", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES
    eyeFolder.add(camera.eye, "y", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES
    eyeFolder.add(camera.eye, "z", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES

    let atFolder = folderCamera.addFolder("at");
    atFolder.add(camera.at, "x", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES
    atFolder.add(camera.at, "y", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES
    atFolder.add(camera.at, "z", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES

    let upFolder = folderCamera.addFolder("up");
    upFolder.add(camera.up, "x", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES
    upFolder.add(camera.up, "y", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES
    upFolder.add(camera.up, "z", 0, 1, 0.1); // PODE SE ALTERAR OS VALORES

    //FALTA LIGHTS E MATERIAL

    /**
     * 
     */

    /** @type WebGL2RenderingContext */
    let gl = setupWebGL(canvas);

    // Drawing mode (gl.LINES or gl.TRIANGLES)
    let mode = gl.LINES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = perspective(camera.fovy, aspect, camera.near, camera.far);
    let mView = lookAt([0, 0, 1], [0, 0, 0], [0, 1, 0]);
    let zoom = 1.0;

    /** Model parameters */
    let ag = 0;
    let rg = 0;
    let rb = 0;
    let rc = 0;

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function(event) {
        switch(event.key) {
            case '1':
                // Front view
                mView = lookAt([0,0,1], [0,0,0], [0,1,0]);
                break;
            case '2':
                // Top view
                mView = lookAt([0,1,0],  [0,0,0], [0,0,-1]);
                break;
            case '3':
                // Right view
                mView = lookAt([1, 0, 0], [0, 0, 0], [0, 1, 0]);
                break;
            case '4':
                mView = lookAt([2, 1, 1], [0, 0, 0], [0, 1, 0]);
                break;
            case '9':
                mode = gl.LINES; 
                break;
            case '0':
                mode = gl.TRIANGLES;
                break;
            case 'p':
                ag = Math.min(0.050, ag + 0.005);
                break;
            case 'o':
                ag = Math.max(0, ag - 0.005);
                break;
            case 'q':
                rg += 1;
                break;
            case 'e':
                rg -= 1;
                break;
            case 'w':
                rc = Math.min(120, rc+1);
                break;
            case 's':
                rc = Math.max(-120, rc-1);
                break;
            case 'a':
                rb -= 1;
                break;
            case 'd':
                rb += 1;
                break;
            case '+':
                zoom /= 1.1;
                break;
            case '-':
                zoom *= 1.1;
                break;
        }
    }

    gl.clearColor(0.3, 0.3, 0.3, 1.0); // MUDAR ISTO PARA PRETO MAIS A FRENTE
    //gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    //gl.enable(gl.CULL_FACE);      
    //gl.cullFace(gl.BACK);   //initial value of cullFace is GL_BACK
    CUBE.init(gl);
    CYLINDER.init(gl);

    window.requestAnimationFrame(render);


    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = perspective(camera.fovy, aspect, camera.near, camera.far);
    }

    function uploadProjection()
    {
        uploadMatrix("mProjection", mProjection);
    }

    function uploadModelView()
    {
        uploadMatrix("mModelView", modelView());
    }

    function uploadMatrix(name, m) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, flatten(m));
    }

    function UpperArm()
    {
        pushMatrix()
            multScale([0.4, 0.1, 0.4]);
            multTranslation([0, 0.5, 0]);

            uploadModelView();
            CYLINDER.draw(gl, program, mode);
        popMatrix()
        multTranslation([0, 0.1, 0]);
        multScale([0.05, 0.6, 0.05]);
        multTranslation([0, 0.5, 0]);

        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function LowerArmAndClaw()
    {
        multRotationZ(rc);
        pushMatrix();
            LowerArm();
        popMatrix();
        multTranslation([0, 0.45, 0]);
        Claw();
    }

    function LowerArm()
    {
        pushMatrix();
            multScale([0.1, 0.1, 0.05]);
            multRotationX(90);

            uploadModelView();
            CYLINDER.draw(gl, program, mode);
        popMatrix();
        multTranslation([0, 0.05, 0]);
        multScale([0.05, 0.4, 0.05]);
        multTranslation([0, 0.5, 0]);

        uploadModelView();
        CUBE.draw(gl, program, mode);
    }


    function Claw()
    {
        multRotationY(rg)
        // Fist
        pushMatrix();
            multScale([0.2, 0.05, 0.2]);
            multTranslation([0, -0.5, 0]);

            uploadModelView();
            CYLINDER.draw(gl, program, mode);
        popMatrix();
        // Maxilla 1
        pushMatrix();
            multTranslation([ag, 0, 0]);
            multScale([0.02, 0.15, 0.1]);
            multTranslation([0.5, 0.5, 0]);

            uploadModelView();
            CUBE.draw(gl, program, mode);
        popMatrix();
        // Maxilla 2
        multTranslation([-ag, 0, 0]);
        multScale([0.02, 0.15, 0.1]);
        multTranslation([-0.5, 0.5, 0]);

        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function RobotArm() 
    {
        multRotationY(rb);
        pushMatrix();
            UpperArm();
        popMatrix();
        multTranslation([0,0.7,0]);

        multTranslation([0,0.05,0]);
        LowerArmAndClaw();
    }

    function render()
    {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        // Send the mProjection matrix to the GLSL program
        mProjection = perspective(camera.fovy, aspect, camera.near, camera.far);
        uploadProjection();
        mView = lookAt([camera.eye.x, camera.eye.y, camera.eye.z], [camera.at.x, camera.at.y, camera.at.z], [camera.up.x, camera.up.y, camera.up.z]);
        // Load the ModelView matrix with the World to Camera (View) matrix
        loadMatrix(mView);

        //Claw();
        //LowerArm();
        //LowerArmAndClaw();
        //UpperArm();
        pushMatrix();
            multTranslation([0,-0.5,-20]);
            multScale([10, 0.5, 10]);

            uploadModelView();
            CUBE.draw(gl, program, mode);
        popMatrix();
        //RobotArm();
      
        /*
         * Enable or disable options
         */
        if (options.backfaceCulling) {
            //gl.isEnabled(gl.CULL_FACE) ? null : gl.enable(gl.CULL_FACE);
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK); // gl.BACK is the default value anyway
        }

        else {
            //!gl.isEnabled(gl.CULL_FACE) ? null : gl.disable(gl.CULL_FACE);
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

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))