#version 300 es
precision mediump float;
uniform sampler2D uTextures[%TEXTURE_NUM%];

in vec2 vRegion;
flat in int vTextureId;
in vec4 vColor;

out vec4 fragColor;

// CUSTOM_CODE

void main(void) {
    %GET_COLOR%

    // CUSTOM_CODE_CALL
}
