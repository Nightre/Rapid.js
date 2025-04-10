# Getting Started with Rapid.js

Rapid.js is a focused WebGL-based 2D rendering engine that provides rendering capabilities only. It does not include any game architecture, state management, physics, or other game-related systems - it's purely a rendering engine. This intentional design choice means you have complete freedom to structure your game however you want. You can use any game architecture (ECS, OOP, functional), any state management solution, or any other patterns and tools of your choice. Rapid.js will handle the rendering while staying completely independent from your game's architecture and logic.

## Installation

```cmd
npm i rapid-render
```

Or use unpkg

```html
<script src="https://unpkg.com/rapid-render/dist/rapid.umd.cjs"></script>
```

## Import

```js
import { Rapid } from "rapid-render"
```

## Basic Setup


All rendering operations must be performed within a render context. This means your rendering code should be placed either:

- Inside a `rapid.render(() => { ... })` callback, or
- Between `rapid.startRender()` and `rapid.endRender()` calls

Attempting to perform rendering operations outside of these contexts will result in errors.

Here's a minimal example to set up Rapid.js:

```javascript
import { Rapid, Color, Vec2 } from "rapid-render"

// Initialize Rapid instance with a canvas element
const rapid = new Rapid({
    canvas: document.getElementById("gameCanvas"),
    backgroundColor: Color.fromHex("FFFFFF")
})

// Start the game loop
function gameLoop() {
    // Method 1: Using render callback (Recommended)
    rapid.render(() => {
        // ✅ All your rendering code goes here
        // For example: rapid.renderSprite(), rapid.renderText(), etc.
    })

    // Method 2: Using manual render boundaries
    // rapid.startRender()
    // ✅ All your rendering code goes here
    // rapid.endRender()
    
    // Request next frame
    requestAnimationFrame(gameLoop)
}

// Start the game loop
gameLoop()
```

## A Simple Example

Here's a complete example that creates a bouncing box:

```javascript
import { Rapid, Color, Vec2 } from "rapid-render"

// Initialize Rapid
const rapid = new Rapid({
    canvas: document.getElementById("gameCanvas"),
    backgroundColor: Color.fromHex("E6F0FF")
})

// Position and velocity
let position = new Vec2(100, 100)
let velocity = new Vec2(2, 2)

function gameLoop() {
    // Update position
    position.x += velocity.x
    position.y += velocity.y
    
    // Simple collision with boundaries
    if (position.x < 0 || position.x > 400) velocity.x *= -1
    if (position.y < 0 || position.y > 400) velocity.y *= -1
    
    // Render
    rapid.render(()=>{
        rapid.renderRect({ 
            offset: position, 
            width: 50, 
            height: 50, 
            color: Color.Red 
        })
    })
    
    requestAnimationFrame(gameLoop)
}

gameLoop()
```
