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
varying vec3 fPosition;




void main() {
    // fPosition = camera position
    vec3 V = normalize(-fPosition);
    vec3 N = normalize(fNormal);
    vec3 L;

    vec3 result = vec3(0.0,0.0,0.0);
    for(int i=0; i<MAX_LIGHTS; i++) {
        if(i == uNLights) break;
        // 1.0/65025.0 = 1.0/(255.0*255.0)
        vec3 ambientColor = 1.0/65025.0 * uLights[i].ambient * uMaterial.Ka;
        vec3 diffuseColor = 1.0/65025.0 * uLights[i].diffuse * uMaterial.Kd;
        vec3 specularColor = 1.0/65025.0 * uLights[i].specular * uMaterial.Ks;

        float attenuation;

        

        // compute light vector in camera frame
        if(uLights[i].position.w == 0.0) { // Directional Light
            L = normalize(uLights[i].position.xyz);
        }
            
        else {
            L = normalize(uLights[i].position.xyz - fPosition); // Point light
        }
            
        float diffuseFactor = max( dot(L,N), 0.0 );
        vec3 diffuse = diffuseFactor * diffuseColor;

        vec3 R = reflect(-L,N);
        float specularFactor = pow(max(dot(R,V), 0.0), uMaterial.shininess);
        vec3 specular = specularFactor * specularColor;
        if( dot(L,N) < 0.0 ) {
            specular = vec3(0.0, 0.0, 0.0);
        }


        if(uLights[i].cutoff < 0.0)
            attenuation = 1.0; // não há atenuação
        else {
            vec3 LL = normalize(-uLights[i].axis);
            if(dot(L, LL) < cos(uLights[i].aperture)) // aperture em RAD
            // Fora do cone a atenuação é total
                attenuation = 0.0;
             else
                // dot(L,LL) with both L and LL normalized will be equal to cos(alpha)
                // where alpha is the angle between the two vectors L and LL
                attenuation = pow(dot(L,LL), uLights[i].cutoff);//  de acordo com o que está no enunciado, a partir do cos(alpha)^n ou dot(L,LL)
        }
        //color = ambientColor + (diffuse + specular) * attenuation; // refl calculada a partir de cD e cS, com as propriedades da luz e material, tal como a cA.
        
        result += (ambientColor + (diffuse + specular)*attenuation);
    }
    gl_FragColor = vec4(result,1.0);  //result,1    
}