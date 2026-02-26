#version 300 es
precision mediump float;

in vec2 vRegion;

uniform sampler2D uTexture;
uniform int uUseTexture;

out vec4 fragColor;

void main(void) {
    if (uUseTexture > 0) {
        fragColor = texture(uTexture, vRegion);
    } else {
        fragColor = vec4(1.0);
    }
    if(fragColor.a == 0.0) {
        discard;
    }
}
