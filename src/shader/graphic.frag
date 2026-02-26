#version 300 es
precision mediump float;

in vec4 vColor;
in vec2 vRegion;

uniform sampler2D uTexture;
uniform int uUseTexture;

out vec4 fragColor;

// CUSTOM_CODE

void main(void) {
    if (uUseTexture > 0) {
        fragColor = texture(uTexture, vRegion) * vColor;
    } else {
        fragColor = vColor;
    }
    // CUSTOM_CODE_CALL
}
