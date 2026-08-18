# Installation

Rapid can be installed via npm and is suitable for use with Vite, Webpack, Rollup, or other modern front-end build tools.

## Installation

```bash
npm install rapid-render
```

If you use yarn or pnpm, you can use the corresponding command:

```bash
yarn add rapid-render
pnpm add rapid-render
```

## Import

Rapid exports ES Modules. After installation, you can import the required APIs directly from `rapid-render`:

```ts
import { Rapid, Color, Texture, Vec2 } from "rapid-render";
```

Typically, you will at least use `Rapid` and `Color`:

```ts
import { Rapid, Color } from "rapid-render";
```

## Browser Requirements

Rapid runs on WebGL, so a modern browser with WebGL support is required.

If the browser or device does not support WebGL, Rapid will be unable to create a rendering context.

## TypeScript

Rapid is written in TypeScript and provides built-in type declarations. You do not need to install additional `@types` packages.

```ts
import type { IAppOptions } from "rapid-render";
```

## Next Steps

Once installed, you can proceed to the **Quick Start** to create your first canvas and render graphics.
