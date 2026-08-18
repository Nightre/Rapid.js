# Overview

`Rapid.js` is a WebGL 2D renderer designed for browser games and visualization tools.

Your application handles the game logic, while `Rapid.js` takes care of rendering the graphics onto the screen.

## Design Philosophy

Rapid is designed to closely integrate with your game loop.

You decide when to update states, when to draw objects, and how to structure your game architecture. `Rapid.js` only receives drawing commands and executes rendering as efficiently as possible.

This allows Rapid to be embedded into mini-games, custom game engines, or larger application architectures.

## Basic Frame Workflow

A typical `Rapid.js` rendering frame consists of three steps:

1. Clear the renderer.
2. Submit draw commands.
3. Flush the render queue.

`Rapid.js` does not schedule frames for you, nor does it force you into any specific architecture.
You can integrate it into your own loop, mini-game framework, or a more comprehensive engine structure.
