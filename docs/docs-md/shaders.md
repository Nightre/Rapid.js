# Shaders

Rapid.js provides a powerful shader system that allows you to create custom visual effects using GLSL (OpenGL Shading Language). This gives you direct access to the GPU for advanced rendering techniques.

## Vertex Shader and Fragment Shader

A vertex shader processes attributes of each vertex, such as position and color, while a fragment shader processes the color of each pixel. Here's a simple example of both:

```js
// Vertex Shader
const vertexShaderSource = `
uniform float uCustomUniform;

void vertex(inout vec2 position, inout vec2 region) {
    if (region.x == 0.0 || region.y == 0.0) {
        position.x += uCustomUniform * 50.0;
        position.y += uCustomUniform * 30.0;
    }
}`

// Fragment Shader
const vertexShaderSource =  `
uniform sampler2D uCatTexture;
uniform float uCustomUniform;

void fragment(inout vec4 color) {
    vec4 catColor = texture2D(uCatTexture, vRegion);
    color = color * catColor;
    color.rgb = color.rgb * 2.0;
}`
```

## Uniforms and Varyings

- **Uniforms** are global variables that remain constant across all vertices and fragments during a render pass
- **Varyings** are variables used to pass data from the vertex shader to the fragment shader

## Setting Uniforms

To set uniform variables for your shader, you need to create a `Uniform` object. Here are all the supported uniform types:

```js
// Create a Uniform object
const uniform = new Uniform({
    // Number type
    uFloat: 1.0,                    // float
    
    // Array types
    uVec2: [1.0, 2.0],             // vec2
    uVec3: [1.0, 2.0, 3.0],        // vec3
    uVec4: [1.0, 2.0, 3.0, 4.0],   // vec4
    
    // Integer arrays
    uIVec2: [1, 2],                // ivec2
    uIVec3: [1, 2, 3],             // ivec3
    uIVec4: [1, 2, 3, 4],          // ivec4
    
    // Matrices
    uMat3: [/*9 floating points*/], // mat3
    uMat4: [/*16 floating points*/],// mat4
    
    // Boolean
    uBool: true,                    // bool
    
    // Texture
    uTexture: textureObject         // sampler2D
});
```

When rendering, you can pass the uniform object to the render function:

```js
rapid.renderSprite({
    texture: myTexture,
    position: pos,
    shader: customShader,
    uniforms: uniform
});
```

### Updating Uniform Values

You can use the `setUniform` method to dynamically update uniform values:

```js
// Update a single uniform value
uniform.setUniform('uFloat', 2.0);
```

## Creating Custom Shaders

Use the `rapid.createCostumShader` method to create custom shaders. The method signature is:

```js
createCostumShader(
    vertexShader: string,
    fragmentShader: string,
    type: ShaderType,
    usedTexture: number
)
```

Parameters:
- `vertexShader`: The GLSL source code for the vertex shader
- `fragmentShader`: The GLSL source code for the fragment shader
- `type`: The shader type, can be either:
  - `ShaderType.SPRITE`: For sprite rendering
  - `ShaderType.GRAPHIC`: For custom graphics rendering
- `usedTexture`: The number of texture units used by the shader (default is 0). This parameter is important for the renderer's optimization.

Example:
```javascript
const customShader = rapid.createCostumShader(
    vertexShaderSource,
    fragmentShaderSource,
    ShaderType.SPRITE,
    1  // Using 1 texture unit
);
```