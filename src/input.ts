import { Vec2 } from "./math";
import Rapid from "./render";
import { Entity } from "./utils";

export class InputManager {
    rapid: Rapid
    canvas: HTMLCanvasElement
    mousePosition: Vec2 = Vec2.ZERO

    // --- 新增属性 ---

    // 记录当前帧被按下的按键 (e.g., "KeyW", "Space", "ArrowUp")
    private keysDown: Set<string> = new Set();
    // 记录上一帧被按下的按键
    private keysDownLastFrame: Set<string> = new Set();

    // 记录当前帧被按下的鼠标按钮 (0: 左键, 1: 中键, 2: 右键)
    private buttonsDown: Set<number> = new Set();
    // 记录上一帧被按下的鼠标按钮
    private buttonsDownLastFrame: Set<number> = new Set();


    constructor(rapid: Rapid) {
        this.rapid = rapid
        this.canvas = rapid.canvas

        this.attachEventListeners();
    }

    /**
     * 附加所有必要的事件监听器
     * @private
     */
    private attachEventListeners(): void {
        const rect = this.canvas.getBoundingClientRect()
        
        // 鼠标移动
        this.canvas.addEventListener('mousemove', (event) => {
            this.mousePosition = this.rapid.cssToGameCoords(event.clientX - rect.left, event.clientY - rect.top);
        });

        // --- 新增事件监听 ---

        // 键盘按下
        window.addEventListener('keydown', (event) => {
            this.keysDown.add(event.code);
        });

        // 键盘松开
        window.addEventListener('keyup', (event) => {
            this.keysDown.delete(event.code);
        });

        // 鼠标按下
        this.canvas.addEventListener('mousedown', (event) => {
            this.buttonsDown.add(event.button);
        });

        // 鼠标松开
        this.canvas.addEventListener('mouseup', (event) => {
            this.buttonsDown.delete(event.button);
        });
    }

    public updateNextFrame(): void {
        this.keysDownLastFrame = new Set(this.keysDown);
        this.buttonsDownLastFrame = new Set(this.buttonsDown);
    }


    /**
     * 检查某个按键当前是否被按下 (持续检测)
     * @param key `event.code` 的值, e.g., "KeyW", "Space"
     */
    isKeyDown(key: string): boolean {
        return this.keysDown.has(key);
    }

    /**
     * 检查某个按键当前是否是松开状态
     * @param key `event.code` 的值
     */
    isKeyUp(key: string): boolean {
        return !this.keysDown.has(key);
    }

    /**
     * 检查某个按键是否在当前帧“刚刚被按下” (单次触发)
     * @param key `event.code` 的值
     */
    wasKeyPressed(key: string): boolean {
        // 当前帧被按下，且上一帧没有被按下
        return this.keysDown.has(key) && !this.keysDownLastFrame.has(key);
    }

    /**
     * 检查某个按键是否在当前帧“刚刚被松开” (单次触发)
     * @param key `event.code` 的值
     */
    wasKeyReleased(key: string): boolean {
        // 当前帧没有被按下，但上一帧被按下了
        return !this.keysDown.has(key) && this.keysDownLastFrame.has(key);
    }


    // --- 鼠标按钮 API ---
    // button: 0=左键, 1=中键, 2=右键

    /**
     * 检查某个鼠标按钮当前是否被按下 (持续检测)
     * @param button 鼠标按钮编号
     */
    isButtonDown(button: number): boolean {
        return this.buttonsDown.has(button);
    }

    /**
     * 检查某个鼠标按钮当前是否是松开状态
     * @param button 鼠标按钮编号
     */
    isButtonUp(button: number): boolean {
        return !this.buttonsDown.has(button);
    }

    /**
     * 检查某个鼠标按钮是否在当前帧“刚刚被按下” (单次触发)
     * @param button 鼠标按钮编号
     */
    wasButtonPressed(button: number): boolean {
        return this.buttonsDown.has(button) && !this.buttonsDownLastFrame.has(button);
    }

    /**
     * 检查某个鼠标按钮是否在当前帧“刚刚被松开” (单次触发)
     * @param button 鼠标按钮编号
     */
    wasButtonReleased(button: number): boolean {
        return !this.buttonsDown.has(button) && this.buttonsDownLastFrame.has(button);
    }

    getMouseLocal(entity: Entity): Vec2 {
        return entity.transform.globalToLocal(this.mousePosition);
    }
}