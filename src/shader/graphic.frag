precision mediump float;
varying vec2 vRegion;
varying vec4 vColor;

uniform sampler2D uTexture;
uniform int uUseTexture;

void main(void) {
    vec4 color;
    if(uUseTexture > 0){
        color = texture2D(uTexture, vRegion) * vColor;
    }else{
        color = vColor;
    }
    gl_FragColor = color;
}
