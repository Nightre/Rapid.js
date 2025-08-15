import { ISound } from "./interface";
import EventEmitter from "eventemitter3";

/**
 * AudioPlayer 发出的事件。
 */
interface AudioPlayerEvents {
  /**
   * 当音频播放结束时触发。
   */
  ended: () => void;
}

/**
 * AudioPlayer 类，用于管理单个音频元素。
 * 封装了 HTMLAudioElement 及其相关的 Web Audio API 节点。
 *
 * @internal 这是一个内部辅助类，通常由 AudioManager 管理。
 */
export class AudioPlayer extends EventEmitter<AudioPlayerEvents> {
    public element: HTMLAudioElement;
    public readonly source: MediaElementAudioSourceNode;
    public readonly gainNode: GainNode;
    private readonly audioContext: AudioContext;
    private readonly boundHandleEnded: () => void;

    /**
     * 创建一个 AudioPlayer 实例。
     * @param audioElement - 要管理的 HTMLAudioElement。
     * @param audioContext - Web Audio API 上下文。
     * @param destinationNode - 此播放器音频应连接到的目标节点（例如主音量控制器）。
     */
    constructor(audioElement: HTMLAudioElement, audioContext: AudioContext, destinationNode: AudioNode) {
        super();
        this.element = audioElement;
        this.audioContext = audioContext;
        
        // 修正：每个 MediaElement 只能创建一个源节点，因此在构造时创建。
        this.source = this.audioContext.createMediaElementSource(this.element);
        this.gainNode = this.audioContext.createGain();

        // 建立音频图：Element -> Source -> Gain -> Destination
        this.source.connect(this.gainNode);
        this.gainNode.connect(destinationNode);

        // 修正：保存 bind 后的函数引用，以便能正确地移除事件监听器。
        this.boundHandleEnded = this.handleEnded.bind(this);
        this.element.addEventListener('ended', this.boundHandleEnded);
    }

    /**
     * 处理 'ended' 事件，当音频播放完成时触发。
     */
    private handleEnded(): void {
        this.emit('ended');
    }

    /**
     * 播放音频。
     * @param loop - 是否循环播放 (默认: false)。
     * @param volume - 本次播放的音量 (0.0 到 1.0, 默认: 1.0)。
     */
    async play(loop: boolean = false, volume: number = 1.0): Promise<void> {
        try {
            // 确保音频上下文在用户交互后处于 running 状态
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            this.element.loop = loop;
            this.setVolume(volume);
            await this.element.play();
        } catch (error) {
            console.error(`播放音频失败:`, this.element.src, error);
        }
    }

    /**
     * 暂停音频。
     */
    pause(): void {
        this.element.pause();
    }

    /**
     * 停止音频并重置播放位置。
     */
    stop(): void {
        this.element.pause();
        this.element.currentTime = 0;
    }

    /**
     * 设置此音频的独立音量。
     * @param volume - 音量大小 (0.0 到 1.0)。
     */
    setVolume(volume: number): void {
        this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }

    /**
     * 清理与此音频相关的资源。
     */
    destroy(): void {
        this.stop();
        this.source.disconnect();
        this.gainNode.disconnect();
        this.element.removeEventListener('ended', this.boundHandleEnded);
        this.removeAllListeners();
    }
}

/**
 * AudioManager 类，用于管理游戏中的所有音频，包括背景音乐(BGM)和音效(SFX)。
 * 实现了音频缓存、分类管理和主音量控制。
 */
class AudioManager {
    private audioContext: AudioContext;
    private sfxCache = new Map<string, AudioPlayer>();
    private bgmCache = new Map<string, AudioPlayer>();
    
    private sfxMasterGain: GainNode;
    private bgmMasterGain: GainNode;

    private currentBgm: AudioPlayer | null = null;

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // 为 SFX 和 BGM 创建独立的主音量控制器
        this.sfxMasterGain = this.audioContext.createGain();
        this.bgmMasterGain = this.audioContext.createGain();

