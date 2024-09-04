precision mediump float;
varying vec2 vRegion;
varying vec4 vColor;

uniform sampler2D uTexture;
uniform int uUseTexture;

void main(void) {
    if(uUseTexture > 0){
        gl_FragColor = texture2D(uTexture, vRegion) * vColor;
    }else{
        gl_FragColor = vColor;
    }
}
