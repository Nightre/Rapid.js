import { Color, Rapid, Uniform, Vec2, ShaderType } from "../../dist/rapid.js"

const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})

const plane = await rapid.texture.textureFromUrl("./assets/plane.png")
const cat = await rapid.texture.textureFromUrl("./assets/cat.png")
const stone = await rapid.texture.textureFromUrl("./assets/stone.jpeg")

const graphicPoints = Vec2.FromArray([
    [0, 0],
    [100, 0],
    [125, 50],
    [100, 100],
    [50, 125],
    [0, 100],
]);


const vertexShaderSource = `
uniform float uCustomUniform;
varying vec2 vPosition;

void vertex(inout vec2 position, inout vec2 region) {
    position.x = uCustomUniform * position.y + (1.0 - uCustomUniform) * position.x;
    vPosition = position;
}
`;


const fragmentShaderSource = `
uniform float uCustomUniform;
uniform sampler2D uCatTexture;
varying vec2 vPosition;
void fragment(inout vec4 color) {
    color.r = vPosition.x / 100.0 - uCustomUniform;
    color.b = vPosition.y / 100.0 - uCustomUniform;
}
`;


const customShader = rapid.createCostumShader(vertexShaderSource, fragmentShaderSource, ShaderType.GRAPHIC, 1)
const graphic2UV = Vec2.FromArray([
    [0, 0],
    [1, 0],
    [1, 0.5],
    [1, 1],
    [0.5, 1],
    [0, 1],
]);
const uniform = new Uniform({
    uCustomUniform: 0,
    uCatTexture: cat,
})

let time = 0
const render = () => {
    time += 0.1
    rapid.startRender()

    rapid.renderGraphic({
        offset: new Vec2(50, 50),
        points: graphicPoints,
        shader: customShader,
        uv: graphic2UV,
        texture: stone,
        uniforms: uniform
    });

    rapid.renderSprite({
        texture: plane,
        position: new Vec2(50, 0),
    });
    rapid.renderSprite({
        texture: cat,
        position: new Vec2(100, 0),
    });

    let linePath3 = Array.from({ length: 40 }, (_, i) =>
        new Vec2(i * 10, Math.sin(i * 0.2 + time) * 100)
    );

    rapid.renderLine({
        position: new Vec2(30, 300),
        points: linePath3,
        width: 20,
        color: new Color(0, 50, 50, 155),
        roundCap: true,
        shader: customShader,
        uniforms: uniform
    });

    rapid.endRender()
}



const uniformInputDom = document.getElementById("costumUniform")
uniformInputDom.value = 0
uniformInputDom.addEventListener("input", (ev) => {
    uniform.setUniform('uCustomUniform', Number(ev.target.value))
})


function animate() {
    render()
    requestAnimationFrame(animate);
}



requestAnimationFrame(animate);