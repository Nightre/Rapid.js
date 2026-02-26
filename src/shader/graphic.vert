#version 300 es
precision mediump float;

in vec2 aPosition;
in vec4 aColor;
in vec2 aUV;

uniform mat4 u_projection;
uniform vec3 uMatrixRow0; // [a, c, tx]
uniform vec3 uMatrixRow1; // [b, d, ty]

out vec4 vColor;
out vec2 vRegion;

// CUSTOM_CODE

void main(void) {
    vColor = aColor;
    vRegion = aUV;
    vec4 position = vec4(
        dot(uMatrixRow0.xyz, vec3(aPosition.xy, 1.0)), 
        dot(uMatrixRow1.xyz, vec3(aPosition.xy, 1.0)), 
        0.0, 
        1.0
    );
    // CUSTOM_CODE_CALL
    gl_Position = u_projection * position;
}
