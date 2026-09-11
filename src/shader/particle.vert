#version 300 es
precision highp float;

// per-vertex
in vec2 aVertex;

// per-instance: 变换
in vec2 aPosition;
in vec2 aScale;
in float aRotation;
in vec2 aOrigin;

// per-instance：UV
in vec4 aUVRect;

// per-instance：tint color
in vec4 aColor;
uniform mat4 u_projection;

out vec2 vRegion;
out vec4 vColor;
// CUSTOM_CODE

void main(void) {
    vColor = aColor;

    vRegion = aUVRect.xy + aVertex * (aUVRect.zw - aUVRect.xy);

    vec2 scaled = (aVertex - aOrigin) * aScale;
    float c = cos(aRotation);
    float s = sin(aRotation);

    vec4 position = vec4(mat2(c, s, -s, c) * scaled + aPosition, 0.0, 1.0);
    // CUSTOM_CODE_CALL

    gl_Position = u_projection * position;
}
