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
uniform MaterialInfo uMaterial;       // The material of the object being drawn

//uniform vec3 uColor;

varying vec3 fNormal;
varying vec3 fLight;
varying vec3 fViewer;




void main() {
    
    vec3 V = normalize(fViewer);
    vec3 N = normalize(fNormal);
    vec3 L;

    vec3 result = vec3(0.0,0.0,0.0);
    for(int i=0; i<MAX_LIGHTS; i++) {
        if(i == uNLights) break;
        // 1.0/65025.0 = 1.0/(255.0*255.0)
        vec3 ambientColor = 1.0/65025.0 * uLights[i].ambient * uMaterial.Ka;
        vec3 diffuseColor = 1.0/65025.0 * uLights[i].diffuse * uMaterial.Kd;
        vec3 specularColor = 1.0/65025.0 * uLights[i].specular * uMaterial.Ks;

        

        // compute light vector in camera frame
        if(uLights[i].position.w == 0.0) // luz direcional
            L = normalize(uLights[i].position.xyz);
        else 
            L = normalize(uLights[i].position.xyz + fViewer); // fViewer = -posC  luz pontual


/*if spotlight(if (aperture>0)){ //verifie if aperture >0
    L = normalize(uLights[i].position.xyz + fViewer);// nao sei se tem que ser pontual ou direcional ou ate ambos
   float light=0.0 // intensidade da luz por assim dizer
 
  float dotFromDirection = dot(L, -uLights[i].position.xyz );
  if (dotFromDirection >= aperture) {
    light = dot(N, normalise(uLights[i].position.xyz));
    if (light > 0.0) {// parte do decaimento , acos de dot(..) serve para calcular o angulo
        light *= pow(cos(acos(dot(normalize(uLights[i].position.xyz), normalize (-axis)))),cutoff);
        vec3 diffuse = diffuseFactor * diffuseColor 

        vec3 R = reflect(-L,N);
        float specularFactor = pow(max(dot(R,V), 0.0), uMaterial.shininess);
        vec3 specular = specularFactor * specularColor;
        if( dot(L,N) < 0.0 ) {
            specular = vec3(0.0, 0.0, 0.0);
        }
    
        result += (ambientColor + diffuse + specular);
        result*=light;
    }
  }
      
    }
  }
}

*/

        
        float diffuseFactor = max( dot(L,N), 0.0 );
        vec3 diffuse = diffuseFactor * diffuseColor;

        vec3 R = reflect(-L,N);
        float specularFactor = pow(max(dot(R,V), 0.0), uMaterial.shininess);
        vec3 specular = specularFactor * specularColor;
        if( dot(L,N) < 0.0 ) {
            specular = vec3(0.0, 0.0, 0.0);
        }
    
        result += (ambientColor + diffuse + specular);
    }
    gl_FragColor = vec4(result,1.0);  //result,1    
}