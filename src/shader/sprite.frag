#version 300 es
precision mediump float;
uniform sampler2D uTextures[%TEXTURE_NUM%];

in vec2 vRegion;
flat in int vTextureId;
in vec4 vColor;

out vec4 fragColor;

vec4 sampleTexture(vec2 uv) {
    %GET_COLOR%
}

// CUSTOM_CODE

void main(void) {
    fragColor = sampleTexture(vRegion);

    // CUSTOM_CODE_CALL
}
