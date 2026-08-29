#version 300 es
precision highp float;

// per-vertex
in vec2 aVertex;

// per-instance: 变换
in vec2 aPosition;
in vec2 aScale;
in float aRotation;
in vec2 aOrigin;

// per-instance：UV 区域 (u0, v0, u1, v1)
in vec4 aUVRect;

// per-instance：tint color
in vec4 aColor;
uniform mat4 u_projection;

out vec2 vRegion;
out vec4 vColor;
// CUSTOM_CODE

void main(void) {
    vColor = aColor;

    //vRegion = mix(aUVRect.xy, aUVRect.zw, vertex.xy);
    vRegion = aUVRect.xy + aVertex * (aUVRect.zw - aUVRect.xy);
    // CUSTOM_CODE_CALL

    vec2 scaled = (aVertex - aOrigin) * aScale;
    float c = cos(aRotation);
    float s = sin(aRotation);

    vec2 v = vec2(
        scaled.x * c - scaled.y * s,
        scaled.x * s + scaled.y * c
    ) + aPosition;

    gl_Position = u_projection * vec4(v, 0.0, 1.0);
}
