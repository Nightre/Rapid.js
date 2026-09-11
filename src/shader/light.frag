
uniform mediump int uLightTextureId[%TEXTURE_NUM%];

uniform sampler2D uNormalMap;
uniform vec2 uResolution;
uniform vec2 uLogicalResolution;
uniform mediump int uLightCount;
uniform vec4 uLightColor[%TEXTURE_NUM%];
uniform mat3x2 uLightMatrix[%TEXTURE_NUM%];
uniform float uLightHeight[%TEXTURE_NUM%];
uniform float uMetallic;
uniform float uRoughness;

void light_fragment(inout vec4 color, in vec2 vRegion) {
    if (color.a < 0.005) return;

    // 屏幕坐标映射到世界坐标
    vec2 worldPos = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) * (uLogicalResolution / uResolution);
    vec3 normal = normalize(texture(uNormalMap, vRegion).rgb * 2.0 - 1.0) * vec3(1.0, -1.0, 1.0);

    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 specColor = mix(vec3(1.0), color.rgb, uMetallic);
    float shininess = exp2((1.0 - uRoughness) * 7.0 + 1.0);

    for (int i = 0; i < %TEXTURE_NUM%; i++) {
        if (i >= uLightCount) break;

        vec2 lightPos = uLightMatrix[i][2];
        mat2 lightBasis = mat2(uLightMatrix[i][0], uLightMatrix[i][1]);
        vec2 lightUV = inverse(lightBasis) * (worldPos - lightPos) + 0.5;

        // 判断当前像素是否在该光源范围内
        if (lightUV.x >= 0.0 && lightUV.x <= 1.0 && lightUV.y >= 0.0 && lightUV.y <= 1.0) {
            
            // ⭐️ 核心修复：sampler2DArray 采样必须传 vec3
            // 第三个分量是该光源对应的图层 ID (转为 float)
            int layer = uLightTextureId[i];
            vec4 lightTex;
            %GET_COLOR%

            vec3 lightDir = normalize(vec3(lightPos - worldPos, uLightHeight[i]));
            float diff = max(dot(normal, lightDir), 0.0);
            float spec = pow(max(dot(normal, normalize(lightDir + viewDir)), 0.0), shininess);
            vec3 attenuation = lightTex.rgb * lightTex.a;

            totalDiffuse += uLightColor[i].rgb * diff * attenuation * (1.0 - uMetallic);
            totalSpecular += specColor * uLightColor[i].rgb * spec * attenuation * color.a;
        }
    }

    // 环境光 + 漫反射 + 高光
    color.rgb = color.rgb * (vec3(0.1, 0.1, 0.15) + totalDiffuse) + totalSpecular;
}
