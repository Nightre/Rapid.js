import { FLOAT, UNSIGNED_BYTE } from "../webgl/utils"

//                       aPosition  aRegion   aTextureId  aColor
const SPRITE_BYTES_PER_VERTEX = (4 * 2) + (4 * 2) + (4) + (4)
const stride = SPRITE_BYTES_PER_VERTEX
export const spriteAttributes = [
    { name: "aPosition", size: 2, type: FLOAT, stride },
    { name: "aRegion", size: 2, type: FLOAT, stride, offset: 2 * Float32Array.BYTES_PER_ELEMENT },
    { name: "aTextureId", size: 1, type: FLOAT, stride, offset: 4 * Float32Array.BYTES_PER_ELEMENT },
    { name: "aColor", size: 4, type: UNSIGNED_BYTE, stride, offset: 5 * Float32Array.BYTES_PER_ELEMENT, normalized: true },
]

const GRAPHIC_BYTES_PER_VERTEX = 2 * 4 + 4 + 2 * 4
export const graphicAttributes = [
    { name: "aPosition", size: 2, type: FLOAT, stride: GRAPHIC_BYTES_PER_VERTEX },
    { name: "aColor", size: 4, type: UNSIGNED_BYTE, stride: GRAPHIC_BYTES_PER_VERTEX, offset: 2 * Float32Array.BYTES_PER_ELEMENT, normalized: true },
    { name: "aRegion", size: 2, type: FLOAT, stride: GRAPHIC_BYTES_PER_VERTEX, offset: 3 * Float32Array.BYTES_PER_ELEMENT }
]