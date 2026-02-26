import { examples, type Example } from './src/index.ts';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import Stats from 'stats.js';

// DOM refs
const exampleListEl = document.getElementById('example-list') as HTMLDivElement;
const codeDisplayEl = document.getElementById('code-display') as HTMLDivElement;
const infoEl = document.getElementById('info') as HTMLSpanElement;
const canvasPanel = document.getElementById('canvas-panel') as HTMLDivElement;
const codePanelHeader = document.getElementById('code-panel-header') as HTMLDivElement;

// State
let currentLoop: ((dt: number) => void) | null = null;
let currentResize: ((w: number, h: number) => void) | null = null;
let currentDestroy: (() => void) | null = null;
let rafId: number | null = null;
let currentExample: Example | null = null;
let isFullscreen = false;

// Stats
const stats = new Stats();
stats.showPanel(0);
stats.dom.style.position = 'absolute';
stats.dom.style.top = '0';
stats.dom.style.left = '0';
canvasPanel.style.position = 'relative';
canvasPanel.appendChild(stats.dom);

// ---- Fullscreen button ----
const fsBtn = document.createElement('button');
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
fsBtn.textContent = '⛶';
fsBtn.title = 'Toggle Fullscreen';
fsBtn.style.cssText = `
    position: absolute; top: 10px; right: 10px; z-index: 100;
    width: 36px; height: 36px; border: none; border-radius: 8px;
    background: rgba(0,0,0,0.5); color: #fff; font-size: 20px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px); transition: all 0.2s;
    border: 1px solid rgba(255,255,255,0.2);
`;
fsBtn.onmouseenter = () => fsBtn.style.background = 'rgba(0,0,0,0.8)';
fsBtn.onmouseleave = () => {
    fsBtn.style.background = isFullscreen ? 'rgba(220,50,50,0.8)' : 'rgba(0,0,0,0.5)';
};
fsBtn.onclick = () => {
    isFullscreen = !isFullscreen;
    if (isFullscreen) {
        // 覆盖整个视口
        canvasPanel.style.cssText = `
            position: fixed; inset: 0; z-index: 9999;
            width: 100vw; height: 100vh;
            display: flex; align-items: center; justify-content: center;
            background: #000;
        `;
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = w;
        canvas.height = h;
        if (currentResize) currentResize(w, h);
        fsBtn.textContent = '✕';
        fsBtn.title = 'Exit Fullscreen';
        fsBtn.style.background = 'rgba(220, 50, 50, 0.8)';
    } else {
        // 恢复原始布局，保留 position:relative 和 fsBtn/stats 所需的定位上下文
        canvasPanel.style.cssText = 'position: relative;';
        canvas.style.width = '';
        canvas.style.height = '';
        canvas.width = 640;
        canvas.height = 480;
        if (currentResize) currentResize(640, 480);
        fsBtn.textContent = '⛶';
        fsBtn.title = 'Toggle Fullscreen';
        fsBtn.style.background = 'rgba(0,0,0,0.5)';
    }
};
canvasPanel.appendChild(fsBtn);

// ---- Loop ----
let lastTime = 0;
function tick(now: number = 0) {
    if (!currentLoop) return;
    const dt = lastTime === 0 ? 1 / 60 : Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    stats.begin();
    currentLoop(dt);
    stats.end();
    rafId = requestAnimationFrame(tick);
}

function stopLoop() {
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    lastTime = 0;
    if (currentDestroy) {
        currentDestroy();
        currentDestroy = null;
    }
    currentLoop = null;
    currentResize = null;
}

// ---- noshow filtering ----
function filterNoshow(code: string): string {
    const lines = code.split('\n');
    const result: string[] = [];
    let hiding = false;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '// noshow start') {
            hiding = true;
            continue;
        }
        if (trimmed === '// noshow end') {
            hiding = false;
            continue;
        }
        if (!hiding) result.push(line);
    }
    // Remove leading/trailing blank lines
    while (result.length && result[0].trim() === '') result.shift();
    while (result.length && result[result.length - 1].trim() === '') result.pop();
    return result.join('\n');
}

// ---- Example loading ----
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderCode(example: Example) {
    const source = filterNoshow(example.code);
    const codeEl = document.createElement('code');
    codeEl.className = 'language-typescript';
    codeEl.innerHTML = escapeHtml(source);
    codeDisplayEl.innerHTML = '';
    codeDisplayEl.appendChild(codeEl);
    hljs.highlightElement(codeEl);
}

function updateCodeHeader() {
    codePanelHeader.innerHTML = '';
    const label = document.createElement('span');
    label.textContent = 'Source Code';
    codePanelHeader.appendChild(label);
}

async function loadExample(example: Example) {
    stopLoop();
    currentExample = example;

    infoEl.textContent = example.name;

    renderCode(example);
    updateCodeHeader();

    // Init and run
    const result = await example.init();
    currentLoop = result.loop;
    currentResize = result.resize || null;
    currentDestroy = result.destroy || null;

    // Apply current FS state to newly loaded example
    if (isFullscreen && currentResize) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        currentResize(w, h);
    } else if (!isFullscreen && currentResize) {
        canvas.width = 640;
        canvas.height = 480;
        currentResize(640, 480);
    }

    tick();
}

// ---- URL query state ----
function getExampleIdx(): number {
    const idx = parseInt(new URLSearchParams(location.search).get('example') || '', 10);
    if (isNaN(idx) || idx < 0 || idx >= examples.length) return 0;
    return idx;
}

function setExampleIdx(idx: number) {
    const params = new URLSearchParams(location.search);
    params.set('example', String(idx));
    history.replaceState(null, '', `${location.pathname}?${params}`);
}

// ---- Sidebar ----
function renderSidebar(activeIdx: number) {
    exampleListEl.innerHTML = '';
    examples.forEach((ex, i) => {
        const el = document.createElement('div');
        el.className = 'example-item';
        el.textContent = ex.name;
        if (i === activeIdx) el.classList.add('active');
        el.onclick = () => {
            if (i === getExampleIdx() && currentLoop) return;
            exampleListEl.querySelectorAll('.example-item').forEach(e => e.classList.remove('active'));
            el.classList.add('active');
            setExampleIdx(i);
            loadExample(ex);
        };
        exampleListEl.appendChild(el);
    });
}

// ---- Boot ----
const idx = getExampleIdx();
renderSidebar(idx);
setExampleIdx(idx);
loadExample(examples[idx]);
