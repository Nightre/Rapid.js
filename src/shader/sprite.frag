#version 300 es
precision mediump float;

uniform sampler2D uTextures[%TEXTURE_NUM%];

in vec2 vRegion;
flat in int vTextureId;
in vec4 vColor;

in vec2 vUV;
in vec4 vUVRect;

out vec4 fragColor;
in vec2 vPadding;

bool clampUV(vec2 uv) {
    vec2 start = vUVRect.xy + vPadding;
    vec2 end = vUVRect.zw - vPadding;
    return uv.x < start.x || uv.x > end.x || uv.y < start.y || uv.y > end.y;
}

vec4 sampleTexture(vec2 uv) {
    %GET_COLOR%
}

vec4 sampleTextureLocal(vec2 uv){
    vec2 gUV = mix(vUVRect.xy, vUVRect.zw, uv);
    if (clampUV(gUV)) {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }
    return sampleTexture(gUV);
}

// CUSTOM_CODE

void main(void) {
    fragColor = sampleTexture(vRegion);
    if (vPadding.x != 0.0) {
        if (clampUV(vRegion)) {
            fragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
    }

    // CUSTOM_CODE_CALL
}
