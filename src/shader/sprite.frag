#version 300 es
precision mediump float;

uniform sampler2D uTextures[%TEXTURE_NUM%];

in vec2 vRegion;
flat in int vTextureId;
in vec4 vColor;

in vec4 vUVRect;

out vec4 fragColor;
in vec2 vPadding;

vec4 sampleTexture(vec2 uv) {
    %GET_COLOR%
}

vec4 sampleClampTexture(vec2 uv) {
    vec2 inMin = step(vUVRect.xy, uv);
    vec2 inMax = step(uv, vUVRect.zw);

    float mask = inMin.x * inMin.y * inMax.x * inMax.y;

    return sampleTexture(uv) * mask;
}

vec4 sampleTextureLocal(vec2 uv){
    return sampleClampTexture(mix(vUVRect.xy, vUVRect.zw, uv));
}
// CUSTOM_CODE

void main(void) {
    fragColor = sampleTexture(vRegion) * vColor;

    // CUSTOM_CODE_CALL
}
