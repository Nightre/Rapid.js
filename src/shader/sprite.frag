precision mediump float;
uniform sampler2D uTextures[%TEXTURE_NUM%];

varying vec2 vRegion;
varying float vTextureId;
varying float aColor;

void main(void) {
    vec4 color;
    %GET_COLOR%
    
    gl_FragColor = color;
}