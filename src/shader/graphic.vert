precision mediump float;

attribute vec2 aPosition;
attribute vec4 aColor;
attribute vec2 aRegion;

varying vec4 vColor;
uniform mat4 uProjectionMatrix;
uniform vec4 uColor;
varying vec2 vRegion;

void main(void) {
    // vertex s
    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);
    // vertex e
    vColor = aColor;
    vRegion = aRegion;
}
