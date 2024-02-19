precision highp float;
uniform sampler2D uTextures[%TEXTURE_NUM%];

uniform vec4 uColor;
varying vec2 vRegion;
varying float vTextureId;

void main(void) {
    vec4 color;
    %GET_COLOR%
    
    gl_FragColor = color;
}