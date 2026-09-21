import { Vec2 } from "./math";
import type { ITransformOptions } from "./matrix-engine";
import { CanvasScaleMode, type IAppOptions, type Rapid } from "./render";

export enum ExpandMode {
	KEEP_W,
	KEEP_H,
	KEEP,
	IGNORE,
	EXPAND,
	NONE,
}

export interface ICamera extends ITransformOptions {
	limitLeft?: number;
	limitRight?: number;
	limitTop?: number;
	limitBottom?: number;
}

const CAN_EXPAND_DIR = {
	[ExpandMode.EXPAND]: new Vec2(1, 1),
	[ExpandMode.KEEP_W]: new Vec2(0, 1),
	[ExpandMode.KEEP_H]: new Vec2(1, 0),
	[ExpandMode.KEEP]: new Vec2(0, 0),
};

const EXPAND_RATE = {
	[ExpandMode.EXPAND]: new Vec2(0.5, 0.5),
	[ExpandMode.KEEP_W]: new Vec2(0.5, 0),
	[ExpandMode.KEEP_H]: new Vec2(0, 0.5),
	[ExpandMode.KEEP]: new Vec2(0.5, 0.5),
};

interface ScissorViewport {
	x: number;
	y: number;
	width: number;
	height: number;
}

export class ViewPort {
	viewLeft: number = 0;
	viewRight: number = 0;
	viewTop: number = 0;
	viewBottom: number = 0;

	expandMode: ExpandMode = ExpandMode.KEEP;
	scissorViewport: ScissorViewport | null = null;
	resolution: number = 0

	constructor(
		readonly rapid: Rapid,
		options: IAppOptions,
	) {
		this.expandMode = options.expand ?? ExpandMode.KEEP;
	}
	/**
	 * Resizes the canvas, updates internal viewport values, and recreates projection boundaries.
	 * @param logicWidth The new logical display width.
	 * @param logicHeight The new logical display height.
	 * @param cssWidth Optional CSS display width.
	 * @param cssHeight Optional CSS display height.
	 */
	resize(
		logicWidth: number,
		logicHeight: number,
		cssWidth?: number,
		cssHeight?: number,
	): void {
		const rapid = this.rapid;
		rapid.flush();
		const cssW = cssWidth ?? rapid.canvas.clientWidth ?? rapid.canvas.width;
		const cssH =
			cssHeight ?? rapid.canvas.clientHeight ?? rapid.canvas.height;

		if (cssWidth !== undefined) {
			rapid.canvas.style.width = cssW + "px";
		}

		if (cssHeight !== undefined) {
			rapid.canvas.style.height = cssH + "px";
		}

		rapid.physicsWidth = cssW * rapid.dpr;
		rapid.physicsHeight = cssH * rapid.dpr;

		rapid.logicWidth = logicWidth;
		rapid.logicHeight = logicHeight;

		let left = 0;
		let right = logicWidth;
		let bottom = logicHeight;
		let top = 0;

		this.scissorViewport = null;
		switch (this.expandMode) {
			case ExpandMode.IGNORE: {
				left = 0;
				right = logicWidth;
				bottom = logicHeight;
				top = 0;
				break;
			}
			case ExpandMode.NONE: {
				left = 0;
				right = rapid.physicsWidth;
				bottom = rapid.physicsHeight;
				top = 0;
				break;
			}
			case ExpandMode.EXPAND:
			case ExpandMode.KEEP_W:
			case ExpandMode.KEEP_H:
			case ExpandMode.KEEP: {
				const rate = EXPAND_RATE[this.expandMode];
				const expand = CAN_EXPAND_DIR[this.expandMode];

				// 取小的一方
				const scale = Math.min(
					rapid.physicsWidth / logicWidth,
					rapid.physicsHeight / logicHeight,
				);

				// 将 logic 扩充到与 physics 同比例
				const expandedLogicW = rapid.physicsWidth / scale;
				const expandedLogicH = rapid.physicsHeight / scale;

				const deltaW = expandedLogicW - logicWidth;
				const deltaH = expandedLogicH - logicHeight;

				left = -deltaW * rate.x;
				right = logicWidth + deltaW * (1 - rate.x);

				top = -deltaH * rate.y;
				bottom = logicHeight + deltaH * (1 - rate.y);

				if ((!expand.x && deltaW > 0) || (!expand.y && deltaH > 0)) {
					const clipLeft = expand.x && deltaW > 0 ? left : 0;
					const clipRight = expand.x && deltaW > 0 ? right : logicWidth;
					const clipTop = expand.y && deltaH > 0 ? top : 0;
					const clipBottom = expand.y && deltaH > 0 ? bottom : logicHeight;

					this.scissorViewport = {
						x: clipLeft,
						y: clipTop,
						width: clipRight - clipLeft,
						height: clipBottom - clipTop,
					};
				}
				break;
			}
		}

		switch (rapid.scaleMode) {
			case CanvasScaleMode.Viewport:
				// no new pixel
				rapid.canvas.width = logicWidth;
				rapid.canvas.height = logicHeight;
				rapid.canvas.style.imageRendering = "pixelated";
				rapid.gl.viewport(0, 0, logicWidth, logicHeight);
				break;
			case CanvasScaleMode.CanvasItem:
				rapid.canvas.width = rapid.physicsWidth;
				rapid.canvas.height = rapid.physicsHeight;
				rapid.canvas.style.imageRendering = "auto";
				rapid.gl.viewport(
					0,
					0,
					rapid.physicsWidth,
					rapid.physicsHeight,
				);
				break;
			default:
				throw new Error(
					"scaleMode can only be CanvasScaleMode.Viewport or CanvasScaleMode.CanvasItem",
				);
		}

		this.viewLeft = left;
		this.viewRight = right;
		this.viewTop = top;
		this.viewBottom = bottom;
		this.updateProjection();
		this.restoreViewportScissor();
		this.updateResolution()
	}

