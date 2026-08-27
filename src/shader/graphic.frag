#version 300 es
precision mediump float;

in vec4 vColor;
in vec2 vRegion;
in vec4 vUVRect;

uniform sampler2D uTexture;
uniform int uUseTexture;

out vec4 fragColor;

bool clampUV(vec2 uv) {
    vec2 uvMin = min(vUVRect.xy, vUVRect.zw);
    vec2 uvMax = max(vUVRect.xy, vUVRect.zw);
    return uv.x < uvMin.x || uv.x > uvMax.x || uv.y < uvMin.y || uv.y > uvMax.y;
}

vec4 sampleTexture(vec2 uv) {
    if (uUseTexture > 0) {
        return texture(uTexture, uv);
    }
    return vec4(1,1,1,1);
}

vec4 sampleClampTexture(vec2 uv) {
    if (clampUV(uv)) {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }
    return sampleTexture(uv);
}

vec4 sampleTextureLocal(vec2 uv) {
    vec2 gUV = mix(vUVRect.xy, vUVRect.zw, uv);
    if (clampUV(gUV)) {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }
    return sampleTexture(gUV);
}

// CUSTOM_CODE

void main(void) {
    fragColor = sampleTexture(vRegion) * vColor;
    // CUSTOM_CODE_CALL
}