        // 连接到最终输出
        this.sfxMasterGain.connect(this.audioContext.destination);
        this.bgmMasterGain.connect(this.audioContext.destination);
    }

    /**
     * 预加载一组音效资源。
     * @param sounds - 包含音效 id 和 src 的数组。
     * @returns 当所有音效加载完成时解析的 Promise。
     */
    public async preloadSfx(sounds: ISound[]): Promise<void[]> {
        const promises = sounds.map(sound => this.load(sound, this.sfxCache, this.sfxMasterGain));
        return Promise.all(promises);
    }

    /**
     * 预加载一组背景音乐资源。
     * @param sounds - 包含 BGM id 和 src 的数组。
     * @returns 当所有 BGM 加载完成时解析的 Promise。
     */
    public async preloadBgm(sounds: ISound[]): Promise<void[]> {
        const promises = sounds.map(sound => this.load(sound, this.bgmCache, this.bgmMasterGain));
        return Promise.all(promises);
    }

    /**
     * 内部加载函数。
     * @param sound - 要加载的声音对象。
     * @param cache - 用于存储的缓存 Map。
     * @param destinationNode - 音频应连接到的目标节点。
     * @private
     */
    private load(sound: ISound, cache: Map<string, AudioPlayer>, destinationNode: AudioNode): Promise<void> {
        return new Promise((resolve, reject) => {
            if (cache.has(sound.id)) {
                return resolve();
            }

            const audioElement = new Audio();
            audioElement.crossOrigin = "anonymous"; // 支持跨域资源
            audioElement.src = sound.src;

            audioElement.addEventListener('canplaythrough', () => {
                const audioPlayer = new AudioPlayer(audioElement, this.audioContext, destinationNode);
                cache.set(sound.id, audioPlayer);
                resolve();
            }, { once: true }); // 监听一次即可

            audioElement.addEventListener('error', (e) => {
                console.error(`加载音频文件失败: ${sound.src}`);
                reject(e);
            });
        });
    }

    /**
     * 播放音效 (SFX)。
     * @param id - 要播放的音效 ID。
     * @param options - 播放选项。
     * @param options.volume - 本次播放的音量 (0.0 to 1.0)。
     */
    public playSfx(id: string, options: { volume?: number } = {}): void {
        const sfxPlayer = this.sfxCache.get(id);
        if (!sfxPlayer) {
            console.warn(`音效 "${id}" 未找到或未加载。`);
            return;
        }
        // SFX 总是从头开始播放
        sfxPlayer.stop();
        sfxPlayer.play(false, options.volume);
    }

    /**
     * 播放背景音乐 (BGM)。
     * 会自动停止当前正在播放的 BGM。
     * @param id - 要播放的 BGM ID。
     * @param options - 播放选项。
     * @param options.loop - 是否循环 (默认 true)。
     * @param options.volume - 音量 (0.0 to 1.0)。
     */
    public playBgm(id: string, options: { loop?: boolean; volume?: number } = {}): void {
        if (this.currentBgm) {
            this.currentBgm.stop();
        }

        const bgmPlayer = this.bgmCache.get(id);
        if (!bgmPlayer) {
            console.warn(`BGM "${id}" 未找到或未加载。`);
            return;
        }

        this.currentBgm = bgmPlayer;
        const loop = options.loop !== undefined ? options.loop : true;
        this.currentBgm.play(loop, options.volume);
    }
    
    /**
     * 停止当前播放的背景音乐。
     */
    public stopBgm(): void {
        if (this.currentBgm) {
            this.currentBgm.stop();
            this.currentBgm = null;
        }
    }

    /**
     * 设置所有音效的主音量。
     * @param volume - 音量 (0.0 到 1.0)。
     */
    public setSfxVolume(volume: number): void {
        this.sfxMasterGain.gain.value = Math.max(0, Math.min(1, volume));
    }

    /**
     * 设置所有背景音乐的主音量。
     * @param volume - 音量 (0.0 到 1.0)。
     */
    public setBgmVolume(volume: number): void {
        this.bgmMasterGain.gain.value = Math.max(0, Math.min(1, volume));
    }

    /**
     * 销毁 AudioManager，清理所有资源。
     * 在应用退出时调用。
     */
    public destroy(): void {
        this.sfxCache.forEach(player => player.destroy());
        this.bgmCache.forEach(player => player.destroy());
        this.sfxCache.clear();
        this.bgmCache.clear();

        this.sfxMasterGain.disconnect();
        this.bgmMasterGain.disconnect();
        
        if (this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }
}

export default AudioManager;