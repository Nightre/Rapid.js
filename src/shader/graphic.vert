precision mediump float;

attribute vec2 aPosition;
attribute vec4 aColor;
varying vec4 vColor;
uniform mat4 uProjectionMatrix;
uniform vec4 uColor;

void main(void) {
    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);
    vColor = aColor;
}
