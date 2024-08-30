import { Color, Rapid, GLShader, spriteAttributes, graphicAttributes } from "../dist/rapid.js"
let rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})
let costumUniformValue = 0
const gl = rapid.gl
const plane = await rapid.textures.textureFromUrl("./plane.png")

// Vertex Shader Source Code
const vertexShaderSource = `

precision mediump float;

// Used to display sprite textures, passed by the renderer
attribute vec2 aPosition;
attribute vec2 aRegion;
attribute float aTextureId;
attribute vec4 aColor;

uniform mat4 uProjectionMatrix;
uniform float uCustomUniform; // Custom data transmitted to uniform

varying vec2 vRegion;
varying float vTextureId;
varying vec4 vColor;

void main(void) {
    vRegion = aRegion;
    vTextureId = aTextureId;
    vColor = aColor;

    vec2 position = aPosition;
    if (aRegion.y == 0.0) {
        position.x += uCustomUniform * 20.0;
    }

    gl_Position = uProjectionMatrix * vec4(position, 0.0, 1.0);
    vColor = vec4(0.5, aRegion.x + uCustomUniform, aRegion.y, 1.0);

    gl_Position = uProjectionMatrix * vec4(position, 0.0, 1.0);
}

`;

// Fragment Shader Source Code
const fragmentShaderSource = `
precision mediump float;
uniform sampler2D uTextures[%TEXTURE_NUM%];

varying vec2 vRegion;
varying float vTextureId;
varying vec4 vColor;

void main(void) {
    vec4 color;
    %GET_COLOR%

    gl_FragColor = color*vColor;
}
`;

// If you don't want to display the sprite's texture, then you don't need to add "uniform sampler2D uTextures[%TEXTURE_NUM%];" and "%GET_COLOR%"
// These two will be replaced by rapid for better performance

const customShader = new GLShader(rapid, vertexShaderSource, fragmentShaderSource, spriteAttributes)
// If you want to create a custom shader for graphic, please use graphicAttributes
const render = () => {
    rapid.startRender()

    rapid.renderSprite(plane, 100, 100, {
        shader: customShader,
        uniforms: {
            // Set custom uniform (You can set mat3, vec2, and so on here)
            uCustomUniform: Number(costumUniformValue)
            //  uVec2Uniform: [0,2] // recognized as vec2
            //  uMat3Uniform: [
            //     [0,0,0],
            //     [0,0,0],
            //     [0,0,0],
            //  ]
            // recognized as mat3
        }
    });

    rapid.endRender()
}

const uniformInputDom = document.getElementById("costumUniform")
uniformInputDom.value = costumUniformValue
uniformInputDom.addEventListener("input", (ev) => {
    costumUniformValue = ev.target.value
})

// performance monitor
var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
function animate() {
    stats.begin();
    render()
    stats.end();
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);