	private updateResolution(){
		let resolution = 1
		const textureManager = this.rapid.texture
		if (this.rapid.scaleMode !== CanvasScaleMode.Viewport) {
			const viewWidth = this.viewRight - this.viewLeft;
			const viewHeight = this.viewBottom - this.viewTop;

			resolution = Math.max(
				this.rapid.physicsWidth / viewWidth,
				this.rapid.physicsHeight / viewHeight
			);
		}
		if (resolution != this.resolution) {
			this.resolution = resolution
			textureManager.texture.forEach(t => t.updateResolution())
		}
	}

	updateProjection() {
		const rapid = this.rapid;
		rapid.updateProjection(
			this.viewLeft,
			this.viewRight,
			this.viewBottom,
			this.viewTop,
		);
	}

	updateOrthMatrix(
		out: Float32Array,
		left: number,
		right: number,
		bottom: number,
		top: number,
	): void {
		out[0] = 2 / (right - left);
		out[1] = 0;
		out[2] = 0;
		out[3] = 0;
		out[4] = 0;
		out[5] = 2 / (top - bottom);
		out[6] = 0;
		out[7] = 0;
		out[8] = 0;
		out[9] = 0;
		out[10] = -1;
		out[11] = 0;
		out[12] = -(right + left) / (right - left);
		out[13] = -(top + bottom) / (top - bottom);
		out[14] = 0;
		out[15] = 1;
	}

	applyCamera(transform: ICamera) {
		const rapid = this.rapid;

		const matrix = rapid.matrix;
		const stack = rapid.matrixStack;
		const visible =
			this.scissorViewport &&
			rapid.gl.getParameter(rapid.gl.FRAMEBUFFER_BINDING) === null
				? this.scissorViewport
				: null;
		const viewWidth = visible?.width ?? this.viewRight - this.viewLeft;
		const viewHeight = visible?.height ?? this.viewBottom - this.viewTop;
		const centerX = visible
			? visible.x + viewWidth / 2
			: (this.viewLeft + this.viewRight) / 2;
		const centerY = visible
			? visible.y + viewHeight / 2
			: (this.viewTop + this.viewBottom) / 2;

		const worldMatrix = stack.curWorldM;
		const cameraMatrix = matrix.temporary;

		const data = matrix.applyTransform(transform, 0, 0);
		matrix.setMatrix(cameraMatrix, data);

		matrix.clampBounds(
			cameraMatrix,
			viewWidth,
			viewHeight,
			transform.limitLeft,
			transform.limitRight,
			transform.limitTop,
			transform.limitBottom,
		);

		stack.translate(centerX, centerY);
		matrix.invert(cameraMatrix);
		matrix.multiplyOut(worldMatrix, worldMatrix, cameraMatrix);
	}

	/** Clips a rectangle in the current projection's logical coordinates. */
	startScissor(x: number, y: number, width: number, height: number): void {
		const rapid = this.rapid;
		rapid.flush();

		const gl = rapid.gl;
		const clip = this.scissorViewport;
		if (clip && gl.getParameter(gl.FRAMEBUFFER_BINDING) === null) {
			const left = Math.max(Math.min(x, x + width), clip.x);
			const right = Math.min(Math.max(x, x + width), clip.x + clip.width);
			const top = Math.max(Math.min(y, y + height), clip.y);
			const bottom = Math.min(
				Math.max(y, y + height),
				clip.y + clip.height,
			);
			x = left;
			y = top;
			width = Math.max(0, right - left);
			height = Math.max(0, bottom - top);
		}
		const [viewportX, viewportY, viewportW, viewportH] = gl.getParameter(
			gl.VIEWPORT,
		) as Int32Array;
		const projection = rapid.projection;

		const x0 =
			viewportX +
			((projection[0] * x + projection[12] + 1) * viewportW) / 2;
		const x1 =
			viewportX +
			((projection[0] * (x + width) + projection[12] + 1) * viewportW) /
				2;
		const y0 =
			viewportY +
			((projection[5] * y + projection[13] + 1) * viewportH) / 2;
		const y1 =
			viewportY +
			((projection[5] * (y + height) + projection[13] + 1) * viewportH) /
				2;

		const left = Math.round(Math.min(x0, x1));
		const right = Math.round(Math.max(x0, x1));
		const bottom = Math.round(Math.min(y0, y1));
		const top = Math.round(Math.max(y0, y1));

		gl.enable(gl.SCISSOR_TEST);
		gl.scissor(left, bottom, right - left, top - bottom);
	}

	/** Restores the canvas's letterbox clip after a clear or a temporary scissor. */
	restoreViewportScissor(): void {
		this.rapid.flush();
		const gl = this.rapid.gl;
		const clip = this.scissorViewport;
		if (clip && gl.getParameter(gl.FRAMEBUFFER_BINDING) === null) {
			this.startScissor(clip.x, clip.y, clip.width, clip.height);
		} else {
			gl.disable(gl.SCISSOR_TEST);
		}
	}

	endScissor(): void {
		this.restoreViewportScissor();
	}
}
