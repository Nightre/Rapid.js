#version 300 es
precision mediump float;

// per-vertex
in vec2 aVertex;

// per-instance: 变换
in vec2 aPosition;
in vec2 aScale;
in float aRotation;

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

    vec2 v;
    v.x = (aVertex.x) * cos(aRotation) - (aVertex.y) * sin(aRotation);
    v.y = (aVertex.x) * sin(aRotation) + (aVertex.y) * cos(aRotation);
    v = v * aScale + aPosition;
    gl_Position = u_projection * vec4(v, 0.0, 1.0);
}
