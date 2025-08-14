import { Color, Rapid, Vec2, ShaderType, Uniform } from "/Rapid.js/dist/rapid.js"

const rapid = new Rapid({
    canvas: document.getElementById("game"),
    backgroundColor: Color.fromHex("ADD8E6")
})

const cat = await rapid.texture.textureFromUrl("./assets/cat.png")
const ground = await rapid.texture.textureFromUrl("./assets/ground.png")

const fbo = rapid.texture.createFrameBufferObject(128, 64)
const renderTexture = await rapid.texture.textureFromFrameBufferObject(fbo)

let time = 0
let catPos = new Vec2(0, 20)

const vertexShaderSource = `
uniform float uCustomUniform;

void vertex(inout vec2 position, inout vec2 region) {

}
`;

const fragmentShaderSource = `
uniform float uTime;
uniform sampler2D uFboTexture;

void fragment(inout vec4 orginColor) {
    vec2 uv = vRegion;
    
    float wave1 = sin(uv.x * 15.0 + uTime * 3.0) * 0.03;
    float wave2 = cos(uv.y * 10.0 + uTime * 2.0) * 0.02;
    float wave3 = sin(uv.x * 5.0 + uv.y * 3.0 + uTime * 1.5) * 0.01;
    
    vec2 distortion = vec2(
        wave1 + wave2 + wave3,
        wave2 + wave3 * 0.5
    );
    
    vec2 distortedUV = uv + distortion;
    vec4 color = texture2D(uFboTexture, distortedUV);
    vec3 waterTint = vec3(0.3, 0.5, 0.8);
    
    float depthFactor = 1.0 - uv.y;
    color.rgb = mix(color.rgb, waterTint, 0.3 + depthFactor * 0.2);
    
    float shimmer = sin(distortedUV.x * 20.0 + uTime * 4.0) * 0.5 + 0.5;
    shimmer = smoothstep(0.7, 1.0, shimmer) * 0.3;
    color.rgb += vec3(shimmer);
    
    color.a *= 0.9;

    orginColor = color;
}
`;
const uniform = new Uniform({
    uTime: 0.6,
    uFboTexture: renderTexture,
})
const customShader = rapid.createCostumShader(vertexShaderSource, fragmentShaderSource, ShaderType.SPRITE, 1)
const render = () => {
    time += 0.01
    uniform.setUniform("uTime", time)
    catPos.x = (Math.sin(time) + 0.5) * 50 + 20
    rapid.startRender()

    rapid.matrixStack.scale(4)
    rapid.drawToFBO(fbo, () => {
        rapid.clear(Color.TRANSPARENT)
        rapid.renderSprite({
            texture: ground,
            position: new Vec2(0, 0),
        })
        rapid.renderSprite({
            texture: cat,
            position: catPos,
        })
    })

    rapid.renderSprite({
        texture: renderTexture,
    })
    rapid.renderSprite({
        texture: renderTexture,
        position: new Vec2(0, 64),
        shader: customShader,
        uniforms: uniform,
        flipY: true,
    })
    rapid.endRender()
}


function animate() {
    render();
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);