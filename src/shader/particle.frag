#version 300 es
precision mediump float;

uniform sampler2D uTexture;

in vec2 vRegion;
in vec4 vColor;
out vec4 fragColor;

// CUSTOM_CODE

void main(void) {
    fragColor = texture(uTexture, vRegion) * vColor;

    // CUSTOM_CODE_CALL
}
