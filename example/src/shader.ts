import { Color } from '../../src/color.ts';
import { MaskType } from '../../src/render.ts';
import catUrl from '../cat.png';
import cat2Url from '../cat2.png';
import cat3Url from '../cat3.png';
import stickUrl from '../stick.png';
import trUrl from '../tr.png';

// @ts-ignore
export async function init() {
    // noshow start
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const { Rapid } = await import('../../src/render.ts');
    const { CustomGlShader } = await import('../../src/webgl/glshader.ts');
    // noshow end

    const rapid = new Rapid({
        canvas,
        logicWidth: 640,
        logicHeight: 480,
        physicsWidth: 640,
        physicsHeight: 480,
        backgroundColor: new Color(0.05, 0.05, 0.12, 1)
    });

    const [tex1, tex2, tex3, texStick, texTr] = await Promise.all([
        rapid.texture.load(catUrl),
        rapid.texture.load(cat2Url),
        rapid.texture.load(cat3Url),
        rapid.texture.load(stickUrl),
        rapid.texture.load(trUrl),
    ]);

    const customShader = new CustomGlShader(
        `
uniform float u_time;
void vertex(inout vec4 position, inout vec2 region) {
    region.x = 1.0 - region.x;
    if (region.y > 0.5 && region.x > 0.5) {
        position.x += region.y * u_time * 30.0;
    }
}`,
        `
uniform float u_time;
uniform sampler2D u_tex3;
void fragment(inout vec4 color){
    color *= 0.5;
    color += texture(u_tex3, vRegion) * 0.5;
    color.g = vRegion.y * u_time;
}`, 1 // use one texture
    );

    const customShader2 = new CustomGlShader(
        `
void vertex(inout vec4 position, inout vec2 region) {}`,
        `
void fragment(inout vec4 color){
color += 0.2;
color.a = 1.0;
}`
    );

    const renderTexture = rapid.texture.createRenderTexture(128, 64);
    const label = rapid.texture.createTextTexture("Hello World");
    let time = 0;
    customShader.setUniforms({
        "u_tex3": tex3.glTexture!
    });

    return {
        loop(dt: number) {
            rapid.clear();
            const ms = rapid.matrixStack;

            customShader.setUniforms({
                "u_time": Math.sin(time),
            });

            // Label TextTexture
            label.text = "Hello World " + Math.round(time * 10);
            ms.identity();
            ms.translate(10, 200);
            rapid.drawSprite(label);

            // Custom Shader
            ms.identity();
            ms.translate(10, 50);
            rapid.drawSprite(tex1, new Color(255, 255, 0, 255), false, false, customShader);

            // FBO Render Texture
            rapid.enterRenderTexture(renderTexture);
            ms.identity();
            rapid.drawSprite(tex1);
            rapid.leaveRenderTexture();

            ms.identity();
            ms.translate(0, 120);
            rapid.drawSprite(renderTexture, new Color(255, 255, 255, 136), false, false, customShader2);

            // Mask
            ms.identity();
            ms.translate(50, 300);
            rapid.startDrawMask(1, 0xFF);
            rapid.drawMaskImage(tex2);
            rapid.endDrawMask();

            // Use Mask
            rapid.enterMask(time > Math.PI ? MaskType.EQUAL : MaskType.NOT_EQUAL, 1, 0xFF);
            ms.translate(Math.cos(time) * 30 - 32, -32);
            ms.scale(2, 2);
            rapid.drawSprite(tex1);
            rapid.exitMask();

            // 延迟渲染和延迟更新（先建造MatrixStack然后微调再渲染）
            ms.identity()
            const stick1 = ms.save();
            ms.translate(200, 200);
            ms.scale(1.3, 1.3)
            const stick2 = ms.save()
            ms.translate(128, 0);

            rapid.matrix.rotateWithOffset(stick1.local, time, 0, texStick.height / 2)
            rapid.matrix.rotateWithOffset(stick2.local, time * 4, 0, texStick.height / 2)

            ms.updateMatrix(stick1)

            rapid.drawSprite(texStick, Color.White(), false, false, undefined, stick1.world);
            rapid.drawSprite(texStick, Color.White(), false, false, undefined, stick2.world);

            // MatrixStack 普通用法：层级变换（parent → child → grandchild）
            ms.identity();
            ms.save();
            ms.translate(300, 140);
            ms.rotateWithOffset(time, tex1.width / 2, tex1.height / 2);
            rapid.drawSprite(tex1, Color.Red());
            ms.translate(50, 50)
            ms.save();
            ms.scale(Math.sin(time) / 2 + 1, Math.sin(time) / 2 + 1)
            rapid.drawSprite(tex1, Color.Cyan());
            ms.translate(50, 50)
            ms.rotateWithOffset(time * 5, tex1.width / 2, tex1.height / 2);
            rapid.drawSprite(tex1, Color.Brown());
            ms.restore()

            ms.translate(0, 50)
            rapid.drawSprite(tex1, Color.Green());

            ms.restore();

            time += dt * 0.6;
            rapid.flush();
        },
        // noshow start
        resize(w: number, h: number) {
            rapid.resize(w, h, w, h);
        }
        // noshow end
    };
}
