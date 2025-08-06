import { Vec2 } from "./math";
import Rapid from "./render";
import { Entity } from "./utils";
export declare class InputManager {
    rapid: Rapid;
    canvas: HTMLCanvasElement;
    mousePosition: Vec2;
    private keysDown;
    private keysDownLastFrame;
    private buttonsDown;
    private buttonsDownLastFrame;
    constructor(rapid: Rapid);
    /**
     * 附加所有必要的事件监听器
     * @private
     */
    private attachEventListeners;
    updateNextFrame(): void;
    /**
     * 检查某个按键当前是否被按下 (持续检测)
     * @param key `event.code` 的值, e.g., "KeyW", "Space"
     */
    isKeyDown(key: string): boolean;
    /**
     * 检查某个按键当前是否是松开状态
     * @param key `event.code` 的值
     */
    isKeyUp(key: string): boolean;
    /**
     * 检查某个按键是否在当前帧“刚刚被按下” (单次触发)
     * @param key `event.code` 的值
     */
    wasKeyPressed(key: string): boolean;
    /**
     * 检查某个按键是否在当前帧“刚刚被松开” (单次触发)
     * @param key `event.code` 的值
     */
    wasKeyReleased(key: string): boolean;
    /**
     * 检查某个鼠标按钮当前是否被按下 (持续检测)
     * @param button 鼠标按钮编号
     */
    isButtonDown(button: number): boolean;
    /**
     * 检查某个鼠标按钮当前是否是松开状态
     * @param button 鼠标按钮编号
     */
    isButtonUp(button: number): boolean;
    /**
     * 检查某个鼠标按钮是否在当前帧“刚刚被按下” (单次触发)
     * @param button 鼠标按钮编号
     */
    wasButtonPressed(button: number): boolean;
    /**
     * 检查某个鼠标按钮是否在当前帧“刚刚被松开” (单次触发)
     * @param button 鼠标按钮编号
     */
    wasButtonReleased(button: number): boolean;
    getMouseLocal(entity: Entity): Vec2;
}
