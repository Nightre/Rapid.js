# 安装

Rapid 可以通过 npm 安装，适合在 Vite、Webpack、Rollup 或其他现代前端工程中使用。

## 安装

```bash
npm install rapid-render
```

如果你使用 yarn 或 pnpm，也可以使用对应的命令：

```bash
yarn add rapid-render
pnpm add rapid-render
```

## 导入

Rapid 使用 ES Module 导出。安装后可以直接从 `rapid-render` 导入需要的 API：

```ts
import { Rapid, Color, Texture, Vec2 } from "rapid-render";
```

通常你至少会用到 `Rapid` 和 `Color`：

```ts
import { Rapid, Color } from "rapid-render";
```

## 浏览器要求

Rapid 基于 WebGL 运行，因此需要一个支持 WebGL 的现代浏览器。

如果浏览器或设备不支持 WebGL，Rapid 将无法正常创建渲染上下文。

## TypeScript

Rapid 使用 TypeScript 编写，并提供类型声明。你不需要额外安装类型包。

```ts
import type { IAppOptions } from "rapid-render";
```

## 下一步

安装完成后，可以继续阅读 **Quick Start**，创建第一个 canvas 并绘制画面。
