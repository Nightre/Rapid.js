import { Color, Rapid, Uniform, Vec2, ShaderType } from "/Rapid.js/dist/rapid.js"

const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("FFFFFF")
})

const dog = await rapid.textures.textureFromUrl("./assets/dog.png")
const vegetable = await rapid.textures.textureFromUrl("./assets/vegetable.png")

const vertexShaderSource = `
uniform float uCustomUniform;

void vertex(inout vec2 position, inout vec2 region) {
    if (region.x == 0.0 || region.y == 0.0) {
        position.x += uCustomUniform * 50.0;
        position.y += uCustomUniform * 30.0;
    }
}
`;

const fragmentShaderSource = `
uniform sampler2D uCatTexture;
uniform float uCustomUniform;

void fragment(inout vec4 color) {
    vec4 catColor = texture2D(uCatTexture, vRegion);
    color = color * catColor;
    color.rgb = color.rgb * 2.0;
}
`;

const pos = new Vec2(100, 100)
const customShader = rapid.createCostumShader(vertexShaderSource, fragmentShaderSource, ShaderType.SPRITE, 1)
const uniform = new Uniform({
    uCustomUniform: 1,
    uCatTexture:vegetable,
})
const uniform2 = new Uniform({
    uCustomUniform: -1,
    uCatTexture:vegetable,
})

const render = () => {
    rapid.startRender()

    rapid.renderSprite({
        texture: dog,
        position: pos,
        shader: customShader,
        uniforms: uniform
    });

    rapid.renderSprite({
        texture: dog,
        position: new Vec2(50, 100),
        shader: customShader,
        uniforms: uniform2
    });

    rapid.renderSprite({
        texture: dog,
        position: new Vec2(150, 100),
        shader: customShader,
        uniforms: uniform2
    });

    rapid.renderSprite({
        texture: dog,
        position: new Vec2(50, 0),
    });
    rapid.renderSprite({
        texture: vegetable,
        position: new Vec2(100, 0),
    });

    rapid.endRender()
}

const uniformInputDom = document.getElementById("costumUniform")
uniformInputDom.value = 1
uniformInputDom.addEventListener("input", (ev) => {
    uniform.setUniform('uCustomUniform', Number(ev.target.value))
    uniform2.setUniform('uCustomUniform', -Number(ev.target.value))
})

function animate() {
    render()
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);