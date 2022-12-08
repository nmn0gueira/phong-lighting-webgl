precision highp float;

const int MAX_LIGHTS = 8;

struct LightInfo {
    // Light colour intensities
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    // Light geometry
    vec4 position;  // Position/direction of light (in camera coordinates)
    vec3 axis;      // Where light is pointing to

    // Other light properties
    float aperture; // Opening angle

    float cutoff;   // Decay parameter

};

struct MaterialInfo {
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};

uniform int uNLights; // Effective number of lights used

uniform LightInfo uLights[MAX_LIGHTS]; // The array of lights present in the scene
uniform MaterialInfo uMaterial;        // The material of the object being drawn

uniform mat4 mView;
uniform mat4 mViewNormals;

uniform vec3 uColor;

varying vec3 fNormal;
varying vec3 fLight;
varying vec3 fViewer;



void main() {
    /*
    vec3 V = normalize(fViewer);
    vec3 N = normalize(fNormal);
    vec3 R = reflect(-L,N);

    // compute light vector in camera frame
    if(lightPosition.w == 0.0) 
        L = normalize(lightPosition.xyz);
    else 
        L = normalize(lightPosition.xyz + fViewer); // fViewer = -posC

    float diffuseFactor = max( dot(L,N), 0.0 );
    vec3 diffuse = diffuseFactor * diffuseColor;

    float specularFactor = pow(max(dot(R,V), 0.0), shininess);
    vec3 specular = specularFactor * specularColor;
    if( dot(L,N) < 0.0 ) {
        specular = vec3(0.0, 0.0, 0.0);
    } 
    
    vec3 result = (ambientColor + diffuse + specular) * uColor;*/
    gl_FragColor = vec4(uColor,1.0);  //result,1
    /*
    for(int i=0; i<MAX_LIGHTS; i++) {
    if(i == uNLights) break;     
    // ...
    }
    */
}