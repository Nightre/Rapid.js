#version 300 es
precision mediump float;

// per-vertex
in vec2 aVertex;

// per-instance：2x3 仿射矩阵，拆成两个 vec3
in vec3 aMatrixRow0; // [a, c, tx]
in vec3 aMatrixRow1; // [b, d, ty]

// per-instance：UV 区域 (u0, v0, u1, v1)
in vec4 aUVRect;

// per-instance：tint color
in vec4 aColor;

// per-instance：纹理索引
in float aTextureId;

uniform mat4 u_projection;

out vec2 vRegion;
flat out int vTextureId;
out vec4 vColor;

// CUSTOM_CODE

void main(void) {
    //float u = aUVRect.x + aVertex.x * (aUVRect.z - aUVRect.x);
    //float v = aUVRect.y + aVertex.y * (aUVRect.w - aUVRect.y);
    vRegion = mix(aUVRect.xy, aUVRect.zw, aVertex.xy);

    vTextureId = int(aTextureId);
    vColor = aColor;

    vec4 position = vec4(
        dot(aMatrixRow0.xyz, vec3(aVertex.xy, 1.0)), 
        dot(aMatrixRow1.xyz, vec3(aVertex.xy, 1.0)), 
        0.0, 
        1.0
    );
    // CUSTOM_CODE_CALL

    gl_Position = u_projection * position;
}
