precision highp float;
attribute vec2 aPosition;
attribute vec2 aRegion;
attribute float aTextureId;

uniform mat4 uProjectionMatrix;
varying vec2 vRegion;
varying float vTextureId;

void main(void) {
    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);
    vRegion = aRegion;
    vTextureId = aTextureId;
}