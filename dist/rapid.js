var ScaleRadio = /* @__PURE__ */ ((ScaleRadio2) => {
  ScaleRadio2["KEEP"] = "keep";
  ScaleRadio2["KEEP_H"] = "keep_h";
  ScaleRadio2["KEEP_W"] = "keep_w";
  ScaleRadio2["IGNORE"] = "ignore";
  ScaleRadio2["EXPAND"] = "expand";
  return ScaleRadio2;
})(ScaleRadio || {});
var LineTextureMode = /* @__PURE__ */ ((LineTextureMode2) => {
  LineTextureMode2["STRETCH"] = "stretch";
  LineTextureMode2["REPEAT"] = "repeat";
  return LineTextureMode2;
})(LineTextureMode || {});
var TextureWrapMode = /* @__PURE__ */ ((TextureWrapMode2) => {
  TextureWrapMode2["REPEAT"] = "repeat";
  TextureWrapMode2["CLAMP"] = "clamp";
  TextureWrapMode2["MIRROR"] = "mirror";
  return TextureWrapMode2;
})(TextureWrapMode || {});
var MaskType = /* @__PURE__ */ ((MaskType2) => {
  MaskType2["Include"] = "normal";
  MaskType2["Exclude"] = "inverse";
  return MaskType2;
})(MaskType || {});
var TilemapShape = /* @__PURE__ */ ((TilemapShape2) => {
  TilemapShape2["SQUARE"] = "square";
  TilemapShape2["ISOMETRIC"] = "isometric";
  return TilemapShape2;
})(TilemapShape || {});
var ShaderType = /* @__PURE__ */ ((ShaderType2) => {
  ShaderType2["SPRITE"] = "sprite";
  ShaderType2["GRAPHIC"] = "graphic";
  return ShaderType2;
})(ShaderType || {});
var BlendMode = /* @__PURE__ */ ((BlendMode2) => {
  BlendMode2["Additive"] = "additive";
  BlendMode2["Subtractive"] = "subtractive";
  BlendMode2["Mix"] = "mix";
  return BlendMode2;
})(BlendMode || {});
var ParticleShape = /* @__PURE__ */ ((ParticleShape2) => {
  ParticleShape2["POINT"] = "point";
  ParticleShape2["CIRCLE"] = "circle";
  ParticleShape2["RECT"] = "rect";
  return ParticleShape2;
})(ParticleShape || {});
var BodyType = /* @__PURE__ */ ((BodyType2) => {
  BodyType2["STATIC"] = "static";
  BodyType2["DYNAMIC"] = "dynamic";
  BodyType2["KINEMATIC"] = "kinematic";
  return BodyType2;
})(BodyType || {});
const MATRIX_SIZE = 6;
var ArrayType = /* @__PURE__ */ ((ArrayType2) => {
  ArrayType2[ArrayType2["Float32"] = 0] = "Float32";
  ArrayType2[ArrayType2["Uint32"] = 1] = "Uint32";
  ArrayType2[ArrayType2["Uint16"] = 2] = "Uint16";
  return ArrayType2;
})(ArrayType || {});
class DynamicArrayBuffer {
  constructor(arrayType) {
    this.usedElemNum = 0;
    this.maxElemNum = 512;
    this.bytePerElem = this.getArrayType(arrayType).BYTES_PER_ELEMENT;
    this.arrayType = arrayType;
    this.arraybuffer = new ArrayBuffer(this.maxElemNum * this.bytePerElem);
    this.updateTypedArray();
  }
  getArrayType(arrayType) {
    switch (arrayType) {
      case 0:
        return Float32Array;
      case 1:
        return Uint32Array;
      case 2:
        return Uint16Array;
    }
  }
  updateTypedArray() {
    this.uint32 = new Uint32Array(this.arraybuffer);
    this.float32 = new Float32Array(this.arraybuffer);
    this.uint16 = new Uint16Array(this.arraybuffer);
    switch (this.arrayType) {
      case 0:
        this.typedArray = this.float32;
        break;
      case 1:
        this.typedArray = this.uint32;
        break;
      case 2:
        this.typedArray = this.uint16;
        break;
    }
  }
  clear() {
    this.usedElemNum = 0;
  }
  /**
   * resize the array
   * @param size 
   * @returns 
   */
  resize(size = 0) {
    size += this.usedElemNum;
    if (size > this.maxElemNum) {
      while (size > this.maxElemNum) {
        this.maxElemNum <<= 1;
      }
      this.setMaxSize(this.maxElemNum);
    }
  }
  setMaxSize(size = this.maxElemNum) {
    const data = this.typedArray;
    this.maxElemNum = size;
    this.arraybuffer = new ArrayBuffer(size * this.bytePerElem);
    this.updateTypedArray();
    this.typedArray.set(data);
  }
  pushUint32(value) {
    this.uint32[this.usedElemNum++] = value;
  }
  pushFloat32(value) {
    this.float32[this.usedElemNum++] = value;
  }
  pushUint16(value) {
    this.uint16[this.usedElemNum++] = value;
  }
  /**
   * pop a element
   * @param num 
   */
  pop(num) {
    this.usedElemNum -= num;
  }
  /**
   * get the array
   * @param begin 
   * @param end 
   * @returns 
   */
  getArray(begin = 0, end) {
    if (end == void 0) {
      return this.typedArray;
    }
    return this.typedArray.subarray(begin, end);
  }
  /**
   * length of the array
   */
  get length() {
    return this.usedElemNum;
  }
}
class WebglBufferArray extends DynamicArrayBuffer {
  constructor(gl, arrayType, type = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW) {
    super(arrayType);
    this.dirty = true;
    this.webglBufferSize = 0;
    this.gl = gl;
    this.buffer = gl.createBuffer();
    this.type = type;
    this.usage = usage;
  }
  pushFloat32(value) {
    super.pushFloat32(value);
    this.dirty = true;
  }
  pushUint32(value) {
    super.pushUint32(value);
    this.dirty = true;
  }
  pushUint16(value) {
    super.pushUint16(value);
    this.dirty = true;
  }
  /**
   * bind buffer to gpu
   */
  bindBuffer() {
    this.gl.bindBuffer(this.type, this.buffer);
  }
  /**
   * array data to gpu
   */
  bufferData() {
    if (this.dirty) {
      const gl = this.gl;
      if (this.maxElemNum > this.webglBufferSize) {
        gl.bufferData(this.type, this.getArray(), this.usage);
        this.webglBufferSize = this.maxElemNum;
      } else {
        gl.bufferSubData(this.type, 0, this.getArray(0, this.usedElemNum));
      }
      this.dirty = false;
    }
  }
}
class MatrixStack extends DynamicArrayBuffer {
  constructor() {
    super(
      0
      /* Float32 */
    );
  }
  /**
   * push a matrix to the stack
   */
  pushMat() {
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    this.resize(MATRIX_SIZE);
    this.pushFloat32(arr[offset + 0]);
    this.pushFloat32(arr[offset + 1]);
    this.pushFloat32(arr[offset + 2]);
    this.pushFloat32(arr[offset + 3]);
    this.pushFloat32(arr[offset + 4]);
    this.pushFloat32(arr[offset + 5]);
  }
  /**
   * pop a matrix from the stack
   */
  popMat() {
    this.pop(MATRIX_SIZE);
  }
  /**
   * push a matrix and indentiy it
   */
  pushIdentity() {
    this.resize(MATRIX_SIZE);
    this.pushFloat32(1);
    this.pushFloat32(0);
    this.pushFloat32(0);
    this.pushFloat32(1);
    this.pushFloat32(0);
    this.pushFloat32(0);
  }
  /**
   * Translates the current matrix by the specified x and y values.
   * @param x - The amount to translate horizontally.
   * @param y - The amount to translate vertically.
   */
  translate(x, y) {
    if (typeof x !== "number") {
      return this.translate(x.x, x.y);
    }
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    arr[offset + 4] = arr[offset + 0] * x + arr[offset + 2] * y + arr[offset + 4];
    arr[offset + 5] = arr[offset + 1] * x + arr[offset + 3] * y + arr[offset + 5];
  }
  /**
   * Rotates the current matrix by the specified angle.
   * @param angle - The angle, in radians, to rotate the matrix by.
   */
  rotate(angle) {
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const a = arr[offset + 0];
    const b = arr[offset + 1];
    const c = arr[offset + 2];
    const d = arr[offset + 3];
    arr[offset + 0] = a * cos - b * sin;
    arr[offset + 1] = a * sin + b * cos;
    arr[offset + 2] = c * cos - d * sin;
    arr[offset + 3] = c * sin + d * cos;
  }
  /**
   * Multiplies the current matrix on the top of the stack by a scaling transformation.
   * @param x - The amount to scale the matrix horizontally.
   * @param y - The amount to scale the matrix vertically. If not specified, x is used for both horizontal and vertical scaling.
   */
  scale(x, y) {
    if (typeof x !== "number") {
      return this.scale(x.x, x.y);
    }
    if (!y) y = x;
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    arr[offset + 0] = arr[offset + 0] * x;
    arr[offset + 1] = arr[offset + 1] * x;
    arr[offset + 2] = arr[offset + 2] * y;
    arr[offset + 3] = arr[offset + 3] * y;
  }
  /**
   * Transforms a point by applying the current matrix stack.
   * @returns The transformed point as an array `[newX, newY]`.
   */
  transformPoint(x, y) {
    if (typeof x !== "number") {
      return new Vec2(...this.transformPoint(x.x, x.y));
    }
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    return [
      arr[offset + 0] * x + arr[offset + 2] * y + arr[offset + 4],
      arr[offset + 1] * x + arr[offset + 3] * y + arr[offset + 5]
    ];
  }
  /**
   * Obtain the inverse matrix of the current matrix
   * @returns inverse matrix
   */
  getInverse() {
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    const a = arr[offset + 0];
    const b = arr[offset + 1];
    const c = arr[offset + 2];
    const d = arr[offset + 3];
    const e = arr[offset + 4];
    const f = arr[offset + 5];
    const det = a * d - b * c;
    return new Float32Array([
      d / det,
      -b / det,
      -c / det,
      a / det,
      (c * f - d * e) / det,
      (b * e - a * f) / det
    ]);
  }
  /**
   * Get a copy of the current transformation matrix
   * @returns matrix
   */
  getTransform() {
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    return new Float32Array([
      arr[offset + 0],
      arr[offset + 1],
      arr[offset + 2],
      arr[offset + 3],
      arr[offset + 4],
      arr[offset + 5]
    ]);
  }
  /**
   * Set the current transformation matrix
   * @param array 
   */
  setTransform(array) {
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    arr[offset + 0] = array[0];
    arr[offset + 1] = array[1];
    arr[offset + 2] = array[2];
    arr[offset + 3] = array[3];
    arr[offset + 4] = array[4];
    arr[offset + 5] = array[5];
  }
  /**
   * Get the global position in world space
   * @returns The current matrix position in world space
   */
  getGlobalPosition() {
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    return new Vec2(arr[offset + 4], arr[offset + 5]);
  }
  /**
   * Set the global position in world space
   * @param x - x coordinate or Vec2 object
   * @param y - y coordinate (ignored if first parameter is Vec2)
   */
  setGlobalPosition(x, y) {
    if (typeof x !== "number") {
      this.setGlobalPosition(x.x, x.y);
      return;
    }
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    arr[offset + 4] = x;
    arr[offset + 5] = y;
  }
  /**
   * Get the global rotation angle
   * @returns The current matrix rotation angle in radians
   */
  getGlobalRotation() {
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    return Math.atan2(arr[offset + 1], arr[offset + 0]);
  }
  /**
   * Set the global rotation angle
   * @param angle - rotation angle in radians
   */
  setGlobalRotation(angle) {
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    const scale = this.getGlobalScale();
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    arr[offset + 0] = cos * scale.x;
    arr[offset + 1] = sin * scale.x;
    arr[offset + 2] = -sin * scale.y;
    arr[offset + 3] = cos * scale.y;
  }
  /**
   * Get the global scale
   * @returns The current matrix scale values
   */
  getGlobalScale() {
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    const scaleX = Math.sqrt(arr[offset + 0] * arr[offset + 0] + arr[offset + 1] * arr[offset + 1]);
    const scaleY = Math.sqrt(arr[offset + 2] * arr[offset + 2] + arr[offset + 3] * arr[offset + 3]);
    return new Vec2(scaleX, scaleY);
  }
  /**
   * Set the global scale
   * @param x - x scale or Vec2 object
   * @param y - y scale (ignored if first parameter is Vec2)
   */
  setGlobalScale(x, y) {
    if (typeof x !== "number") {
      this.setGlobalScale(x.x, x.y);
      return;
    }
    const rotation = this.getGlobalRotation();
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    arr[offset + 0] = cos * x;
    arr[offset + 1] = sin * x;
    arr[offset + 2] = -sin * y;
    arr[offset + 3] = cos * y;
  }
  globalToLocal(global) {
    const inv = this.getInverse();
    return new Vec2(
      inv[0] * global.x + inv[2] * global.y + inv[4],
      inv[1] * global.x + inv[3] * global.y + inv[5]
    );
  }
  localToGlobal(local) {
    return this.transformPoint(local);
  }
  /**
   * Convert the current matrix to a CSS transform string
   * @returns CSS transform string representation of the matrix
   */
  toCSSTransform() {
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    return `matrix(${arr[offset + 0]}, ${arr[offset + 1]}, ${arr[offset + 2]}, ${arr[offset + 3]}, ${arr[offset + 4]}, ${arr[offset + 5]})`;
  }
  /**
   * Reset the current matrix to identity matrix
   */
  identity() {
    const offset = this.usedElemNum - MATRIX_SIZE;
    const arr = this.typedArray;
    arr[offset + 0] = 1;
    arr[offset + 1] = 0;
    arr[offset + 2] = 0;
    arr[offset + 3] = 1;
    arr[offset + 4] = 0;
    arr[offset + 5] = 0;
  }
  /**
   * Apply the transform to the current matrix
   * @param transform - The transform to apply
   * @returns offset position
   */
  applyTransform(transform, width = 0, height = 0) {
    if (transform.saveTransform ?? true) {
      this.pushMat();
    }
    transform.afterSave && transform.afterSave();
    const x = transform.x || 0;
    const y = transform.y || 0;
    if (x || y) {
      this.translate(x, y);
    }
    transform.position && this.translate(transform.position);
    transform.rotation && this.rotate(transform.rotation);
    transform.scale && this.scale(transform.scale);
    let offsetX = transform.offsetX || 0;
    let offsetY = transform.offsetY || 0;
    if (transform.offset) {
      offsetX += transform.offset.x;
      offsetY += transform.offset.y;
    }
    const origin = transform.origin;
    if (origin) {
      if (typeof origin == "number") {
        offsetX -= origin * width;
        offsetY -= origin * height;
      } else {
        offsetX -= origin.x * width;
        offsetY -= origin.y * height;
      }
    }
    return {
      offsetX,
      offsetY
    };
  }
  applyTransformAfter(transform) {
    if (transform.beforRestore) {
      transform.beforRestore();
    }
    if (transform.restoreTransform ?? true) {
      this.popMat();
    }
  }
}
class WebglElementBufferArray extends WebglBufferArray {
  constructor(gl, elemVertPerObj, vertexPerObject, maxBatch) {
    super(gl, 2, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
    this.setMaxSize(elemVertPerObj * maxBatch);
    for (let index = 0; index < maxBatch; index++) {
      this.addObject(index * vertexPerObject);
    }
    this.bindBuffer();
    this.bufferData();
  }
  addObject(_vertex) {
  }
}
const _Color = class _Color {
  /**
   * Creates an instance of Color.
   * @param r - The red component (0-255).
   * @param g - The green component (0-255).
   * @param b - The blue component (0-255).
   * @param a - The alpha component (0-255).
   */
  constructor(r, g, b, a = 255) {
    this._r = r;
    this._g = g;
    this._b = b;
    this._a = a;
    this.updateUint();
  }
  /**
   * Gets the red component.
   */
  get r() {
    return this._r;
  }
  /**
   * Sets the red component and updates the uint32 representation.
   * @param value - The new red component (0-255).
   */
  set r(value) {
    this._r = value;
    this.updateUint();
  }
  /**
   * Gets the green component.
   */
  get g() {
    return this._g;
  }
  /**
   * Sets the green component and updates the uint32 representation.
   * @param value - The new green component (0-255).
   */
  set g(value) {
    this._g = value;
    this.updateUint();
  }
  /**
   * Gets the blue component.
   */
  get b() {
    return this._b;
  }
  /**
   * Sets the blue component and updates the uint32 representation.
   * @param value - The new blue component (0-255).
   */
  set b(value) {
    this._b = value;
    this.updateUint();
  }
  /**
   * Gets the alpha component.
   */
  get a() {
    return this._a;
  }
  /**
   * Sets the alpha component and updates the uint32 representation.
   * @param value - The new alpha component (0-255).
   */
  set a(value) {
    this._a = value;
    this.updateUint();
  }
  /**
   * Updates the uint32 representation of the color.
   * @private
   */
  updateUint() {
    this.uint32 = (this._a << 24 | this._b << 16 | this._g << 8 | this._r) >>> 0;
  }
  /**
   * Sets the RGBA values of the color and updates the uint32 representation.
   * @param r - The red component (0-255).
   * @param g - The green component (0-255).
   * @param b - The blue component (0-255).
   * @param a - The alpha component (0-255).
   */
  setRGBA(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    this.updateUint();
  }
  /**
   * Copies the RGBA values from another color.
   * @param color - The color to copy from.
   */
  copy(color) {
    this.setRGBA(color.r, color.g, color.b, color.a);
  }
  /**
   * Clone the current color
   * @returns A new `Color` instance with the same RGBA values.
   */
  clone() {
    return new _Color(this._r, this._g, this._b, this._a);
  }
  /**
   * Converts the color to a hexadecimal string representation (e.g., '#RRGGBBAA').
   * @param includeAlpha - Whether to include the alpha channel in the hex string.
   * @returns The hexadecimal string representation of the color.
   */
  toHexString(includeAlpha = true) {
    const r = this.r.toString(16).padStart(2, "0");
    const g = this.g.toString(16).padStart(2, "0");
    const b = this.b.toString(16).padStart(2, "0");
    const a = this.a.toString(16).padStart(2, "0");
    return `#${r}${g}${b}${includeAlpha ? a : ""}`;
  }
  /**
   * Checks if the current color is equal to another color.
   * @param color - The color to compare with.
   * @returns True if the colors are equal, otherwise false.
   */
  equal(color) {
    return color.r === this.r && color.g === this.g && color.b === this.b && color.a === this.a;
  }
  /**
   * Creates a Color instance from a hexadecimal color string.
   * @param hexString - The hexadecimal color string, e.g., '#RRGGBB' or '#RRGGBBAA'.
   * @returns A new Color instance.
   */
  static fromHex(hexString) {
    if (hexString.startsWith("#")) {
      hexString = hexString.slice(1);
    }
    const r = parseInt(hexString.slice(0, 2), 16);
    const g = parseInt(hexString.slice(2, 4), 16);
    const b = parseInt(hexString.slice(4, 6), 16);
    let a = 255;
    if (hexString.length >= 8) {
      a = parseInt(hexString.slice(6, 8), 16);
    }
    return new _Color(r, g, b, a);
  }
  /**
   * Adds the components of another color to this color, clamping the result to 255.
   * @param color - The color to add.
   * @returns A new Color instance with the result of the addition.
   */
  add(color) {
    return new _Color(
      Math.min(this.r + color.r, 255),
      Math.min(this.g + color.g, 255),
      Math.min(this.b + color.b, 255),
      Math.min(this.a + color.a, 255)
    );
  }
  /**
   * Subtracts the components of another color from this color, clamping the result to 0.
   * @param color - The color to subtract.
   * @returns A new Color instance with the result of the subtraction.
   */
  subtract(color) {
    return new _Color(
      Math.max(0, this.r - color.r),
      // Clamp to 0
      Math.max(0, this.g - color.g),
      // Clamp to 0
      Math.max(0, this.b - color.b),
      // Clamp to 0
      Math.max(0, this.a - color.a)
      // Clamp to 0
    );
  }
  divide(color) {
    if (color instanceof _Color) {
      return new _Color(
        this.r / color.r,
        this.g / color.g,
        this.b / color.b,
        this.a / color.a
      );
    } else {
      return new _Color(
        this.r / color,
        this.g / color,
        this.b / color,
        this.a / color
      );
    }
  }
  multiply(color) {
    if (color instanceof _Color) {
      return new _Color(
        this.r * color.r,
        this.g * color.g,
        this.b * color.b,
        this.a * color.a
      );
    } else {
      return new _Color(
        this.r * color,
        this.g * color,
        this.b * color,
        this.a * color
      );
    }
  }
  clamp() {
    this.r = Math.max(0, Math.min(255, this.r));
    this.g = Math.max(0, Math.min(255, this.g));
    this.b = Math.max(0, Math.min(255, this.b));
    this.a = Math.max(0, Math.min(255, this.a));
  }
};
_Color.Red = new _Color(255, 0, 0, 255);
_Color.Green = new _Color(0, 255, 0, 255);
_Color.Blue = new _Color(0, 0, 255, 255);
_Color.Yellow = new _Color(255, 255, 0, 255);
_Color.Purple = new _Color(128, 0, 128, 255);
_Color.Orange = new _Color(255, 165, 0, 255);
_Color.Pink = new _Color(255, 192, 203, 255);
_Color.Gray = new _Color(128, 128, 128, 255);
_Color.Brown = new _Color(139, 69, 19, 255);
_Color.Cyan = new _Color(0, 255, 255, 255);
_Color.Magenta = new _Color(255, 0, 255, 255);
_Color.Lime = new _Color(192, 255, 0, 255);
_Color.White = new _Color(255, 255, 255, 255);
_Color.Black = new _Color(0, 0, 0, 255);
_Color.TRANSPARENT = new _Color(0, 0, 0, 0);
let Color = _Color;
const _Vec2 = class _Vec2 {
  /**
   * Creates an instance of Vec2.
   * @param x - The x coordinate (default is 0).
   * @param y - The y coordinate (default is 0).
   */
  constructor(x, y) {
    this.x = x !== void 0 ? x : 0;
    this.y = y !== void 0 ? y : 0;
  }
  set(x, y) {
    if (Array.isArray(x)) {
      this.x = x[0];
      this.y = x[1];
    } else if (y !== void 0) {
      this.x = x;
      this.y = y;
    } else {
      this.x = x;
      this.y = x;
    }
    return this;
  }
  /**
   * Adds another vector to this vector.
   * @param v - The vector to add.
   * @returns A new Vec2 instance with the result of the addition.
   */
  add(v) {
    return new _Vec2(this.x + v.x, this.y + v.y);
  }
  /**
   * Subtracts another vector from this vector.
   * @param v - The vector to subtract.
   * @returns A new Vec2 instance with the result of the subtraction.
   */
  subtract(v) {
    return new _Vec2(this.x - v.x, this.y - v.y);
  }
  /**
   * Multiplies the vector by a scalar or another vector.
   * @param f - The scalar value or vector to multiply by.
   * @returns A new Vec2 instance with the result of the multiplication.
   */
  multiply(f) {
    if (f instanceof _Vec2) {
      return new _Vec2(this.x * f.x, this.y * f.y);
    }
    return new _Vec2(this.x * f, this.y * f);
  }
  /**
   * Divides the vector by a scalar or another vector.
   * @param f - The scalar value or vector to divide by.
   * @returns A new Vec2 instance with the result of the division.
   */
  divide(f) {
    if (f instanceof _Vec2) {
      return new _Vec2(this.x / f.x, this.y / f.y);
    }
    return new _Vec2(this.x / f, this.y / f);
  }
  /**
   * Calculates the dot product of this vector with another vector.
   * @param v - The other vector.
   * @returns The dot product result.
   */
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }
  /**
   * Calculates the cross product of this vector with another vector.
   * @param v - The other vector.
   * @returns The cross product result.
   */
  cross(v) {
    return this.x * v.y - this.y * v.x;
  }
  /**
   * Calculates the distance to another point.
   * @param v - The other point.
   * @returns The distance between the two points.
   */
  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  /**
   * Clones the vector.
   * @returns A new Vec2 instance with the same x and y values.
   */
  clone() {
    return new _Vec2(this.x, this.y);
  }
  /**
   * Copy the vector
   * @param vec - The vector to copy.
   */
  copy(vec) {
    this.x = vec.x;
    this.y = vec.y;
  }
  /**
   * Check if the vector is equal to another vector.
   * @param vec - The vector to compare with.
   * @returns True if the vectors are equal, otherwise false.
   */
  equal(vec) {
    return vec.x == this.x && vec.y == this.y;
  }
  /**
   * Rotates the vector 90 degrees counterclockwise.
   * @returns The current instance with updated values.
   */
  perpendicular() {
    const x = this.x;
    this.x = -this.y;
    this.y = x;
    return this;
  }
  /**
   * Inverts the direction of the vector.
   * @returns The current instance with updated values.
   */
  invert() {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }
  /**
   * Calculates the length of the vector.
   * @returns The length of the vector.
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  /**
   * Normalizes the vector to have a length of 1.
   * @returns The current instance with updated values.
   */
  normalize() {
    const mod = this.length();
    this.x = this.x / mod || 0;
    this.y = this.y / mod || 0;
    return this;
  }
  /**
   * Calculates the angle of the vector relative to the x-axis.
   * @returns The angle of the vector.
   */
  angle() {
    return Math.atan2(this.y, this.x);
  }
  /**
   * Calculates the middle point between the current vector and another vector.
   * @param other - The other vector.
   * @returns A new vector representing the middle point between the current vector and the other vector.
   */
  middle(other) {
    return new _Vec2((this.x + other.x) / 2, (this.y + other.y) / 2);
  }
  /**
   * Returns a new vector with the absolute values of the components.
   * @returns A new vector with absolute values.
   */
  abs() {
    return new _Vec2(Math.abs(this.x), Math.abs(this.y));
  }
  /**
   * Returns a new vector with floored components.
   * @returns A new vector with components rounded down to the nearest integer.
   */
  floor() {
    return new _Vec2(Math.floor(this.x), Math.floor(this.y));
  }
  /**
   * Returns a new vector with ceiled components.
   * @returns A new vector with components rounded up to the nearest integer.
   */
  ceil() {
    return new _Vec2(Math.ceil(this.x), Math.ceil(this.y));
  }
  /**
   * Snaps the vector components to the nearest increment.
   * @param increment - The increment to snap to.
   * @returns A new vector with components snapped to the nearest increment.
   */
  snap(increment) {
    return new _Vec2(
      Math.round(this.x / increment) * increment,
      Math.round(this.y / increment) * increment
    );
  }
  /**
   * Converts the vector to a string representation.
   * @returns A string containing the vector's x and y coordinates.
   */
  stringify() {
    return `Vec2(${this.x}, ${this.y})`;
  }
  /**
   * Converts an array of coordinate pairs into an array of Vec2 instances.
   * @param array - An array of [x, y] coordinate pairs.
   * @returns An array of Vec2 instances.
   */
  static FromArray(array) {
    return array.map((pair) => new _Vec2(pair[0], pair[1]));
  }
  static fromAngle(angle) {
    return new _Vec2(Math.cos(angle), Math.sin(angle));
  }
  /**
   * Calculates the angle between two vectors.
   * @param v - The other vector.
   * @returns The angle between the two vectors in radians.
   */
  angleBetween(v) {
    const dotProduct = this.dot(v);
    const magnitudeProduct = this.length() * v.length();
    const cosTheta = Math.max(-1, Math.min(1, dotProduct / magnitudeProduct));
    return Math.acos(cosTheta);
  }
  lerp(target, factor) {
    this.x += (target.x - this.x) * factor;
    this.y += (target.y - this.y) * factor;
    return this;
  }
  addSelf(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  subtractSelf(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
};
_Vec2.ZERO = new _Vec2(0, 0);
_Vec2.ONE = new _Vec2(1, 1);
_Vec2.UP = new _Vec2(0, 1);
_Vec2.DOWN = new _Vec2(0, -1);
_Vec2.LEFT = new _Vec2(-1, 0);
_Vec2.RIGHT = new _Vec2(1, 0);
let Vec2 = _Vec2;
class MathUtils {
  /**
   * Converts degrees to radians.
   * @param degrees - The angle in degrees.
   * @returns The equivalent angle in radians.
   */
  static deg2rad(degrees) {
    return degrees * (Math.PI / 180);
  }
  /**
   * Converts radians to degrees.
   * @param rad - The angle in radians.
   * @returns The equivalent angle in degrees.
   */
  static rad2deg(rad) {
    return rad / (Math.PI / 180);
  }
  /**
   * Normalizes an angle in degrees to be within the range of 0 to 360 degrees.
   * @param degrees - The angle in degrees to be normalized.
   * @returns The normalized angle in degrees.
   */
  static normalizeDegrees(degrees) {
    return (degrees % 360 + 360) % 360;
  }
}
class Random {
  /**
   * 生成指定范围内的随机浮点数
   * @param min - 最小值
   * @param max - 最大值
   * @returns 随机浮点数
   */
  static float(min, max) {
    return Math.random() * (max - min) + min;
  }
  /**
   * 生成指定范围内的随机整数
   * @param min - 最小值
   * @param max - 最大值
   * @returns 随机整数
   */
  static int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  /**
   * 生成随机角度（0-360度）
   * @returns 随机角度（弧度）
   */
  static angle() {
    return Math.random() * Math.PI * 2;
  }
  /**
   * 生成指定范围内的随机向量
   * @param minX - 最小X值
   * @param maxX - 最大X值
   * @param minY - 最小Y值
   * @param maxY - 最大Y值
   * @returns 随机向量
   */
  static vector(minX, maxX, minY, maxY) {
    return new Vec2(
      Random.float(minX, maxX),
      Random.float(minY, maxY)
    );
  }
  /**
   * 生成具有随机方向和指定长度的向量
   * @param length - 向量长度
   * @returns 随机方向向量
   */
  static direction(length) {
    const angle = Random.angle();
    return new Vec2(
      Math.cos(angle) * length,
      Math.sin(angle) * length
    );
  }
  static randomColor(minColor, maxColor) {
    return new Color(
      Random.float(minColor.r, maxColor.r),
      Random.float(minColor.g, maxColor.g),
      Random.float(minColor.b, maxColor.b),
      Random.float(minColor.a, maxColor.a)
    );
  }
  static pick(array) {
    return array[Random.int(0, array.length - 1)];
  }
  static pickWeight(array) {
    if (!array || array.length === 0) {
      return null;
    }
    let totalWeight = 0;
    for (const item of array) {
      totalWeight += item[1];
    }
    const random = Math.random() * totalWeight;
    let currentWeight = 0;
    for (const item of array) {
      currentWeight += item[1];
      if (random <= currentWeight) {
        return item[0];
      }
    }
    return array[array.length - 1][0];
  }
  static scalarOrRange(range, defaultValue) {
    if (range === void 0) {
      return defaultValue;
    }
    if (Array.isArray(range)) {
      if (typeof range[0] === "number") {
        return Random.float(range[0], range[1]);
      } else if (range[0] instanceof Vec2) {
        return Random.vector(range[0].x, range[1].x, range[0].y, range[1].y);
      } else if (range[0] instanceof Color) {
        return Random.randomColor(range[0], range[1]);
      }
    }
    if (typeof range === "number") {
      return range;
    }
    return range.clone();
  }
}
class LightManager {
  constructor(render) {
    this.render = render;
  }
  createLightShadowMaskPolygon(occlusion, lightSource, baseProjectionLength) {
    const occlusionSide = [];
    occlusion.forEach((shape) => {
      for (let i = 0; i < shape.length; i++) {
        const start = shape[i];
        const end = shape[(i + 1) % shape.length];
        occlusionSide.push([start, end]);
      }
    });
    baseProjectionLength = baseProjectionLength || Math.sqrt(Math.pow(this.render.width, 2) + Math.pow(this.render.height, 2));
    const shadowPolygons = [];
    occlusionSide.forEach(([start, end]) => {
      const toStart = new Vec2(start.x - lightSource.x, start.y - lightSource.y);
      const toEnd = new Vec2(end.x - lightSource.x, end.y - lightSource.y);
      const edge = end.subtract(start);
      const normal = edge.perpendicular();
      const rateStart = Math.abs(normal.dot(toStart)) / (normal.length() * toStart.length()) + 0.01;
      const rateEnd = Math.abs(normal.dot(toEnd)) / (normal.length() * toEnd.length()) + 0.01;
      const startProjectionLength = baseProjectionLength / rateStart;
      const endProjectionLength = baseProjectionLength / rateEnd;
      const startRay = new Vec2(toStart.x, toStart.y).normalize();
      const endRay = new Vec2(toEnd.x, toEnd.y).normalize();
      const startProjection = new Vec2(
        start.x + startRay.x * startProjectionLength,
        start.y + startRay.y * startProjectionLength
      );
      const endProjection = new Vec2(
        end.x + endRay.x * endProjectionLength,
        end.y + endRay.y * endProjectionLength
      );
      shadowPolygons.push([
        start,
        end,
        endProjection,
        startProjection
      ]);
    });
    return shadowPolygons;
  }
}
const LINE_ROUND_SEGMENTS = 10;
const addSemicircle = (center, normal, width, isStart) => {
  const result = [];
  const startAngle = isStart ? Math.atan2(normal.y, normal.x) : Math.atan2(-normal.y, -normal.x);
  const totalAngle = Math.PI;
  for (let i = 0; i < LINE_ROUND_SEGMENTS; i++) {
    const t1 = i / LINE_ROUND_SEGMENTS;
    const t2 = (i + 1) / LINE_ROUND_SEGMENTS;
    const angle1 = startAngle + t1 * totalAngle;
    const angle2 = startAngle + t2 * totalAngle;
    const x1 = Math.cos(angle1) * width;
    const y1 = Math.sin(angle1) * width;
    const x2 = Math.cos(angle2) * width;
    const y2 = Math.sin(angle2) * width;
    result.push(center);
    result.push(center.add(new Vec2(x1, y1)));
    result.push(center.add(new Vec2(x2, y2)));
  }
  return result;
};
const getLineNormal = (points, closed = false) => {
  const normals = [];
  if (points.length < 2 || closed && points.length < 3) return { normals, length: 0 };
  const maxMiterLength = 4;
  const epsilon = 1e-3;
  const n = points.length;
  let length = 0;
  if (closed) {
    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      length += p1.distanceTo(p2);
    }
  } else {
    for (let i = 0; i < n - 1; i++) {
      length += points[i].distanceTo(points[i + 1]);
    }
  }
  const calculateNormal = (prev, point, next) => {
    const dirA = point.subtract(prev).normalize();
    const dirB = point.subtract(next).normalize();
    const dot = dirB.dot(dirA);
    if (dot < -1 + epsilon) {
      return { normal: dirA.perpendicular(), miters: 1 };
    } else {
      let miter = dirB.add(dirA).normalize();
      if (dirA.cross(dirB) < 0) miter = miter.multiply(-1);
      let miterLength = 1 / Math.sqrt((1 - dot) / 2);
      return { normal: miter, miters: Math.min(miterLength, maxMiterLength) };
    }
  };
  if (closed) {
    for (let i = 0; i < n - 1; i++) {
      const prev = i === 0 ? points[n - 2] : points[i - 1];
      const point = points[i];
      const next = points[i + 1];
      normals.push(calculateNormal(prev, point, next));
    }
    normals.push(normals[0]);
  } else {
    for (let i = 0; i < n; i++) {
      if (i === 0) {
        const direction = points[1].subtract(points[0]).normalize();
        normals.push({ normal: direction.perpendicular(), miters: 1 });
      } else if (i === n - 1) {
        const direction = points[i].subtract(points[i - 1]).normalize();
        normals.push({ normal: direction.perpendicular(), miters: 1 });
      } else {
        normals.push(calculateNormal(points[i - 1], points[i], points[i + 1]));
      }
    }
  }
  return { normals, length };
};
const getLineGeometry = (options) => {
  const points = options.points;
  if (points.length < 2) return { vertices: [], uv: [] };
  const { normals, length } = getLineNormal(points, options.closed);
  const lineWidth = (options.width || 1) / 2;
  const vertices = [];
  const uv = [];
  const roundCap = options.roundCap || false;
  const textureMode = options.textureMode || LineTextureMode.STRETCH;
  let currentLength = 0;
  const textureWidth = options.texture?.width || 1;
  for (let i = 0; i < points.length - 1; i++) {
    const point = points[i];
    const normal = normals[i].normal;
    const miters = normals[i].miters;
    const top = point.add(normal.multiply(miters * lineWidth));
    const bottom = point.subtract(normal.multiply(miters * lineWidth));
    const nextPoint = points[i + 1];
    const nextNormal = normals[i + 1].normal;
    const nextMiter = normals[i + 1].miters;
    const nextTop = nextPoint.add(nextNormal.multiply(nextMiter * lineWidth));
    const nextBottom = nextPoint.subtract(nextNormal.multiply(nextMiter * lineWidth));
    const segmentLength = point.distanceTo(nextPoint);
    let u1 = 0, u2 = 0;
    if (textureMode === LineTextureMode.STRETCH) {
      u1 = currentLength / length;
      u2 = (currentLength + segmentLength) / length;
    } else {
      u1 = currentLength / textureWidth;
      u2 = u1 + segmentLength / textureWidth;
    }
    const topUv = new Vec2(u1, 0);
    const bottomUv = new Vec2(u1, 1);
    const nextTopUv = new Vec2(u2, 0);
    const nextBottomUv = new Vec2(u2, 1);
    vertices.push(top);
    uv.push(topUv);
    vertices.push(bottom);
    uv.push(bottomUv);
    vertices.push(nextTop);
    uv.push(nextTopUv);
    vertices.push(nextTop);
    uv.push(nextTopUv);
    vertices.push(nextBottom);
    uv.push(nextBottomUv);
    vertices.push(bottom);
    uv.push(bottomUv);
    currentLength += segmentLength;
  }
  if (roundCap && !options.closed) {
    const startPoint = points[0];
    const startNormal = normals[0].normal;
    const startVertices = addSemicircle(startPoint, startNormal, lineWidth, true);
    vertices.push(...startVertices);
    const endPoint = points[points.length - 1];
    const endNormal = normals[points.length - 1].normal;
    const endVertices = addSemicircle(endPoint, endNormal, lineWidth, false);
    vertices.push(...endVertices);
  }
  return { vertices, uv };
};
const fragString$1 = "precision mediump float;varying vec2 vRegion;varying vec4 vColor;uniform sampler2D uTexture;uniform int uUseTexture;void main(void){vec4 color;if(uUseTexture>0){color=texture2D(uTexture,vRegion)*vColor;}else{color=vColor;}gl_FragColor=color;}";
const vertString$1 = "precision mediump float;attribute vec2 aPosition;attribute vec4 aColor;attribute vec2 aRegion;varying vec4 vColor;uniform mat4 uProjectionMatrix;uniform vec4 uColor;varying vec2 vRegion;void main(void){gl_Position=uProjectionMatrix*vec4(aPosition,0.0,1.0);vColor=aColor;vRegion=aRegion;}";
const getContext = (canvas) => {
  const options = { stencil: true };
  const gl = canvas.getContext("webgl2", options) || canvas.getContext("webgl", options);
  if (!gl) {
    throw new Error("Unable to initialize WebGL. Your browser may not support it.");
  }
  return gl;
};
const compileShader = (gl, source, type) => {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Unable to create webgl shader");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compileStatus) {
    const errorLog = gl.getShaderInfoLog(shader);
    console.error("Shader compilation failed:", errorLog);
    throw new Error("Unable to compile shader: " + errorLog + source);
  }
  return shader;
};
const createShaderProgram = (gl, vsSource, fsSource) => {
  var program = gl.createProgram(), vShader = compileShader(gl, vsSource, 35633), fShader = compileShader(gl, fsSource, 35632);
  if (!program) {
    throw new Error("Unable to create program shader");
  }
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linkStatus) {
    const errorLog = gl.getProgramInfoLog(program);
    throw new Error("Unable to link shader program: " + errorLog);
  }
  return program;
};
function createTexture(gl, source, antialias, withSize = false, flipY = false, wrapMode = "clamp") {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("unable to create texture");
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, antialias ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, antialias ? gl.LINEAR : gl.NEAREST);
  let wrapParam;
  switch (wrapMode) {
    case "repeat":
      wrapParam = gl.REPEAT;
      break;
    case "mirror":
      wrapParam = gl.MIRRORED_REPEAT;
      break;
    case "clamp":
    default:
      wrapParam = gl.CLAMP_TO_EDGE;
      break;
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapParam);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapParam);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
  if (withSize) {
    source = source;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, source.width, source.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }
  return texture;
}
function generateFragShader(fs, max) {
  if (fs.includes("%TEXTURE_NUM%")) fs = fs.replace("%TEXTURE_NUM%", max.toString());
  if (fs.includes("%GET_COLOR%")) {
    let code = "";
    for (let index = 0; index < max; index++) {
      if (index == 0) {
        code += `if(vTextureId == ${index}.0)`;
      } else if (index == max - 1) {
        code += `else`;
      } else {
        code += `else if(vTextureId == ${index}.0)`;
      }
      code += `{color = texture2D(uTextures[${index}], vRegion);}`;
    }
    fs = fs.replace("%GET_COLOR%", code);
  }
  return fs;
}
const FLOAT = 5126;
const UNSIGNED_BYTE = 5121;
const fragString = "precision mediump float;uniform sampler2D uTextures[%TEXTURE_NUM%];varying vec2 vRegion;varying float vTextureId;varying vec4 vColor;void main(void){vec4 color;%GET_COLOR%gl_FragColor=color*vColor;}";
const vertString = "precision mediump float;attribute vec2 aPosition;attribute vec2 aRegion;attribute float aTextureId;attribute vec4 aColor;uniform mat4 uProjectionMatrix;varying vec2 vRegion;varying float vTextureId;varying vec4 vColor;void main(void){vRegion=aRegion;vTextureId=aTextureId;vColor=aColor;gl_Position=uProjectionMatrix*vec4(aPosition,0.0,1.0);}";
const SPRITE_BYTES_PER_VERTEX = 4 * 2 + 4 * 2 + 4 + 4;
const stride = SPRITE_BYTES_PER_VERTEX;
const spriteAttributes = [
  { name: "aPosition", size: 2, type: FLOAT, stride },
  { name: "aRegion", size: 2, type: FLOAT, stride, offset: 2 * Float32Array.BYTES_PER_ELEMENT },
  { name: "aTextureId", size: 1, type: FLOAT, stride, offset: 4 * Float32Array.BYTES_PER_ELEMENT },
  { name: "aColor", size: 4, type: UNSIGNED_BYTE, stride, offset: 5 * Float32Array.BYTES_PER_ELEMENT, normalized: true }
];
const GRAPHIC_BYTES_PER_VERTEX = 2 * 4 + 4 + 2 * 4;
const graphicAttributes = [
  { name: "aPosition", size: 2, type: FLOAT, stride: GRAPHIC_BYTES_PER_VERTEX },
  { name: "aColor", size: 4, type: UNSIGNED_BYTE, stride: GRAPHIC_BYTES_PER_VERTEX, offset: 2 * Float32Array.BYTES_PER_ELEMENT, normalized: true },
  { name: "aRegion", size: 2, type: FLOAT, stride: GRAPHIC_BYTES_PER_VERTEX, offset: 3 * Float32Array.BYTES_PER_ELEMENT }
];
class GLShader {
  constructor(rapid, vs, fs, attributes, textureUnitNum = 0) {
    this.attributeLoc = {};
    this.uniformLoc = {};
    this.textureUnitNum = 0;
    this.attributes = [];
    const processedFragmentShaderSource = generateFragShader(fs, rapid.maxTextureUnits - textureUnitNum);
    this.program = createShaderProgram(rapid.gl, vs, processedFragmentShaderSource);
    this.gl = rapid.gl;
    this.textureUnitNum = textureUnitNum;
    this.parseShader(vs);
    this.parseShader(processedFragmentShaderSource);
    if (attributes) {
      this.setAttributes(attributes);
    }
  }
  /**
   * Set the uniform of this shader
   * @param uniforms 
   * @param usedTextureUnit How many texture units have been used
   */
  setUniforms(uniform, region) {
    const gl = this.gl;
    for (const uniformName of uniform.getUnifromNames()) {
      const loc = this.getUniform(uniformName);
      uniform.bind(gl, uniformName, loc, region);
    }
  }
  getUniform(name) {
    return this.uniformLoc[name];
  }
  /**
   * use this shader
   */
  use() {
    this.gl.useProgram(this.program);
  }
  parseShader(shader) {
    const gl = this.gl;
    const attributeMatches = shader.match(/attribute\s+\w+\s+(\w+)/g);
    if (attributeMatches) {
      for (const match of attributeMatches) {
        const name = match.split(" ")[2];
        const loc = gl.getAttribLocation(this.program, name);
        if (loc != -1) this.attributeLoc[name] = loc;
      }
    }
    const uniformMatches = shader.match(/uniform\s+\w+\s+(\w+)/g);
    if (uniformMatches) {
      for (const match of uniformMatches) {
        const name = match.split(" ")[2];
        this.uniformLoc[name] = gl.getUniformLocation(this.program, name);
      }
    }
  }
  /**
   * Set vertex attribute in glsl shader
   * @param element 
   */
  setAttribute(element) {
    const loc = this.attributeLoc[element.name];
    if (typeof loc != "undefined") {
      const gl = this.gl;
      gl.vertexAttribPointer(
        loc,
        element.size,
        element.type,
        element.normalized || false,
        element.stride,
        element.offset || 0
      );
      gl.enableVertexAttribArray(loc);
    }
  }
  /**
   * Set vertex attributes in glsl shader
   * @param elements 
   */
  setAttributes(elements) {
    this.attributes = elements;
    for (const element of elements) {
      this.setAttribute(element);
    }
  }
  updateAttributes() {
    this.setAttributes(this.attributes);
  }
  static createCostumShader(rapid, vs, fs, type, textureUnitNum = 0) {
    let baseFs = {
      [ShaderType.SPRITE]: fragString,
      [ShaderType.GRAPHIC]: fragString$1
    }[type];
    let baseVs = {
      [ShaderType.SPRITE]: vertString,
      [ShaderType.GRAPHIC]: vertString$1
    }[type];
    const attribute = {
      [ShaderType.SPRITE]: spriteAttributes,
      [ShaderType.GRAPHIC]: graphicAttributes
    }[type];
    baseFs = baseFs.replace("void main(void) {", fs + "\nvoid main(void) {");
    baseVs = baseVs.replace("void main(void) {", vs + "\nvoid main(void) {");
    baseFs = baseFs.replace("// fragment", "fragment(color);");
    baseVs = baseVs.replace(
      /\/\/ vertex s[\s\S]*?\/\/ vertex e/,
      `vec2 position = aPosition;
            vertex(position, vRegion);
            gl_Position = uProjectionMatrix * vec4(position, 0.0, 1.0);`
    );
    return new GLShader(rapid, baseVs, baseFs, attribute, textureUnitNum);
  }
}
class RenderRegion {
  constructor(rapid) {
    this.usedTextures = [];
    this.shaders = /* @__PURE__ */ new Map();
    this.isCostumShader = false;
    this.freeTextureUnitNum = 0;
    this.rapid = rapid;
    this.gl = rapid.gl;
    this.webglArrayBuffer = new WebglBufferArray(rapid.gl, ArrayType.Float32, rapid.gl.ARRAY_BUFFER, rapid.gl.STREAM_DRAW);
    this.maxTextureUnits = rapid.maxTextureUnits;
  }
  getTextureUnitList() {
    return Array.from(
      { length: this.maxTextureUnits },
      (_, index) => index
    );
  }
  // setTextureUnits(usedTexture: number) {
  //     return this.MAX_TEXTURE_UNIT_ARRAY.slice(usedTexture, -1)
  // }
  addVertex(x, y, ..._) {
    const [tx, ty] = this.rapid.matrixStack.transformPoint(x, y);
    this.webglArrayBuffer.pushFloat32(tx);
    this.webglArrayBuffer.pushFloat32(ty);
  }
  /**
   * 使用纹理，必须在渲染操作之前
   * @param texture 
   * @returns 
   */
  useTexture(texture) {
    const textureUnit = this.usedTextures.indexOf(texture);
    if (textureUnit == -1) {
      this.usedTextures.push(texture);
      this.freeTextureUnitNum = this.maxTextureUnits - this.usedTextures.length;
      return [this.usedTextures.length - 1, true];
    }
    return [textureUnit, false];
  }
  enterRegion(customShader) {
    this.currentShader = customShader ?? this.getShader("default");
    this.currentShader.use();
    this.initializeForNextRender();
    this.webglArrayBuffer.bindBuffer();
    this.currentShader.updateAttributes();
    this.updateProjection();
    this.isCostumShader = Boolean(customShader);
  }
  updateProjection() {
    this.gl.uniformMatrix4fv(
      this.currentShader.uniformLoc["uProjectionMatrix"],
      false,
      this.rapid.projection
    );
  }
  isUnifromChanged(newCurrentUniform) {
    if (!newCurrentUniform) return false;
    if (this.costumUnifrom != newCurrentUniform) {
      return true;
    } else if (newCurrentUniform?.isDirty) {
      return true;
    }
    return false;
  }
  setCurrentUniform(newCurrentUniform) {
    newCurrentUniform.clearDirty();
    this.costumUnifrom = newCurrentUniform;
  }
  exitRegion() {
  }
  initDefaultShader(vs, fs, attributes) {
    this.setShader("default", vs, fs, attributes);
  }
  setShader(name, vs, fs, attributes) {
    this.webglArrayBuffer.bindBuffer();
    this.shaders.set(name, new GLShader(this.rapid, vs, fs, attributes));
    if (name === "default") {
      this.defaultShader = this.shaders.get(name);
    }
  }
  getShader(name) {
    return this.shaders.get(name);
  }
  render() {
    this.executeRender();
    this.initializeForNextRender();
  }
  executeRender() {
    const gl = this.gl;
    for (let unit = 0; unit < this.usedTextures.length; unit++) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, this.usedTextures[unit]);
    }
    this.webglArrayBuffer.bufferData();
  }
  initializeForNextRender() {
    this.webglArrayBuffer.clear();
    this.usedTextures.length = 0;
    this.isCostumShader = false;
    this.freeTextureUnitNum = this.maxTextureUnits;
  }
  hasPendingContent() {
    return false;
  }
  isShaderChanged(shader) {
    return (shader || this.defaultShader) != this.currentShader;
  }
}
const FLOAT32_PER_VERTEX = 3;
class GraphicRegion extends RenderRegion {
  constructor(rapid) {
    super(rapid);
    this.vertex = 0;
    this.offset = Vec2.ZERO;
    this.drawType = rapid.gl.TRIANGLE_FAN;
    this.setShader("default", vertString$1, fragString$1, graphicAttributes);
  }
  startRender(offsetX, offsetY, texture, uniforms) {
    uniforms && this.currentShader?.setUniforms(uniforms, this);
    this.offset = new Vec2(offsetX, offsetY);
    this.vertex = 0;
    this.webglArrayBuffer.clear();
    if (texture && texture.base) {
      this.texture = this.useTexture(texture.base.texture)[0];
    }
  }
  addVertex(x, y, u, v, color) {
    this.webglArrayBuffer.resize(FLOAT32_PER_VERTEX);
    super.addVertex(x + this.offset.x, y + this.offset.y);
    this.webglArrayBuffer.pushUint32(color);
    this.webglArrayBuffer.pushFloat32(u);
    this.webglArrayBuffer.pushFloat32(v);
    this.vertex += 1;
  }
  executeRender() {
    super.executeRender();
    const gl = this.gl;
    gl.uniform1i(this.currentShader.uniformLoc["uUseTexture"], typeof this.texture == "undefined" ? 0 : 1);
    if (this.texture) {
      gl.uniform1i(this.currentShader.uniformLoc["uTexture"], this.texture);
    }
    gl.drawArrays(this.drawType, 0, this.vertex);
    this.drawType = this.rapid.gl.TRIANGLE_FAN;
    this.vertex = 0;
    this.texture = void 0;
  }
}
const INDEX_PER_SPRITE = 6;
const VERTEX_PER_SPRITE = 4;
const SPRITE_ELMENT_PER_VERTEX = 5;
const FLOAT32_PER_SPRITE = VERTEX_PER_SPRITE * SPRITE_ELMENT_PER_VERTEX;
const MAX_BATCH = Math.floor(2 ** 16 / VERTEX_PER_SPRITE);
class SpriteElementArray extends WebglElementBufferArray {
  constructor(gl, max) {
    super(gl, INDEX_PER_SPRITE, VERTEX_PER_SPRITE, max);
  }
  addObject(vertex) {
    super.addObject();
    this.pushUint16(vertex);
    this.pushUint16(vertex + 1);
    this.pushUint16(vertex + 2);
    this.pushUint16(vertex);
    this.pushUint16(vertex + 3);
    this.pushUint16(vertex + 2);
  }
}
class SpriteRegion extends RenderRegion {
  constructor(rapid) {
    const gl = rapid.gl;
    super(rapid);
    this.batchSprite = 0;
    this.spriteTextureUnits = [];
    this.spriteTextureUnitIndexOffset = 0;
    this.setShader("default", vertString, fragString, spriteAttributes);
    this.indexBuffer = new SpriteElementArray(gl, MAX_BATCH);
  }
  addVertex(x, y, u, v, textureUnit, color) {
    super.addVertex(x, y);
    this.webglArrayBuffer.pushFloat32(u);
    this.webglArrayBuffer.pushFloat32(v);
    this.webglArrayBuffer.pushFloat32(textureUnit);
    this.webglArrayBuffer.pushUint32(color);
  }
  renderSprite(texture, width, height, u0, v0, u1, v1, offsetX, offsetY, color, uniforms, flipX, flipY, additionalTexturenit = 0) {
    if (1 + additionalTexturenit > this.freeTextureUnitNum || this.batchSprite >= MAX_BATCH || this.isUnifromChanged(uniforms) || this.rapid.projectionDirty) {
      this.render();
      if (uniforms && this.isUnifromChanged(uniforms)) {
        this.currentShader.setUniforms(uniforms, this);
        this.setCurrentUniform(uniforms);
      }
      if (this.rapid.projectionDirty) this.updateProjection();
    }
    this.batchSprite++;
    this.webglArrayBuffer.resize(FLOAT32_PER_SPRITE);
    const [textureUnit, isNew] = this.useTexture(texture);
    if (isNew) {
      this.spriteTextureUnits.push(textureUnit);
      this.spriteTextureUnitIndexOffset = this.spriteTextureUnits[0];
    }
    const textureIndex = textureUnit - this.spriteTextureUnitIndexOffset;
    const uA = flipX ? u1 : u0;
    const uB = flipX ? u0 : u1;
    const vA = flipY ? v1 : v0;
    const vB = flipY ? v0 : v1;
    const x1 = offsetX;
    const x2 = offsetX + width;
    const y1 = offsetY;
    const y2 = offsetY + height;
    this.addVertex(x1, y1, uA, vA, textureIndex, color);
    this.addVertex(x2, y1, uB, vA, textureIndex, color);
    this.addVertex(x2, y2, uB, vB, textureIndex, color);
    this.addVertex(x1, y2, uA, vB, textureIndex, color);
  }
  executeRender() {
    super.executeRender();
    if (this.batchSprite <= 0) return;
    const gl = this.gl;
    if (this.spriteTextureUnits.length > 0) {
      this.gl.uniform1iv(
        this.currentShader.uniformLoc["uTextures"],
        this.spriteTextureUnits
      );
    }
    gl.drawElements(gl.TRIANGLES, this.batchSprite * INDEX_PER_SPRITE, gl.UNSIGNED_SHORT, 0);
  }
  enterRegion(customShader) {
    super.enterRegion(customShader);
    this.indexBuffer.bindBuffer();
  }
  initializeForNextRender() {
    super.initializeForNextRender();
    this.batchSprite = 0;
    this.spriteTextureUnits.length = 0;
  }
  hasPendingContent() {
    return this.batchSprite > 0;
  }
}
class TextureCache {
  constructor(render, antialias) {
    this.cache = /* @__PURE__ */ new Map();
    this.render = render;
    this.antialias = antialias;
  }
  /**
   * create texture from url
   * Equivalent to {@link Texture.fromUrl} method
   * @param url 
   * @param antialias 
   * @returns 
   */
  async textureFromUrl(url, antialias = this.antialias, wrapMode = TextureWrapMode.CLAMP) {
    let base = this.cache.get(url);
    if (!base) {
      const image = await this.loadImage(url);
      base = BaseTexture.fromImageSource(this.render, image, antialias, wrapMode);
      base.cacheKey = url;
      this.cache.set(url, base);
    }
    return new Texture(base);
  }
  /**
   * Create a new `Texture` instance from a FrameBufferObject.
   * @param fbo - The FrameBufferObject to create the texture from.
   * @returns A new `Texture` instance created from the specified FrameBufferObject.
   */
  textureFromFrameBufferObject(fbo) {
    return new Texture(fbo);
  }
  /**
   * Create a new `Texture` instance from an image source.
   * @param source - The image source to create the texture from.
   * @param antialias - Whether to enable antialiasing.
   * @returns A new `Texture` instance created from the specified image source.
   */
  textureFromSource(source, antialias = this.antialias, wrapMode = TextureWrapMode.CLAMP) {
    let base = this.cache.get(source);
    if (!base) {
      base = BaseTexture.fromImageSource(this.render, source, antialias, wrapMode);
      base.cacheKey = source;
      this.cache.set(source, base);
    }
    return new Texture(base);
  }
  /**
   * Load an image from the specified URL.
   * @param url - The URL of the image to load.
   * @returns A promise that resolves to the loaded HTMLImageElement.
   */
  async loadImage(url) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        resolve(image);
      };
      image.src = url;
    });
  }
  /**
   * Create a new `Text` instance.
   * @param options - The options for rendering the text, such as font, size, color, etc.
   * @returns A new `Text` instance.
   */
  createText(options) {
    return new Text(this.render, options);
  }
  /**
   * Destroy the texture
   * @param texture 
   */
  destroy(texture) {
    const baseTexture = texture instanceof Texture ? texture.base : texture;
    if (baseTexture) {
      baseTexture.destroy(this.render.gl);
      this.removeCache(baseTexture);
    }
  }
  /**
   * Create a new FrameBufferObject instance
   * @param width - Width of the framebuffer
   * @param height - Height of the framebuffer
   * @param antialias - Whether to enable antialiasing
   * @returns A new FrameBufferObject instance
   */
  createFrameBufferObject(width, height, antialias = this.antialias) {
    return new FrameBufferObject(this.render, width, height, antialias);
  }
  removeCache(baseTexture) {
    if (baseTexture.cacheKey) {
      this.cache.delete(baseTexture.cacheKey);
    }
  }
}
class BaseTexture {
  constructor(texture, width, height, wrapMode = TextureWrapMode.CLAMP) {
    this.cacheKey = null;
    this.texture = texture;
    this.width = width;
    this.height = height;
    this.wrapMode = wrapMode;
  }
  static fromImageSource(r, image, antialias = false, wrapMode = TextureWrapMode.CLAMP) {
    return new BaseTexture(
      createTexture(r.gl, image, antialias, false, false, wrapMode),
      image.width,
      image.height
    );
  }
  /**
   * Destroy the texture
   * @param gl 
   * @ignore
   */
  destroy(gl) {
    gl.deleteTexture(this.texture);
  }
}
class Texture {
  /**
   * Creates a new `Texture` instance with the specified base texture reference.
   * @param base - The {@link BaseTexture} to be used by the texture.
   */
  constructor(base) {
    this.scale = 1;
    this.setBaseTexture(base);
  }
  /**
   * Set or change BaseTexture
   * @param base 
   * @param scale 
   */
  setBaseTexture(base) {
    if (base) {
      this.base = base;
      this.setClipRegion(0, 0, base.width, base.height);
    }
  }
  /**
   * Sets the region of the texture to be used for rendering.
   * @param x - The x-coordinate of the top-left corner of the region.
   * @param y - The y-coordinate of the top-left corner of the region.
   * @param w - The width of the region.
   * @param h - The height of the region.
   */
  setClipRegion(x, y, w, h) {
    if (!this.base) return;
    this.clipX = x / this.base.width;
    this.clipY = y / this.base.height;
    this.clipW = this.clipX + w / this.base.width;
    this.clipH = this.clipY + h / this.base.height;
    this.width = w * this.scale;
    this.height = h * this.scale;
    return this;
  }
  /**
   * Creates a new `Texture` instance from the specified image source.
   * @param rapid - The Rapid instance to use.
   * @param image - The image source to create the texture from.
   * @param antialias - Whether to enable antialiasing for the texture. Default is `false`.
   * @returns A new `Texture` instance created from the image source.
   */
  static fromImageSource(rapid, image, antialias = false) {
    return new Texture(
      BaseTexture.fromImageSource(rapid, image, antialias)
    );
  }
  static fromFrameBufferObject(fbo) {
    return new Texture(fbo);
  }
  /**
   * Converts the current texture into a spritesheet.
   * @param rapid - The Rapid instance to use.
   * @param spriteWidth - The width of each sprite in the spritesheet.
   * @param spriteHeight - The height of each sprite in the spritesheet.
   * @returns An array of `Texture` instances representing the sprites in the spritesheet.
   */
  createSpritesheet(spriteWidth, spriteHeight) {
    if (!this.base) return [];
    const sprites = [];
    const columns = Math.floor(this.base.width / spriteWidth);
    const rows = Math.floor(this.base.height / spriteHeight);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const sprite = this.clone();
        sprite.setClipRegion(
          x * spriteWidth,
          y * spriteHeight,
          spriteWidth,
          spriteHeight
        );
        sprites.push(sprite);
      }
    }
    return sprites;
  }
  /**
   * Clone the current texture
   * @returns A new `Texture` instance with the same base texture reference.
   */
  clone() {
    return new Texture(this.base);
  }
}
const SCALEFACTOR = 2.5;
class Text extends Texture {
  constructor(rapid, options) {
    super();
    this.scale = 1 / SCALEFACTOR;
    this.rapid = rapid;
    this.options = options;
    this.text = options.text || " ";
    this.updateTextImage();
  }
  updateTextImage() {
    if (this.base) {
      this.base.destroy(this.rapid.gl);
    }
    const canvas = this.createTextCanvas();
    this.setBaseTexture(BaseTexture.fromImageSource(this.rapid, canvas, true));
  }
  createTextCanvas() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Failed to get 2D canvas context");
    const fontSize = this.options.fontSize || 16;
    const font = `${fontSize}px ${this.options.fontFamily || "Arial"}`;
    const lines = this.text.split("\n");
    context.font = font;
    let maxWidth = 0;
    for (const line of lines) {
      const metrics = context.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    }
    const totalHeight = fontSize * lines.length;
    canvas.width = Math.ceil(maxWidth) * SCALEFACTOR;
    canvas.height = Math.ceil(totalHeight) * SCALEFACTOR;
    context.scale(SCALEFACTOR, SCALEFACTOR);
    context.font = font;
    context.fillStyle = this.options.color ? this.options.color.toHexString() : "#000";
    context.textAlign = this.options.textAlign || "left";
    context.textBaseline = this.options.textBaseline || "top";
    let yOffset = 0;
    for (const line of lines) {
      context.fillText(line, 0, yOffset);
      yOffset += fontSize;
    }
    return canvas;
  }
  /**
   * Updates the displayed text. Re-renders the texture if the text has changed.
   * @param text - The new text to display.
   */
  setText(text) {
    if (this.text === text) return;
    this.text = text || " ";
    this.updateTextImage();
  }
}
class FrameBufferObject extends BaseTexture {
  /**
   * Creates a new FrameBufferObject instance
   * @param render - The Rapid instance to use
   * @param width - Width of the framebuffer
   * @param height - Height of the framebuffer
   * @param antialias - Whether to enable antialiasing
   */
  constructor(render, width, height, antialias = false) {
    const gl = render.gl;
    const texture = createTexture(gl, { width, height }, antialias, true, false);
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      gl.deleteTexture(texture);
      throw new Error("Failed to create WebGL framebuffer");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    const stencilBuffer = gl.createRenderbuffer();
    if (!stencilBuffer) {
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
      throw new Error("Failed to create depth-stencil renderbuffer");
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, stencilBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, width, height);
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.STENCIL_ATTACHMENT,
      gl.RENDERBUFFER,
      stencilBuffer
    );
    super(texture, width, height);
    this.gl = gl;
    this.framebuffer = framebuffer;
    this.stencilBuffer = stencilBuffer;
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }
  /**
   * Bind the framebuffer for rendering
   * @ignore
   */
  bind(bgColor) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.clearColor(bgColor.r, bgColor.g, bgColor.b, bgColor.a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  }
  /**
   * Unbind the framebuffer and restore default framebuffer
   * @ignore
   */
  unbind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }
  /**
   * Resize the framebuffer
   * @param width - New width
   * @param height - New height
   */
  resize(width, height) {
    if (this.width === width && this.height === height) {
      return;
    }
    this.width = width;
    this.height = height;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.stencilBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, width, height);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }
  /**
   * Override destroy method to clean up framebuffer resources
   * @param gl - WebGL context
   */
  destroy(gl) {
    gl.deleteFramebuffer(this.framebuffer);
    gl.deleteRenderbuffer(this.stencilBuffer);
    super.destroy(gl);
  }
}
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var eventemitter3 = { exports: {} };
var hasRequiredEventemitter3;
function requireEventemitter3() {
  if (hasRequiredEventemitter3) return eventemitter3.exports;
  hasRequiredEventemitter3 = 1;
  (function(module) {
    var has = Object.prototype.hasOwnProperty, prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__) prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }
    function EventEmitter2() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter2.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0) return names;
      for (name in events = this._events) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter2.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter2.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter2.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter2.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
    EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
    EventEmitter2.prefixed = prefix;
    EventEmitter2.EventEmitter = EventEmitter2;
    {
      module.exports = EventEmitter2;
    }
  })(eventemitter3);
  return eventemitter3.exports;
}
var eventemitter3Exports = requireEventemitter3();
const EventEmitter = /* @__PURE__ */ getDefaultExportFromCjs(eventemitter3Exports);
class AssetsLoader extends EventEmitter {
  /**
   * Creates an instance of AssetsLoader.
   * Initializes the asset storage and counters.
   */
  constructor(game) {
    super();
    this.totalAsset = 0;
    this.loadedAssets = 0;
    this.game = game;
    this.assets = {
      json: {},
      audio: {},
      images: {}
    };
  }
  /**
   * Loads a JSON file asynchronously.
   * @param name - The unique identifier for the JSON asset.
   * @param url - The URL of the JSON file.
   */
  loadJson(name, url) {
    this.totalAsset++;
    fetch(url).then((response) => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    }).then((data) => {
      this.assets.json[name] = data;
      this.assetLoaded();
    }).catch((error) => this.handleError(name, url, error));
  }
  /**
   * Loads an audio file asynchronously using the AudioManager.
   * The AudioManager will handle fetching and caching.
   * @param name - The unique identifier for the audio asset.
   * @param url - The URL of the audio file.
   */
  async loadAudio(name, url) {
    this.totalAsset++;
    try {
      const audioPlayer = await this.game.audio.audioFromUrl(url);
      this.assets.audio[name] = audioPlayer;
      this.assetLoaded();
    } catch (error) {
      this.handleError(name, url, error);
      this.assetLoaded();
    }
  }
  /**
   * Loads an image file asynchronously using the TextureManager.
   * @param name - The unique identifier for the image asset.
   * @param url - The URL of the image file.
   */
  async loadImage(name, url) {
    this.totalAsset++;
    try {
      this.assets.images[name] = await this.game.render.texture.textureFromUrl(url);
      this.assetLoaded();
    } catch (error) {
      this.handleError(name, url, error);
      this.assetLoaded();
    }
  }
  /**
   * Loads multiple assets from a list.
   * @param assetList - Array of assets to load.
   */
  loadAssets(assetList) {
    if (assetList.length === 0) {
      this.emit("progress", 1, 0, 0);
      this.emit("complete", this.assets);
      return;
    }
    assetList.forEach((asset) => {
      switch (asset.type) {
        case "json":
          this.loadJson(asset.name, asset.url);
          break;
        case "audio":
          this.loadAudio(asset.name, asset.url);
          break;
        case "image":
          this.loadImage(asset.name, asset.url);
          break;
        default:
          console.warn(`Unknown asset type: ${asset.type}`);
      }
    });
  }
  /**
   * Handles the completion of an asset load.
   * Updates progress and triggers completion event if all assets are loaded.
   */
  assetLoaded() {
    this.loadedAssets++;
    const progress = this.totalAsset > 0 ? this.loadedAssets / this.totalAsset : 1;
    this.emit("progress", progress, this.loadedAssets, this.totalAsset);
    if (this.loadedAssets >= this.totalAsset) {
      this.emit("complete", this.assets);
    }
  }
  /**
   * Handles errors during asset loading.
   * @param name - The name of the asset.
   * @param url - The URL of the asset.
   * @param error - The error object or message.
   */
  handleError(name, url, error) {
    this.emit("error", { name, url, error });
    console.error(`Failed to load asset '${name}' from ${url}:`, error);
  }
  /**
   * Retrieves a loaded asset by type and name.
   * @param type - The type of asset ('json', 'audio', or 'images').
   * @param name - The name of the asset.
   * @returns The loaded asset or undefined if not found.
   */
  get(type, name) {
    return this.assets[type]?.[name];
  }
  /**
   * Retrieves a loaded JSON asset by name.
   * @param name - The name of the JSON asset.
   * @returns The loaded JSON data or undefined if not found.
   */
  getJSON(name) {
    return this.assets.json[name];
  }
  /**
   * Retrieves a loaded audio asset by name.
   * @param name - The name of the audio asset.
   * @returns The loaded AudioPlayer instance or undefined if not found.
   */
  getAudio(name) {
    return this.assets.audio[name];
  }
  /**
   * Retrieves a loaded texture (image) asset by name.
   * @param name - The name of the texture asset.
   * @returns The loaded texture or undefined if not found.
   */
  getTexture(name) {
    return this.assets.images[name];
  }
}
class AudioPlayer extends EventEmitter {
  constructor(audioContext, audioBuffer) {
    super();
    this.sourceNode = null;
    this._volume = 1;
    this._loop = false;
    this._isPlaying = false;
    this.audioContext = audioContext;
    this.audioBuffer = audioBuffer;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }
  /**
   * Plays the audio. If already playing, it will stop the current playback and start over.
   */
  play() {
    if (!this.audioContext || !this.audioBuffer || !this.gainNode) {
      console.warn("Cannot play audio on a destroyed AudioPlayer.");
      return;
    }
    if (this._isPlaying) {
      this.stop();
    }
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = this._loop;
    this.sourceNode.connect(this.gainNode);
    this.sourceNode.onended = () => {
      if (!this._isPlaying) return;
      this._isPlaying = false;
      this.sourceNode = null;
      this.emit("ended");
    };
    this.sourceNode.start(0);
    this._isPlaying = true;
  }
  /**
   * Stops the audio playback immediately.
   */
  stop() {
    if (this.sourceNode) {
      this.sourceNode.stop();
    }
    this._isPlaying = false;
  }
  /**
   * Gets the volume of the audio, from 0.0 to 1.0.
   */
  get volume() {
    return this._volume;
  }
  /**
   * Sets the volume of the audio.
   * @param value - The volume, from 0.0 (silent) to 1.0 (full).
   */
  set volume(value) {
    this._volume = Math.max(0, Math.min(1, value));
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setTargetAtTime(this._volume, this.audioContext.currentTime, 0.01);
    }
  }
  /**
   * Gets whether the audio will loop.
   */
  get loop() {
    return this._loop;
  }
  /**
   * Sets whether the audio should loop.
   * Can be changed while the audio is playing.
   */
  set loop(value) {
    this._loop = value;
    if (this.sourceNode) {
      this.sourceNode.loop = value;
    }
  }
  /**
   * Gets whether the audio is currently playing.
   */
  get isPlaying() {
    return this._isPlaying;
  }
  /**
   * Stops playback, disconnects audio nodes, and removes all event listeners.
   * This makes the AudioPlayer instance unusable.
   */
  destroy() {
    this.stop();
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    this.removeAllListeners();
    this.audioBuffer = null;
    this.audioContext = null;
    this.gainNode = null;
    this.sourceNode = null;
  }
}
class AudioManager {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser.");
      this.audioContext = null;
    }
  }
  /**
   * Creates an AudioPlayer from a URL.
   * It fetches, decodes, and caches the audio data. If the URL is already cached,
   * it skips the network request and uses the cached data.
   *
   * @param url - The URL of the audio file.
   * @returns A Promise that resolves to a new AudioPlayer instance.
   */
  async audioFromUrl(url) {
    if (!this.audioContext) {
      throw new Error("AudioContext is not available. Cannot process audio.");
    }
    let cachedBuffer = this.cache.get(url);
    if (!cachedBuffer) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio from ${url}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      try {
        cachedBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      } catch (error) {
        throw new Error(`Failed to decode audio from ${url}: ${error}`);
      }
      this.cache.set(url, cachedBuffer);
    }
    return new AudioPlayer(this.audioContext, cachedBuffer);
  }
  /**
   * Destroys the AudioManager, clears the audio cache, and closes the AudioContext.
   * This releases all associated audio resources. After calling this, the AudioManager
   * and any AudioPlayers created by it will be unusable.
   */
  destroy() {
    this.cache.clear();
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch((err) => {
        console.error("Error closing AudioContext:", err);
      });
    }
    this.audioContext = null;
  }
}
class InputManager {
  /**
   * Creates an instance of InputManager.
   * @param rapid - The Rapid instance for rendering and coordinate conversion.
   */
  constructor(rapid) {
    this.mousePosition = Vec2.ZERO;
    this.keysDown = /* @__PURE__ */ new Set();
    this.keysDownLastFrame = /* @__PURE__ */ new Set();
    this.buttonsDown = /* @__PURE__ */ new Set();
    this.buttonsDownLastFrame = /* @__PURE__ */ new Set();
    this.rapid = rapid;
    this.canvas = rapid.canvas;
    this.attachEventListeners();
  }
  /**
   * Attaches all necessary event listeners for keyboard and mouse input.
   * @private
   */
  attachEventListeners() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.addEventListener("mousemove", this.handleMouseMove = (event) => {
      this.mousePosition = this.rapid.cssToGameCoords(event.clientX - rect.left, event.clientY - rect.top);
    });
    window.addEventListener("keydown", this.handleKeyDown = (event) => {
      this.keysDown.add(event.code);
    });
    window.addEventListener("keyup", this.handleKeyUp = (event) => {
      this.keysDown.delete(event.code);
    });
    this.canvas.addEventListener("mousedown", this.handleMouseDown = (event) => {
      this.buttonsDown.add(event.button);
    });
    this.canvas.addEventListener("mouseup", this.handleMouseUp = (event) => {
      this.buttonsDown.delete(event.button);
    });
  }
  /**
   * Updates the state of keys and buttons for the next frame.
   */
  updateNextFrame() {
    this.keysDownLastFrame = new Set(this.keysDown);
    this.buttonsDownLastFrame = new Set(this.buttonsDown);
  }
  /**
   * Checks if a key is currently pressed (continuous detection).
   * @param key - The key code (e.g., "KeyW", "Space").
   * @returns True if the key is pressed, false otherwise.
   */
  isKeyDown(key) {
    return this.keysDown.has(key);
  }
  /**
   * Checks if a key is currently released.
   * @param key - The key code (e.g., "KeyW", "Space").
   * @returns True if the key is released, false otherwise.
   */
  isKeyUp(key) {
    return !this.keysDown.has(key);
  }
  /**
   * Checks if a key was pressed in the current frame (single trigger).
   * @param key - The key code (e.g., "KeyW", "Space").
   * @returns True if the key was just pressed, false otherwise.
   */
  wasKeyPressed(key) {
    return this.keysDown.has(key) && !this.keysDownLastFrame.has(key);
  }
  /**
   * Checks if a key was released in the current frame (single trigger).
   * @param key - The key code (e.g., "KeyW", "Space").
   * @returns True if the key was just released, false otherwise.
   */
  wasKeyReleased(key) {
    return !this.keysDown.has(key) && this.keysDownLastFrame.has(key);
  }
  /**
   * Checks if a mouse button is currently pressed (continuous detection).
   * @param button - The mouse button number (0: left, 1: middle, 2: right).
   * @returns True if the button is pressed, false otherwise.
   */
  isButtonDown(button) {
    return this.buttonsDown.has(button);
  }
  /**
   * Checks if a mouse button is currently released.
   * @param button - The mouse button number (0: left, 1: middle, 2: right).
   * @returns True if the button is released, false otherwise.
   */
  isButtonUp(button) {
    return !this.buttonsDown.has(button);
  }
  /**
   * Checks if a mouse button was pressed in the current frame (single trigger).
   * @param button - The mouse button number (0: left, 1: middle, 2: right).
   * @returns True if the button was just pressed, false otherwise.
   */
  wasButtonPressed(button) {
    return this.buttonsDown.has(button) && !this.buttonsDownLastFrame.has(button);
  }
  /**
   * Checks if a mouse button was released in the current frame (single trigger).
   * @param button - The mouse button number (0: left, 1: middle, 2: right).
   * @returns True if the button was just released, false otherwise.
   */
  wasButtonReleased(button) {
    return !this.buttonsDown.has(button) && this.buttonsDownLastFrame.has(button);
  }
  /**
   * Converts the mouse position to local coordinates relative to an entity.
   * @param entity - The entity to convert coordinates for.
   * @returns The mouse position in the entity's local coordinate system.
   */
  getMouseLocal(entity) {
    return entity.transform.globalToLocal(this.mousePosition);
  }
  getAxis(negativeAction, positiveAction) {
    let value = 0;
    if (this.isKeyDown(positiveAction)) {
      value += 1;
    }
    if (this.isKeyDown(negativeAction)) {
      value -= 1;
    }
    return value;
  }
  getVector(negativeX, positiveX, negativeY, positiveY) {
    const x = this.getAxis(negativeX, positiveX);
    const y = this.getAxis(negativeY, positiveY);
    const vector = new Vec2(x, y);
    return vector.normalize();
  }
  /**
   * Removes all event listeners and cleans up resources.
   */
  destroy() {
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.keysDown.clear();
    this.keysDownLastFrame.clear();
    this.buttonsDown.clear();
    this.buttonsDownLastFrame.clear();
  }
}
class Tween extends EventEmitter {
  /**
   * Creates an instance of Tween.
   * @param target - The object whose property will be animated.
   * @param property - The name of the property to animate.
   * @param to - The target value of the property.
   * @param duration - The duration of the animation in seconds.
   * @param easing - The easing function to use for the animation.
   */
  constructor(target, property, to, duration, easing) {
    super();
    this.elapsed = 0;
    this.isRunning = false;
    this.isFinished = false;
    this.target = target;
    this.property = property;
    this.to = to;
    this.duration = duration;
    this.easing = easing;
  }
  /**
   * Starts the tween animation.
   * It captures the initial state of the property.
   */
  start() {
    const initialValue = this.target[this.property];
    if (typeof initialValue === "number") {
      this.from = initialValue;
    } else if (typeof initialValue.clone === "function") {
      this.from = initialValue.clone();
    } else {
      console.error("Tween target property is not a 'number' or does not have a 'clone' method.");
      this.isFinished = true;
      return;
    }
    this.elapsed = 0;
    this.isRunning = true;
    this.isFinished = false;
  }
  /**
   * Updates the tween's state. This should be called every frame.
   * @param deltaTime - The time elapsed since the last frame, in seconds.
   */
  update(deltaTime) {
    if (!this.isRunning || this.isFinished) {
      return;
    }
    this.elapsed += deltaTime;
    const progress = Math.min(this.elapsed / this.duration, 1);
    const easedProgress = this.easing(progress);
    let currentValue;
    if (typeof this.from === "number" && typeof this.to === "number") {
      currentValue = this.from + (this.to - this.from) * easedProgress;
    } else {
      const from = this.from;
      const to = this.to;
      const range = to.subtract(from);
      const step = range.multiply(easedProgress);
      currentValue = from.add(step);
    }
    this.target[this.property] = currentValue;
    if (progress >= 1) {
      this.isFinished = true;
      this.isRunning = false;
      this.target[this.property] = this.to;
      this.emit("complete");
    }
  }
}
const isPlainObject = (obj) => {
  if (typeof obj !== "object" || obj === null) return false;
  return Object.getPrototypeOf(obj) === Object.prototype;
};
const _Easing = class _Easing {
};
_Easing.Linear = (t) => t;
_Easing.EaseInQuad = (t) => t * t;
_Easing.EaseOutQuad = (t) => t * (2 - t);
_Easing.EaseInOutQuad = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
_Easing.EaseInCubic = (t) => t * t * t;
_Easing.EaseOutCubic = (t) => --t * t * t + 1;
_Easing.EaseInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
_Easing.EaseInQuart = (t) => t * t * t * t;
_Easing.EaseOutQuart = (t) => 1 - --t * t * t * t;
_Easing.EaseInOutQuart = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
let Easing = _Easing;
class Timer extends EventEmitter {
  /**
   * Creates an instance of a Timer.
   * @param duration - The duration of the timer in seconds.
   * @param onComplete - The callback function to execute when the timer completes a cycle.
   * @param repeat - Whether the timer should restart automatically after completion. Defaults to false.
   */
  constructor(duration, repeat = false) {
    super();
    this.elapsedTime = 0;
    this.isRunning = false;
    this.isFinished = false;
    this.duration = duration;
    this.repeat = repeat;
  }
  /**
   * Starts or resumes the timer.
   */
  start() {
    this.isRunning = true;
  }
  /**
   * Stops (pauses) the timer. It can be resumed with start().
   */
  stop() {
    this.isRunning = false;
  }
  /**
   * Updates the timer's state. This is called by the Game loop every frame.
   * @param deltaTime - The time elapsed since the last frame, in seconds.
   * @internal
   */
  update(deltaTime) {
    if (!this.isRunning || this.isFinished) {
      return;
    }
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= this.duration) {
      this.emit("timeout");
      if (this.repeat) {
        this.elapsedTime -= this.duration;
      } else {
        this.isFinished = true;
        this.isRunning = false;
      }
    }
  }
  /**
   * Immediately stops the timer and marks it as finished, preventing any further execution.
   * This is used for cleanup to avoid memory leaks from stale callbacks.
   */
  destroy() {
    this.isFinished = true;
    this.isRunning = false;
  }
}
class Collider {
  constructor(parent, offset = new Vec2(0, 0)) {
    if (parent instanceof Body) {
      this.entity = parent.entity;
    } else {
      this.entity = parent;
    }
    this.offset = offset;
  }
  getWorldPosition() {
    this.entity.updateTransform(true);
    return this.entity.transform.transformPoint(this.offset);
  }
}
class CircleCollider extends Collider {
  constructor(parent, radius, offset) {
    super(parent, offset);
    this.radius = radius;
  }
  getWorldRadius() {
    const scale = this.entity.scale;
    return this.radius * Math.max(Math.abs(scale.x), Math.abs(scale.y));
  }
}
class PointCollider extends CircleCollider {
  constructor(parent, offset) {
    super(parent, 0, offset);
  }
}
class PolygonCollider extends Collider {
  constructor(parent, vertices, offset) {
    super(parent, offset);
    this.localVertices = vertices;
  }
  getWorldVertices() {
    this.entity.updateTransform(true);
    const transform = this.entity.transform;
    return this.localVertices.map((v) => transform.transformPoint(v.add(this.offset)));
  }
  getAxes() {
    const vertices = this.getWorldVertices();
    const axes = [];
    for (let i = 0; i < vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[i + 1] || vertices[0];
      const edge = p2.subtract(p1);
      const normal = new Vec2(-edge.y, edge.x).normalize();
      let unique = true;
      for (const axis of axes) {
        if (Math.abs(axis.dot(normal)) > 0.9999) {
          unique = false;
          break;
        }
      }
      if (unique) {
        axes.push(normal);
      }
    }
    return axes;
  }
}
function projectVertices(vertices, axis) {
  let min = Infinity;
  let max = -Infinity;
  for (const vertex of vertices) {
    const projection = vertex.dot(axis);
    if (projection < min) min = projection;
    if (projection > max) max = projection;
  }
  return { min, max };
}
function projectCircle(center, radius, axis) {
  const centerProjection = center.dot(axis);
  return {
    min: centerProjection - radius,
    max: centerProjection + radius
  };
}
function checkPolygonPolygon(polyA, polyB) {
  const axes = polyA.getAxes().concat(polyB.getAxes());
  let overlap = Infinity;
  let smallestAxis = null;
  for (const axis of axes) {
    const projA = projectVertices(polyA.getWorldVertices(), axis);
    const projB = projectVertices(polyB.getWorldVertices(), axis);
    const currentOverlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);
    if (currentOverlap <= 0) return { collided: false };
    if (currentOverlap < overlap) {
      overlap = currentOverlap;
      smallestAxis = axis;
    }
  }
  if (!smallestAxis) return { collided: false };
  const direction = polyA.getWorldPosition().subtract(polyB.getWorldPosition());
  if (direction.dot(smallestAxis) < 0) smallestAxis.invert();
  return { collided: true, mtv: smallestAxis.multiply(overlap) };
}
function checkCircleCircle(circleA, circleB) {
  const centerA = circleA.getWorldPosition();
  const centerB = circleB.getWorldPosition();
  const radiusA = circleA.getWorldRadius();
  const radiusB = circleB.getWorldRadius();
  const delta = centerA.subtract(centerB);
  const distanceSq = delta.x * delta.x + delta.y * delta.y;
  const radiiSum = radiusA + radiusB;
  if (distanceSq >= radiiSum * radiiSum) return { collided: false };
  const distance = Math.sqrt(distanceSq);
  const overlap = radiiSum - distance;
  if (distance === 0) return { collided: true, mtv: new Vec2(overlap, 0) };
  return { collided: true, mtv: delta.normalize().multiply(overlap) };
}
function checkPolygonCircle(poly, circle) {
  const vertices = poly.getWorldVertices();
  const axes = poly.getAxes();
  const circleCenter = circle.getWorldPosition();
  const circleRadius = circle.getWorldRadius();
  let closestVertex = vertices[0];
  let minDistanceSq = Infinity;
  for (const vertex of vertices) {
    const distSq = circleCenter.distanceTo(vertex) ** 2;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closestVertex = vertex;
    }
  }
  const axisToClosest = closestVertex.subtract(circleCenter);
  if (axisToClosest.length() > 1e-9) {
    axes.push(axisToClosest.normalize());
  }
  let overlap = Infinity;
  let smallestAxis = null;
  for (const axis of axes) {
    const projPoly = projectVertices(vertices, axis);
    const projCircle = projectCircle(circleCenter, circleRadius, axis);
    const currentOverlap = Math.min(projPoly.max, projCircle.max) - Math.max(projPoly.min, projCircle.min);
    if (currentOverlap <= 0) return { collided: false };
    if (currentOverlap < overlap) {
      overlap = currentOverlap;
      smallestAxis = axis;
    }
  }
  if (!smallestAxis) return { collided: false };
  const direction = poly.getWorldPosition().subtract(circleCenter);
  if (direction.dot(smallestAxis) < 0) smallestAxis.invert();
  return { collided: true, mtv: smallestAxis.multiply(overlap) };
}
function checkCollision(colliderA, colliderB) {
  if (!colliderA || !colliderB || colliderA.entity === colliderB.entity) {
    return { collided: false };
  }
  if (colliderA instanceof PolygonCollider) {
    if (colliderB instanceof PolygonCollider) return checkPolygonPolygon(colliderA, colliderB);
    if (colliderB instanceof CircleCollider) return checkPolygonCircle(colliderA, colliderB);
  } else if (colliderA instanceof CircleCollider) {
    if (colliderB instanceof PolygonCollider) {
      const result = checkPolygonCircle(colliderB, colliderA);
      if (result.mtv) result.mtv.invert();
      return result;
    }
    if (colliderB instanceof CircleCollider) return checkCircleCircle(colliderA, colliderB);
  }
  return { collided: false };
}
class PhysicsManager {
  constructor(game) {
    this.components = /* @__PURE__ */ new Set();
    this.game = game;
  }
  addComponent(component) {
    this.components.add(component);
  }
  removeComponent(component) {
    this.components.delete(component);
  }
  onPhysics(dt) {
    const componentArray = Array.from(this.components);
    if (componentArray.length < 2) return;
    const collisionEvents = /* @__PURE__ */ new Map();
    componentArray.forEach((c) => collisionEvents.set(c, []));
    for (let i = 0; i < componentArray.length; i++) {
      for (let j = i + 1; j < componentArray.length; j++) {
        const compA = componentArray[i];
        const compB = componentArray[j];
        if (compA.disabled || compB.disabled) continue;
        for (const colliderA of compA.colliders) {
          for (const colliderB of compB.colliders) {
            const result = checkCollision(colliderA, colliderB);
            if (result.collided) {
              const mtvA = result.mtv;
              const mtvB = mtvA.clone().invert();
              collisionEvents.get(compA).push({
                colliderA,
                colliderB,
                mtv: mtvA,
                otherEntity: compB.entity
              });
              collisionEvents.get(compB).push({
                colliderA: colliderB,
                colliderB: colliderA,
                mtv: mtvB,
                otherEntity: compA.entity
              });
            }
          }
        }
      }
    }
    for (const component of this.components) {
      const allFrameCollisions = collisionEvents.get(component);
      const oldCollisions = component.activeCollisions;
      const newCollisionsGrouped = /* @__PURE__ */ new Map();
      for (const collision of allFrameCollisions) {
        if (!newCollisionsGrouped.has(collision.otherEntity)) {
          newCollisionsGrouped.set(collision.otherEntity, []);
        }
        newCollisionsGrouped.get(collision.otherEntity).push(collision);
      }
      for (const [entity, results] of newCollisionsGrouped.entries()) {
        if (!oldCollisions.has(entity)) {
          component.onBodyEnter?.(entity, results);
        }
      }
      for (const entity of oldCollisions.keys()) {
        if (!newCollisionsGrouped.has(entity)) {
          component.onBodyExit?.(entity);
        }
      }
      component.activeCollisions = newCollisionsGrouped;
    }
  }
}
class Body extends Component {
  constructor(options) {
    super(options);
    this.colliders = [];
    this.activeCollisions = /* @__PURE__ */ new Map();
    this.velocity = Vec2.ZERO;
    this.acceleration = Vec2.ZERO;
    this.disabled = false;
    this.bodyType = options.bodyType ?? BodyType.STATIC;
  }
  getCollidedObjects() {
    return this.activeCollisions.keys();
  }
  onAttach(entity) {
    super.onAttach(entity);
    const options = this.options;
    this.colliders.length = 0;
    if (Array.isArray(options.colliders)) {
      this.colliders.push(...options.colliders);
    } else {
      this.colliders.push(options.colliders);
    }
    this.game.physics.addComponent(this);
  }
  onDetach() {
    this.game.physics.removeComponent(this);
    this.colliders = [];
    this.activeCollisions.clear();
    super.onDetach();
  }
  onBodyEnter(otherEntity, results) {
    this.event.emit("onBodyEnter", otherEntity, results);
    if (this.bodyType === BodyType.DYNAMIC) {
      const totalMtv = new Vec2(0, 0);
      for (const result of results) {
        totalMtv.addSelf(result.mtv);
      }
      this.entity.position.addSelf(totalMtv);
    }
  }
  onBodyExit(entity) {
    this.event.emit("onBodyExit", entity);
  }
  onPhysics(dt) {
    if (this.disabled) return;
    const entity = this.entity;
    switch (this.bodyType) {
      case BodyType.STATIC:
        break;
      case BodyType.KINEMATIC:
        if (!this.velocity.equal(Vec2.ZERO)) {
          entity.position.addSelf(this.velocity.multiply(dt));
        }
        break;
      case BodyType.DYNAMIC:
        this.velocity.addSelf(this.acceleration.multiply(dt));
        entity.position.addSelf(this.velocity.multiply(dt));
        break;
    }
  }
}
class TilemapBody extends Body {
  constructor(options) {
    super(options);
    this.tilemap = options.tilemap;
  }
  onUpdate(_dt) {
    super.onUpdate(_dt);
    this.colliders.length = 0;
    this.tilemap.displayTiles.forEach((tiles) => {
      if (Array.isArray(tiles.colliders)) {
        this.colliders.push(...tiles.colliders);
      } else if (tiles.colliders) {
        this.colliders.push(tiles.colliders);
      }
    });
  }
}
class PartcileBody extends Body {
  constructor(options) {
    super(options);
    this.particle = options.particle;
  }
  onUpdate(_dt) {
    super.onUpdate(_dt);
    this.colliders.length = 0;
    this.particle.particles.forEach((particle) => {
      if (particle) {
        particle.updateOffset();
        particle.collider.extraData = particle;
        this.colliders.push(particle.collider);
      }
    });
  }
  onBodyEnter(otherEntity, results) {
    for (const result of results) {
      const particle = result.colliderA.extraData;
      particle.position.addSelf(result.mtv);
    }
  }
}
class Component {
  constructor(options = {}) {
    this.unique = true;
    this.event = new EventEmitter();
    this.patchMethods = [];
    this.originalMethods = /* @__PURE__ */ new Map();
    this.options = options;
    this.name = options.name ?? this.constructor.name;
  }
  onAttach(entity) {
    this.entity = entity;
    this.game = entity.game;
    this.rapid = entity.rapid;
    this.patchEntityMethods();
  }
  onDetach() {
    this.unpatchEntityMethods();
  }
  /**
   * 辅助方法，用于在组件方法中调用 Entity 的原始方法
   * @param methodName 要调用的原始方法名
   * @param args 传递给原始方法的参数
   */
  callOriginal(methodName, ...args) {
    const originalMethod = this.originalMethods.get(methodName);
    if (originalMethod) {
      return originalMethod(...args);
    } else {
      console.warn(`Original method "${methodName}" not found on entity.`);
    }
  }
  patchEntityMethods() {
    for (const methodName of this.patchMethods) {
      const componentMethod = this[methodName];
      const entityMethod = this.entity[methodName];
      if (typeof componentMethod === "function" && typeof entityMethod === "function") {
        this.originalMethods.set(methodName, entityMethod.bind(this.entity));
        this.entity[methodName] = componentMethod.bind(this);
      }
    }
  }
  unpatchEntityMethods() {
    for (const [methodName, originalMethod] of this.originalMethods.entries()) {
      this.entity[methodName] = originalMethod;
    }
    this.originalMethods.clear();
  }
  onRenderQueue(queue) {
  }
  onUpdate(_dt) {
  }
  onRender(_rapid) {
  }
  onDispose() {
  }
  onPhysics(_dt) {
  }
}
class GameObject {
  /**
   * Creates an entity with optional transform properties.
   * @param game - The game instance this entity belongs to.
   * @param options - Configuration options for position, scale, rotation, and tags.
   */
  constructor(game, options = {}) {
    this.parent = null;
    this.globalZindex = 0;
    this.localZindex = 0;
    this.transform = new MatrixStack();
    this.children = [];
    this.components = /* @__PURE__ */ new Map();
    this.transform.pushIdentity();
    this.game = game;
    this.rapid = game.render;
    this.tags = options.tags ?? [];
    if (options.position) {
      this.position = options.position;
    } else {
      this.position = new Vec2(options.x ?? 0, options.y ?? 0);
    }
    if (typeof options.scale === "number") {
      this.scale = new Vec2(options.scale, options.scale);
    } else if (options.scale) {
      this.scale = options.scale;
    } else {
      this.scale = new Vec2(1, 1);
    }
    this.rotation = options.rotation ?? 0;
  }
  get x() {
    return this.position.x;
  }
  get y() {
    return this.position.y;
  }
  set x(nx) {
    this.position.x = nx;
  }
  set y(ny) {
    this.position.y = ny;
  }
  /**
   * Adds a component to this entity.
   * @param component - The component instance to add.
   * @returns The added component.
   */
  addComponent(component) {
    const name = component.name;
    if (component.unique && this.components.has(name)) {
      throw new Error(`Component with name '${name}' already exists on entity.`);
    }
    this.components.set(name, component);
    component.onAttach(this);
    return component;
  }
  /**
   * Removes a component by name or class.
   * @param key - The component name (string) or class (constructor).
   * @returns True if a component was removed, false otherwise.
   */
  removeComponent(key) {
    const name = typeof key === "string" ? key : key.name;
    const comp = this.components.get(name);
    if (comp) {
      comp.onDetach();
      comp.onDispose();
      this.components.delete(name);
      return true;
    }
    return false;
  }
  /**
   * Gets a component by name.
   * @param name - The component name.
   * @returns The component or null if not found.
   */
  getComponentByName(name) {
    return this.components.get(name) ?? null;
  }
  /**
   * Gets a component by class.
   * @param ctor - The component class.
   * @returns The component or null if not found.
   */
  getComponent(ctor) {
    for (const comp of this.components.values()) {
      if (comp instanceof ctor) {
        return comp;
      }
    }
    return null;
  }
  /**
   * Checks if a component exists by name or class.
   */
  hasComponent(key) {
    return typeof key === "string" ? this.components.has(key) : this.getComponent(key) !== null;
  }
  getScene() {
    return this.game.getMainScene();
  }
  /**
   * Gets the parent transform or the renderer's matrix stack if no parent exists.
   * @returns The transform matrix stack.
   */
  getParentTransform() {
    return this.parent ? this.parent.transform : this.rapid.matrixStack;
  }
  /**
   * Renders the entity and its components.
   * @param render - The rendering engine instance.
   */
  onRender(render) {
    this.components.forEach((c) => c.onRender(render));
  }
  onRenderQueue(queue) {
    this.components.forEach((c) => c.onRenderQueue(queue));
  }
  onUpdate(deltaTime) {
    this.components.forEach((c) => c.onUpdate(deltaTime));
  }
  onPhysics(deltaTime) {
    this.components.forEach((c) => c.onPhysics(deltaTime));
  }
  onDispose() {
    this.components.forEach((c) => c.onDispose());
  }
  /**
   * Updates the entity's transform, optionally updating parent transforms.
   * @param deep - If true, recursively updates parent transforms.
   */
  updateTransform(deep = false) {
    if (deep && this.parent) {
      this.parent.updateTransform(deep);
    }
    const transform = this.transform;
    const parentTransform = this.getParentTransform();
    transform.setTransform(parentTransform.getTransform());
    transform.translate(this.position);
    transform.rotate(this.rotation);
    transform.scale(this.scale);
  }
  /**
   * Adds a child entity to this entity.
   * @param child - The entity to add as a child.
   */
  addChild(child) {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    this.children.push(child);
    return this;
  }
  /**
   * Removes a child entity from this entity.
   * @param child - The entity to remove.
   */
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      child.parent = null;
      this.children.splice(index, 1);
    }
    return this;
  }
  /**
   * Finds descendant entities matching a predicate.
   * @param predicate - Function to test each entity.
   * @param onlyFirst - If true, returns only the first match; otherwise, returns all matches.
   * @returns A single entity, an array of entities, or null if no matches are found.
   */
  findDescendant(predicate, onlyFirst = true) {
    const results = [];
    for (const child of this.children) {
      if (predicate(child)) {
        if (onlyFirst) {
          return child;
        }
        results.push(child);
      }
      const childFind = child.findDescendant(predicate, onlyFirst);
      if (onlyFirst) {
        if (childFind) {
          return childFind;
        }
      } else {
        results.push(...childFind);
      }
    }
    return onlyFirst ? null : results;
  }
  /**
   * Finds descendant entities with all specified tags.
   * @param tags - Array of tags to match.
   * @param onlyFirst - If true, returns only the first match; otherwise, returns all matches.
   * @returns A single entity, an array of entities, or null if not found.
   */
  findDescendantByTag(tags, onlyFirst = false) {
    const predicate = (entity) => {
      if (tags.length === 0) return false;
      return tags.every((tag) => entity.tags.includes(tag));
    };
    return this.findDescendant(predicate, onlyFirst);
  }
  /**
   * Disposes of the entity, its components, and its children.
   */
  dispose() {
    this.postDispose();
    this.onDispose();
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }
  /**
   * Updates the entity, its components, and its children.
   * @param deltaTime - Time elapsed since the last update in seconds.
   */
  processUpdate(deltaTime) {
    this.onUpdate(deltaTime);
    for (const child of this.children) {
      child.processUpdate(deltaTime);
    }
  }
  /**
   * Updates the entity, its components, and its children.
   * @param deltaTime - Time elapsed since the last update in seconds.
   */
  processPhysics(deltaTime) {
    this.onPhysics(deltaTime);
    for (const child of this.children) {
      child.processPhysics(deltaTime);
    }
  }
  /**
   * Collects entities and components that need rendering.
   * @param queue - The array to collect renderable entities.
   * @ignore
   */
  render(queue) {
    this.updateTransform();
    this.onRenderQueue(queue);
    if (this.onRender !== GameObject.prototype.onRender) {
      queue.push(this);
    }
    for (const child of this.children) {
      child.render(queue);
    }
  }
  /**
   * Prepares the entity's transform before rendering.
   * @ignore
   */
  beforeRender() {
    const transform = this.transform;
    this.rapid.matrixStack.setTransform(transform.getTransform());
  }
  /**
   * Hook for custom cleanup logic before disposal.
   */
  postDispose() {
    this.children.forEach((child) => {
      child.dispose();
    });
  }
  getMouseLocalPosition() {
    return this.game.input.getMouseLocal(this);
  }
  getMouseGlobalPosition() {
    return this.game.input.mousePosition;
  }
  static create(game, options) {
    const entity = new GameObject(game, options);
    options.components.forEach((c) => {
      entity.addComponent(c);
    });
    return entity;
  }
}
class CanvasLayer extends Component {
  constructor(options) {
    super(options);
    this.patchMethods = ["updateTransform"];
  }
  onAttach(entity) {
    super.onAttach(entity);
  }
  updateTransform() {
    this.entity.transform.identity();
  }
}
class Camera extends Component {
  constructor(options = {}) {
    super(options);
    this.patchMethods = ["updateTransform"];
    this.enable = false;
    this.center = false;
    this.positionSmoothingSpeed = 0;
    this.rotationSmoothingSpeed = 0;
    const entity = this.entity;
    this.center = options.center ?? true;
    this.positionSmoothingSpeed = options.positionSmoothingSpeed ?? 0;
    this.rotationSmoothingSpeed = options.rotationSmoothingSpeed ?? 0;
    this._currentRenderPosition = entity.position.clone();
    this._currentRenderRotation = entity.rotation;
    this.setEnable(options.enable ?? false);
  }
  /**
   * 设置此摄像机是否为当前场景的主摄像机。
   * @param isEnable 
   */
  setEnable(isEnable) {
    this.enable = isEnable;
    if (isEnable) {
      this.game.setMainCamera(this);
    } else if (this.game.mainCamera === this) {
      this.game.setMainCamera(null);
    }
  }
  onAttach(entity) {
    super.onAttach(entity);
  }
  /**
   * 每帧更新，用于平滑摄像机的【局部】变换属性。
   * @param deltaTime 
   */
  onUpdate(deltaTime) {
    super.onUpdate(deltaTime);
    const entity = this.entity;
    if (this.positionSmoothingSpeed > 0) {
      const factor = 1 - Math.exp(-this.positionSmoothingSpeed * deltaTime);
      this._currentRenderPosition.lerp(entity.position, factor);
    } else {
      this._currentRenderPosition.copy(entity.position);
    }
    if (this.rotationSmoothingSpeed > 0) {
      const factor = 1 - Math.exp(-this.rotationSmoothingSpeed * deltaTime);
      let diff = entity.rotation - this._currentRenderRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this._currentRenderRotation += diff * factor;
    } else {
      this._currentRenderRotation = entity.rotation;
    }
  }
  /**
   * 根据摄像机的【全局】变换计算最终的视图矩阵。
   * 这个方法现在正确地处理了父子关系。
   */
  updateTransform() {
    const entity = this.entity;
    const render = this.rapid;
    const parentTransform = entity.getParentTransform();
    const globalTransform = entity.transform;
    globalTransform.setTransform(parentTransform.getTransform());
    globalTransform.translate(this._currentRenderPosition);
    globalTransform.rotate(this._currentRenderRotation);
    globalTransform.scale(entity.scale);
    const viewMatrix = globalTransform.getInverse();
    if (this.center) {
      const centerX = render.logicWidth / 2;
      const centerY = render.logicHeight / 2;
      viewMatrix[4] = viewMatrix[0] * centerX + viewMatrix[2] * centerY + viewMatrix[4];
      viewMatrix[5] = viewMatrix[1] * centerX + viewMatrix[3] * centerY + viewMatrix[5];
    }
    entity.transform.setTransform(viewMatrix);
  }
  getTransform() {
    return this.entity.transform.getTransform();
  }
}
class Scene extends GameObject {
  /**
   * Initializes the scene.
   */
  create() {
  }
}
class Game {
  /**
   * Creates a new game instance.
   * @param options - Configuration options for the game.
   */
  constructor(options) {
    this.mainScene = null;
    this.isRunning = false;
    this.lastTime = 0;
    this.tweens = [];
    this.timers = [];
    this.mainCamera = null;
    this.renderQueue = [];
    this.worldTransform = new MatrixStack();
    this.render = new Rapid(options);
    this.input = new InputManager(this.render);
    this.asset = new AssetsLoader(this);
    this.audio = new AudioManager();
    this.physics = new PhysicsManager(this);
    this.texture = this.render.texture;
  }
  getMainScene() {
    return this.mainScene;
  }
  setMainCamera(camera) {
    this.mainCamera = camera;
  }
  /**
   * Switches to a new scene, disposing of the current one.
   * @param newScene - The new scene to switch to.
   */
  switchScene(newScene) {
    if (this.mainScene) {
      this.mainScene.dispose();
    }
    this.mainScene = newScene;
    newScene.create();
  }
  /**
   * Starts the game loop.
   */
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.gameLoop();
    }
  }
  /**
   * Stops the game loop.
   */
  stop() {
    this.isRunning = false;
  }
  /**
   * Adds an entity to the render queue.
   * @param entity - The entity to add.
   */
  addEntityRenderQueue(entity) {
    this.renderQueue.push(entity);
  }
  /**
   * Runs the game loop, updating and rendering the scene.
   * @private
   */
  gameLoop() {
    if (!this.isRunning) return;
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1e3;
    this.lastTime = currentTime;
    this.render.startRender();
    if (this.mainScene) {
      if (this.mainCamera && this.mainCamera.enable) {
        this.render.matrixStack.setTransform(this.mainCamera.getTransform());
      }
      this.worldTransform.setTransform(this.render.matrixStack.getTransform());
      this.mainScene.processUpdate(deltaTime);
      this.mainScene.processPhysics(deltaTime);
      this.mainScene.render(this.renderQueue);
      this.renderQueue.sort((a, b) => {
        const isBrother = a.parent && a.parent === b.parent;
        const global = a.globalZindex - b.globalZindex;
        if (global !== 0) {
          return global;
        }
        if (isBrother) {
          return a.localZindex - b.localZindex;
        }
        return 0;
      });
      this.renderQueue.forEach((entity) => {
        entity.beforeRender();
        entity.onRender(this.render);
      });
      this.renderQueue.length = 0;
    }
    this.render.endRender();
    this.input.updateNextFrame();
    this.updateTweens(deltaTime);
    this.updateTimers(deltaTime);
    requestAnimationFrame(this.gameLoop.bind(this));
  }
  destroy() {
    this.audio.destroy();
    this.input.destroy();
  }
  /**
   * Creates and starts a new timer that will be automatically updated by the game loop.
   * @param duration - The duration in seconds before the timer triggers.
   * @param onComplete - The function to call when the timer finishes.
   * @param repeat - If true, the timer will restart after completing. Defaults to false.
   * @returns The created Timer instance, allowing you to `stop()` it manually if needed.
   * @example
   * // Log a message after 2.5 seconds
   * game.createTimer(2.5, () => {
   *     console.log('Timer finished!');
   * });
   *
   * // Spawn an enemy every 5 seconds
   * const enemySpawner = game.createTimer(5, () => {
   *     scene.spawnEnemy();
   * }, true);
   */
  createTimer(duration, repeat = false) {
    const timer = new Timer(duration, repeat);
    this.timers.push(timer);
    timer.start();
    return timer;
  }
  /**
   * Updates all active timers and removes completed ones.
   * @param deltaTime - The time elapsed since the last frame.
   * @private
   */
  updateTimers(deltaTime) {
    for (const timer of this.timers) {
      timer.update(deltaTime);
    }
    this.timers = this.timers.filter((timer) => !timer.isFinished);
  }
  /**
   * Creates and starts a new tween animation.
   * The tween will be automatically updated by the game loop.
   * @template T - The type of the value being animated (e.g., Vec2, Color, number).
   * @param target - The object to animate.
   * @param property - The name of the property on the target to animate.
   * @param to - The final value of the property.
   * @param duration - The duration of the animation in seconds.
   * @param easing - The easing function to use. Defaults to Linear.
   * @returns The created Tween instance, allowing you to chain calls like .onComplete().
   * @example
   * // Tween a sprite's position over 2 seconds
   * game.createTween(mySprite, 'position', new Vec2(500, 300), 2, Easing.EaseOutQuad);
   *
   * // Tween a shape's color to red and do something on completion
   * game.createTween(myShape, 'color', Color.Red, 1.5)
   *     .onComplete(() => {
   *         console.log('Color tween finished!');
   *     });
   */
  createTween(target, property, to, duration, easing = Easing.Linear) {
    const tween = new Tween(target, property, to, duration, easing);
    this.tweens.push(tween);
    tween.start();
    return tween;
  }
  /**
   * Updates all active tweens and removes completed ones.
   * @param deltaTime - The time elapsed since the last frame.
   * @private
   */
  updateTweens(deltaTime) {
    for (const tween of this.tweens) {
      tween.update(deltaTime);
    }
    this.tweens = this.tweens.filter((tween) => !tween.isFinished);
  }
}
class Sprite extends Component {
  /**
   * Creates a new Sprite entity.
   * @param game - The game instance.
   * @param options - Configuration for the sprite's transform and initial texture.
   */
  constructor(options = {}) {
    super(options);
    this.animations = /* @__PURE__ */ new Map();
    this.currentAnimation = null;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.isPlaying = false;
    this.texture = options.texture ?? null;
    this.flipX = options.flipX ?? false;
    this.flipY = options.flipY ?? false;
    this.color = options.color ?? Color.White;
    this.offset = options.offset ?? Vec2.ZERO;
    if (options.animations) {
      this.setAnimations(options.animations);
    }
  }
  setAnimations(animations) {
    this.animations = new Map(Object.entries(animations));
  }
  /**
   * Defines a new animation sequence.
   * @param name - A unique name for the animation (e.g., "walk", "jump").
   * @param frames - An array of Textures to use as frames.
   * @param fps - The playback speed in frames per second.
   * @param loop - Whether the animation should repeat.
   */
  addAnimation(name, frames, fps = 10, loop = true) {
    this.animations.set(name, { name, frames, fps, loop });
  }
  /**
   * Plays an animation that has been previously defined with `addAnimation`.
   * @param name - The name of the animation to play.
   * @param forceRestart - If true, the animation will restart from the first frame even if it's already playing.
   */
  play(name, forceRestart = false) {
    const animation = this.animations.get(name);
    if (!animation) {
      console.warn(`Animation "${name}" not found.`);
      return;
    }
    if (this.currentAnimation === animation && !forceRestart) {
      if (!this.isPlaying) this.isPlaying = true;
      return;
    }
    this.currentAnimation = animation;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.isPlaying = true;
    this.texture = this.currentAnimation.frames[this.currentFrame];
  }
  /**
   * Stops the currently playing animation.
   * The sprite will remain on the current frame.
   */
  stop() {
    this.isPlaying = false;
  }
  /**
   * Updates the animation frame based on the elapsed time.
   * @param deltaTime - Time in seconds since the last frame.
   * @override
   */
  onUpdate(deltaTime) {
    if (!this.isPlaying || !this.currentAnimation) {
      return;
    }
    const frameDuration = 1 / this.currentAnimation.fps;
    this.frameTimer += deltaTime;
    while (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;
      this.currentFrame++;
      if (this.currentFrame >= this.currentAnimation.frames.length) {
        if (this.currentAnimation.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.currentAnimation.frames.length - 1;
          this.isPlaying = false;
          break;
        }
      }
    }
    this.texture = this.currentAnimation.frames[this.currentFrame];
  }
  /**
   * Renders the sprite's current texture to the screen.
   * @param render - The Rapid rendering instance.
   * @override
   */
  onRender(render) {
    if (this.texture) {
      render.renderSprite({
        texture: this.texture,
        flipX: this.flipX,
        flipY: this.flipY,
        offset: this.offset,
        color: this.color
      });
    }
  }
}
class Label extends Component {
  constructor(options) {
    super(options);
    this.text = new Text(this.game.render, options);
  }
  onRender(render) {
    render.renderSprite({
      texture: this.text
    });
  }
  /**
   * Updates the displayed text. Re-renders the texture if the text has changed.
   * @param text - The new text to display.
   */
  setText(text) {
    this.text.setText(text);
  }
}
class TileSet {
  /**
   * Creates a new TileSet instance.
   * @param width - The width of each tile in pixels
   * @param height - The height of each tile in pixels
   */
  constructor(width, height) {
    this.textures = /* @__PURE__ */ new Map();
    this.width = width;
    this.height = height;
  }
  /**
   * Registers a new tile with the given ID and options.
   * @param id - The unique identifier for the tile
   * @param options - The tile options or texture to register
   */
  setTile(id, options) {
    if (options instanceof Texture) {
      options = {
        texture: options
      };
    }
    this.textures.set(id, options);
  }
  /**
   * Retrieves the registered tile options for the given ID.
   * @param id - The unique identifier of the tile to retrieve
   * @returns The registered tile options, or undefined if not found
   */
  getTile(id) {
    return this.textures.get(id);
  }
}
class TileMapRender {
  /**
   * Creates a new TileMapRender instance.
   * @param rapid - The Rapid rendering instance to use.
   */
  constructor(rapid) {
    this.rapid = rapid;
  }
  /**
   * Calculates the error offset values for tile rendering.
   * @param options - Layer rendering options containing error values.
   * @returns Object containing x and y error offsets.
   * @private
   */
  getOffset(options) {
    const errorX = (options.error ? options.error.x : 2) + 1;
    const errorY = (options.error ? options.error.y : 2) + 1;
    return { errorX, errorY };
  }
  /**
   * Calculates tile rendering data based on the viewport and tileset.
   * @param tileSet - The tileset to use for rendering.
   * @param options - Layer rendering options.
   * @returns Object containing calculated tile rendering data.
   * @private
   */
  getTileData(tileSet, options) {
    const shape = options.shape ?? TilemapShape.SQUARE;
    const width = tileSet.width;
    const height = shape === TilemapShape.ISOMETRIC ? tileSet.height / 2 : tileSet.height;
    const matrix = this.rapid.matrixStack;
    const { errorX, errorY } = this.getOffset(options);
    const screenTopLeft = new Vec2(0, 0);
    const screenTopRight = new Vec2(this.rapid.width, 0);
    const screenBottomLeft = new Vec2(0, this.rapid.height);
    const screenBottomRight = new Vec2(this.rapid.width, this.rapid.height);
    const localTopLeft = matrix.globalToLocal(screenTopLeft);
    const localTopRight = matrix.globalToLocal(screenTopRight);
    const localBottomLeft = matrix.globalToLocal(screenBottomLeft);
    const localBottomRight = matrix.globalToLocal(screenBottomRight);
    const minX = Math.min(localTopLeft.x, localTopRight.x, localBottomLeft.x, localBottomRight.x);
    const maxX = Math.max(localTopLeft.x, localTopRight.x, localBottomLeft.x, localBottomRight.x);
    const minY = Math.min(localTopLeft.y, localTopRight.y, localBottomLeft.y, localBottomRight.y);
    const maxY = Math.max(localTopLeft.y, localTopRight.y, localBottomLeft.y, localBottomRight.y);
    const startTile = new Vec2(
      Math.floor(minX / width) - errorX,
      Math.floor(minY / height) - errorY
    );
    const endTile = new Vec2(
      Math.ceil(maxX / width) + errorX,
      Math.ceil(maxY / height) + errorY
    );
    const viewportWidth = endTile.x - startTile.x;
    const viewportHeight = endTile.y - startTile.y;
    return {
      startTile,
      viewportWidth,
      viewportHeight
    };
  }
  /**
   * Renders the tilemap layer based on the provided data and options.
   * This method collects all visible tiles and y-sortable objects into a single queue,
   * sorts them once by their y-coordinate, and then renders them in the correct order.
   *
   * @param data - A 2D array representing the tilemap data.
   * @param options - The rendering options for the tilemap layer.
   */
  renderLayer(data, options) {
    const tileSet = options.tileSet;
    const displayTiles = [];
    const {
      startTile,
      viewportWidth,
      viewportHeight
    } = this.getTileData(tileSet, options);
    const renderQueue = [];
    if (options.ySortCallback) {
      renderQueue.push(...options.ySortCallback);
    }
    for (let y = 0; y < viewportHeight; y++) {
      const mapY = y + startTile.y;
      if (mapY < 0 || mapY >= data.length) {
        continue;
      }
      for (let x = 0; x < viewportWidth; x++) {
        const mapX = x + startTile.x;
        if (mapX < 0 || mapX >= data[mapY].length) {
          continue;
        }
        const tileId = data[mapY][mapX];
        const tile = tileSet.getTile(tileId);
        if (!tile) {
          continue;
        }
        const localPos = this.mapToLocal(new Vec2(mapX, mapY), options);
        const ySort = localPos.y + (tile.ySortOffset ?? 0);
        const edata = options.eachTile ? options.eachTile(tileId, mapX, mapY) || {} : {};
        renderQueue.push({
          ySort,
          renderSprite: {
            ...tile,
            x: localPos.x + (tile.x || 0),
            y: localPos.y + (tile.y || 0),
            ...edata
          }
        });
        displayTiles.push(tile);
      }
    }
    const enableYSort = options.ySortCallback && options.ySortCallback.length > 0;
    if (enableYSort) {
      renderQueue.sort((a, b) => a.ySort - b.ySort);
    }
    for (const item of renderQueue) {
      if (item.render) {
        item.render();
      } else if (item.entity) {
        item.entity.onRender(this.rapid);
      } else if (item.renderSprite) {
        this.rapid.renderSprite(item.renderSprite);
      }
    }
    return displayTiles;
  }
  /**
   * Converts local coordinates to map coordinates.
   * @param local - The local coordinates.
   * @param options - The rendering options.
   * @returns The map coordinates.
   */
  localToMap(local, options) {
    const tileSet = options.tileSet;
    if (options.shape === TilemapShape.ISOMETRIC) {
      let outputX = 0, outputY = 0;
      const H = tileSet.height / 2;
      const W = tileSet.width / 2;
      let mapY = Math.floor(local.y / H);
      const isYEven = mapY % 2 === 0;
      let mapX = Math.floor(local.x / W);
      const isXEven = mapX % 2 === 0;
      const xRatio = local.x % W / W;
      const yRatio = local.y % H / H;
      const up2down = yRatio < xRatio;
      const down2up = yRatio < 1 - xRatio;
      if (!isYEven) mapY -= 1;
      if (up2down && (!isXEven && isYEven)) {
        mapY -= 1;
      } else if (!up2down && (isXEven && !isYEven)) {
        mapY += 1;
        mapX -= 2;
      } else if (down2up && (isXEven && isYEven)) {
        mapX -= 2;
        mapY -= 1;
      } else if (!down2up && (!isXEven && !isYEven)) {
        mapY += 1;
      }
      outputX = mapX;
      outputY = mapY;
      outputX = Math.floor(mapX / 2);
      return new Vec2(outputX, outputY);
    } else {
      return new Vec2(
        Math.floor(local.x / tileSet.width),
        Math.floor(local.y / tileSet.height)
      );
    }
  }
  /**
   * Converts map coordinates to local coordinates.
   * @param map - The map coordinates.
   * @param options - The rendering options.
   * @returns The local coordinates.
   */
  mapToLocal(map, options) {
    const tileSet = options.tileSet;
    if (options.shape === TilemapShape.ISOMETRIC) {
      let pos = new Vec2(
        map.x * tileSet.width,
        map.y * tileSet.height / 2
      );
      if (map.y % 2 !== 0) {
        pos.x += tileSet.width / 2;
      }
      return pos;
    } else {
      return new Vec2(
        map.x * tileSet.width,
        map.y * tileSet.height
      );
    }
  }
}
const _Tilemap = class _Tilemap extends Component {
  /**
   * Creates a tilemap entity.
   * @param game - The game instance this tilemap belongs to.
   * @param options - Configuration options for the tilemap.
   */
  constructor(options) {
    super(options);
    this.error = new Vec2(_Tilemap.DEFAULT_ERROR);
    this.data = [[]];
    this.ySortCallback = [];
    this.displayTiles = [];
    this.patchMethods = ["render"];
    this.error = options.error ?? new Vec2(_Tilemap.DEFAULT_ERROR);
    this.tileSet = options.tileSet;
    this.shape = options.shape ?? TilemapShape.SQUARE;
    this.eachTile = options.eachTile;
    this.enableYsort = options.enableYsort ?? false;
  }
  /**
   * Collects renderable entities, excluding children unless they override onRender.
   * @param queue - The array to collect renderable entities.
   */
  render(queue) {
    if (this.enableYsort) {
      if (this.onRender !== GameObject.prototype.onRender) {
        queue.push(this.entity);
      }
    } else {
      this.callOriginal("render", queue);
    }
  }
  /**
   * Sets a tile at the specified map coordinates.
   * @param x - The X coordinate (column) on the map.
   * @param y - The Y coordinate (row) on the map.
   * @param tileId - The tile ID to set (number or string).
   * @returns True if the tile was set successfully, false if coordinates are out of bounds.
   */
  setTile(x, y, tileId) {
    if (y < 0 || y >= this.data.length || x < 0 || x >= this.data[y].length) {
      console.warn(`Tilemap.setTile: Coordinates (${x}, ${y}) are out of bounds.`);
      return false;
    }
    this.data[y][x] = tileId;
    return true;
  }
  /**
   * Gets the tile ID at the specified map coordinates.
   * @param x - The X coordinate (column) on the map.
   * @param y - The Y coordinate (row) on the map.
   * @returns The tile ID (number or string) or undefined if coordinates are out of bounds.
   */
  getTile(x, y) {
    if (y < 0 || y >= this.data.length || x < 0 || x >= this.data[y].length) {
      return void 0;
    }
    return this.data[y][x];
  }
  /**
   * Removes a tile at the specified map coordinates (sets it to EMPTY_TILE).
   * @param x - The X coordinate (column) on the map.
   * @param y - The Y coordinate (row) on the map.
   * @returns True if the tile was removed successfully, false if coordinates are out of bounds.
   */
  removeTile(x, y) {
    return this.setTile(x, y, _Tilemap.EMPTY_TILE);
  }
  /**
   * Fills a rectangular area with a specified tile ID.
   * @param tileId - The tile ID to use for filling.
   * @param startX - The starting X coordinate.
   * @param startY - The starting Y coordinate.
   * @param width - The width of the fill area.
   * @param height - The height of the fill area.
   */
  fill(tileId, startX, startY, width, height) {
    const endX = startX + width;
    const endY = startY + height;
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        this.setTile(x, y, tileId);
      }
    }
  }
  /**
   * Replaces the entire tilemap data and updates dimensions.
   * @param newData - The new 2D array of tile data.
   */
  setData(newData) {
    this.data = newData;
  }
  /**
   * Converts local coordinates to map coordinates.
   * @param local - The local coordinates to convert.
   */
  localToMap(local) {
    this.rapid.tileMap.localToMap(local, this.options);
  }
  /**
   * Converts map coordinates to local coordinates.
   * @param local - The map coordinates to convert.
   */
  mapToLocal(local) {
    this.rapid.tileMap.mapToLocal(local, this.options);
  }
  /**
   * Renders the tilemap layer.
   * @param render - The rendering engine instance.
   */
  onRender(render) {
    const ySortCallback = [...this.ySortCallback];
    const entity = this.entity;
    if (this.enableYsort) {
      entity.children.forEach((child) => {
        ySortCallback.push({
          ySort: child.localZindex,
          entity: child
        });
      });
    }
    this.displayTiles = render.renderTileMapLayer(this.data, {
      ...this.options,
      ySortCallback
    });
  }
};
_Tilemap.DEFAULT_ERROR = 0;
_Tilemap.EMPTY_TILE = -1;
let Tilemap = _Tilemap;
class Rapid {
  /**
   * Constructs a new `Rapid` instance with the given options.
   * @param options - Options for initializing the `Rapid` instance.
   */
  constructor(options) {
    this.projectionDirty = true;
    this.matrixStack = new MatrixStack();
    this.tileMap = new TileMapRender(this);
    this.light = new LightManager(this);
    this.defaultColor = new Color(255, 255, 255, 255);
    this.regions = /* @__PURE__ */ new Map();
    this.currentMaskType = [];
    this.currentTransform = [];
    this.currentFBO = [];
    this.lastTime = 0;
    const gl = getContext(options.canvas);
    this.gl = gl;
    this.canvas = options.canvas;
    this.texture = new TextureCache(this, options.antialias ?? false);
    this.maxTextureUnits = gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
    this.width = options.width || this.canvas.width;
    this.height = options.height || this.canvas.height;
    this.scaleEnable = options.scaleEnable ?? false;
    this.scaleRadio = options.scaleRadio || ScaleRadio.KEEP;
    this.devicePixelRatio = options.devicePixelRatio ?? window.devicePixelRatio ?? 1;
    this.backgroundColor = options.backgroundColor || new Color(255, 255, 255, 255);
    this.registerBuildInRegion();
    this.initWebgl(gl);
    this.updateDisplaySize(this.width, this.height);
    this.projectionDirty = false;
    this.canvas.style.display = "block";
  }
  /**
   * @param displayWdith css px size
   * @param displayHeight css px size
   */
  updateDisplaySize(displayWdith, displayHeight) {
    const designW = this.width;
    const designH = this.height;
    let logicW;
    let logicH;
    let physicsW;
    let physicsH;
    if (this.scaleEnable) {
      const designAspect = designW / designH;
      const windowAspect = displayWdith / displayHeight;
      switch (this.scaleRadio) {
        case ScaleRadio.IGNORE:
          logicW = designW;
          logicH = designH;
          physicsW = displayWdith * this.devicePixelRatio;
          physicsH = displayHeight * this.devicePixelRatio;
          break;
        case ScaleRadio.KEEP:
          logicW = designW;
          logicH = designH;
          let targetW;
          let targetH;
          if (windowAspect > designAspect) {
            targetH = displayHeight;
            targetW = targetH * designAspect;
          } else {
            targetW = displayWdith;
            targetH = targetW / designAspect;
          }
          physicsW = targetW * this.devicePixelRatio;
          physicsH = targetH * this.devicePixelRatio;
          break;
        case ScaleRadio.EXPAND:
          if (windowAspect > designAspect) {
            logicH = designH;
            logicW = designH * windowAspect;
          } else {
            logicW = designW;
            logicH = designW / windowAspect;
          }
          physicsW = displayWdith * this.devicePixelRatio;
          physicsH = displayHeight * this.devicePixelRatio;
          break;
        case ScaleRadio.KEEP_W:
          logicW = designW;
          logicH = designW / windowAspect;
          physicsW = displayWdith * this.devicePixelRatio;
          physicsH = displayHeight * this.devicePixelRatio;
          break;
        case ScaleRadio.KEEP_H:
          logicH = designH;
          logicW = designH * windowAspect;
          physicsW = displayWdith * this.devicePixelRatio;
          physicsH = displayHeight * this.devicePixelRatio;
          break;
        default:
          logicW = designW;
          logicH = designH;
          physicsW = displayWdith * this.devicePixelRatio;
          physicsH = displayHeight * this.devicePixelRatio;
          break;
      }
    } else {
      logicW = designW;
      logicH = designH;
      physicsW = designW * this.devicePixelRatio;
      physicsH = designH * this.devicePixelRatio;
    }
    this.logicWidth = logicW;
    this.logicHeight = logicH;
    this.physicsWidth = physicsW;
    this.physicsHeight = physicsH;
    this.resizeSize(logicW, logicH, physicsW, physicsH, true);
  }
  resizeSize(logicW, logicH, physicsW, physicsH, updateCanvas = false) {
    this.updateProjection(0, logicW, logicH, 0);
    this.gl.viewport(0, 0, physicsW, physicsH);
    this.gl.scissor(0, 0, physicsW, physicsH);
    if (updateCanvas) {
      this.canvas.width = physicsW;
      this.canvas.height = physicsH;
      this.canvas.style.width = physicsW / this.devicePixelRatio + "px";
      this.canvas.style.height = physicsH / this.devicePixelRatio + "px";
    }
  }
  updateProjection(left, right, bottom, top) {
    this.projection = this.createOrthMatrix(left, right, bottom, top);
    this.projectionDirty = true;
  }
  /**
   * Initializes WebGL context settings.
   * @param gl - The WebGL context.
   */
  initWebgl(gl) {
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.STENCIL_TEST);
    gl.enable(gl.SCISSOR_TEST);
  }
  /**
   * @ignore
   */
  clearTextureUnit() {
    for (let i = 0; i < this.maxTextureUnits; i++) {
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }
  }
  /**
   * Registers built-in regions such as sprite and graphic regions.
   */
  registerBuildInRegion() {
    this.registerRegion("sprite", SpriteRegion);
    this.registerRegion("graphic", GraphicRegion);
  }
  /**
   * Registers a custom render region with a specified name.
   * @param name - The name of the region.
   * @param regionClass - The class of the region to register.
   */
  registerRegion(name, regionClass) {
    this.regions.set(name, new regionClass(this));
  }
  quitCurrentRegion() {
    if (this.currentRegion && this.currentRegion.hasPendingContent()) {
      this.currentRegion.render();
      this.currentRegion.exitRegion();
    }
  }
  /**
   * Sets the current render region by name and optionally a custom shader.
   * @param regionName - The name of the region to set as current.
   * @param customShader - An optional custom shader to use with the region.
   * @param hasUnifrom - have costum unifrom
   */
  setRegion(regionName, customShader) {
    if (
      // isRegionChanged
      regionName != this.currentRegionName || // isShaderChanged
      this.currentRegion && this.currentRegion.isShaderChanged(customShader)
    ) {
      const region = this.regions.get(regionName);
      this.quitCurrentRegion();
      this.currentRegion = region;
      this.currentRegionName = regionName;
      region.enterRegion(customShader);
    }
  }
  /**
   * Saves the current matrix state to the stack.
   */
  save() {
    this.matrixStack.pushMat();
  }
  /**
   * Restores the matrix state from the stack.
   */
  restore() {
    this.matrixStack.popMat();
  }
  /**
   * Executes a callback function within a saved and restored matrix state scope.
   * @param cb - The callback function to execute within the saved and restored matrix state scope.
   */
  withTransform(cb) {
    this.save();
    cb();
    this.restore();
  }
  /**
   * Starts the rendering process, resetting the matrix stack and clearing the current region.
   * @param clear - Whether to clear the matrix stack. Defaults to true.
   */
  startRender(clear = true) {
    this.clear();
    clear && this.matrixStack.clear();
    this.matrixStack.pushIdentity();
    this.currentRegion = void 0;
    this.currentRegionName = void 0;
    const now = performance.now();
    const dt = this.lastTime ? (now - this.lastTime) / 1e3 : 0;
    this.lastTime = now;
    return dt;
  }
  /**
   * Ends the rendering process by rendering the current region.
   */
  endRender() {
    this.currentRegion?.render();
    this.projectionDirty = false;
  }
  /**
   * Render
   * @param cb - The function to render.
   */
  render(cb) {
    const dt = this.startRender();
    cb(dt);
    this.endRender();
  }
  /**
   * Render a tile map layer.
   * @param data - The map data to render.
   * @param options - The options for rendering the tile map layer.
   */
  renderTileMapLayer(data, options) {
    return this.tileMap.renderLayer(data, options instanceof TileSet ? { tileSet: options } : options);
  }
  /**
   * Renders a sprite with the specified options.
   * 
   * @param options - The rendering options for the sprite, including texture, position, color, and shader.
   */
  renderSprite(options) {
    const texture = options.texture;
    if (!texture || !texture.base) return;
    const { offsetX, offsetY } = this.startDraw(options, texture.width, texture.height);
    this.setRegion("sprite", options.shader);
    this.currentRegion.renderSprite(
      texture.base.texture,
      texture.width,
      texture.height,
      texture.clipX,
      texture.clipY,
      texture.clipW,
      texture.clipH,
      offsetX,
      offsetY,
      (options.color || this.defaultColor).uint32,
      options.uniforms,
      options.flipX,
      options.flipY
    );
    this.afterDraw();
  }
  /**
   * Renders a texture directly without additional options.
   * This is a convenience method that calls renderSprite with just the texture.
   * 
   * @param texture - The texture to render at the current transformation position.
   */
  renderTexture(texture) {
    if (!texture.base) return;
    this.renderSprite({ texture });
  }
  /**
   * Renders a line with the specified options.
   * 
   * @param options - The options for rendering the line, including points, color, width, and join/cap types.
   */
  renderLine(options) {
    const linePoints = options.closed ? [...options.points, options.points[0]] : options.points;
    const { vertices, uv } = getLineGeometry({ ...options, points: linePoints });
    this.renderGraphic({ ...options, drawType: this.gl.TRIANGLES, points: vertices, uv });
  }
  /**
   * Renders graphics based on the provided options.
   * 
   * @param options - The options for rendering the graphic, including points, color, texture, and draw type.
   */
  renderGraphic(options) {
    this.startGraphicDraw(options);
    options.points.forEach((vec, index) => {
      const color = Array.isArray(options.color) ? options.color[index] : options.color;
      const uv = options.uv?.[index];
      this.addGraphicVertex(vec.x, vec.y, uv, color);
    });
    this.endGraphicDraw();
  }
  /**
   * Starts the graphic drawing process.
   * 
   * @param options - The options for the graphic drawing, including shader, texture, and draw type.
   */
  startGraphicDraw(options) {
    const { offsetX, offsetY } = this.startDraw(options);
    this.setRegion("graphic", options.shader);
    const currentRegion = this.currentRegion;
    currentRegion.startRender(offsetX, offsetY, options.texture, options.uniforms);
    if (options.drawType) {
      currentRegion.drawType = options.drawType;
    }
  }
  /**
   * Adds a vertex to the current graphic being drawn.
   * 
   * @param offsetX - The X coordinate of the vertex.
   * @param offsetY - The Y coordinate of the vertex.
   * @param uv - The texture UV coordinates for the vertex.
   * @param color - The color of the vertex. Defaults to the renderer's default color.
   */
  addGraphicVertex(offsetX, offsetY, uv, color) {
    const currentRegion = this.currentRegion;
    currentRegion.addVertex(offsetX, offsetY, uv?.x, uv?.y, (color || this.defaultColor).uint32);
  }
  /**
   * Completes the graphic drawing process and renders the result.
   */
  endGraphicDraw() {
    const currentRegion = this.currentRegion;
    currentRegion.render();
    this.afterDraw();
  }
  startDraw(options, width = 0, height = 0) {
    this.currentTransform.push(options);
    return this.matrixStack.applyTransform(options, width, height);
  }
  afterDraw() {
    if (this.currentTransform.length > 0) {
      this.matrixStack.applyTransformAfter(this.currentTransform.pop());
    }
  }
  /**
   * Renders a rectangle with the specified options.
   * 
   * @param options - The options for rendering the rectangle, including width, height, position, and color.
   */
  renderRect(options) {
    const { width, height } = options;
    const points = [
      new Vec2(0, 0),
      new Vec2(width, 0),
      new Vec2(width, height),
      new Vec2(0, height)
    ];
    this.renderGraphic({ ...options, points, drawType: this.gl.TRIANGLE_FAN });
  }
  /**
   * Renders a circle with the specified options.
   * 
   * @param options - The options for rendering the circle, including radius, position, color, and segment count.
   */
  renderCircle(options) {
    const segments = options.segments || 32;
    const radius = options.radius;
    const color = options.color || this.defaultColor;
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      points.push(new Vec2(x, y));
    }
    this.renderGraphic({ ...options, points, color, drawType: this.gl.TRIANGLE_FAN });
  }
  /**
   * Clears the canvas with the background color.
   * @param bgColor - The background color to clear the canvas with.
   */
  clear(bgColor) {
    const gl = this.gl;
    const c = bgColor || this.backgroundColor;
    gl.clearColor(c.r / 255, c.g / 255, c.b / 255, c.a / 255);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.clearMask();
  }
  /**
   * Creates an orthogonal projection matrix.
   * @param left - The left bound of the projection.
   * @param right - The right bound of the projection.
   * @param bottom - The bottom bound of the projection.
   * @param top - The top bound of the projection.
   * @returns The orthogonal projection matrix as a `Float32Array`.
   */
  createOrthMatrix(left, right, bottom, top) {
    return new Float32Array([
      2 / (right - left),
      0,
      0,
      0,
      0,
      2 / (top - bottom),
      0,
      0,
      0,
      0,
      -1,
      0,
      -(right + left) / (right - left),
      -(top + bottom) / (top - bottom),
      0,
      1
    ]);
  }
  /**
   * Draw a mask. Automatically calls startDrawMask.
   * @param type - The type of mask to draw.
   * @param cb - The callback function to execute.
   */
  drawMask(type = MaskType.Include, cb) {
    this.startDrawMask(type);
    cb();
    this.endDrawMask();
  }
  /**
   * Start drawing a mask using the stencil buffer.
   * This method configures the WebGL context to begin defining a mask area.
   */
  startDrawMask(type = MaskType.Include) {
    const gl = this.gl;
    this.currentMaskType.push(type);
    this.setMaskType(type, true);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.colorMask(false, false, false, false);
  }
  /**
   * End the mask drawing process.
   * This method configures the WebGL context to use the defined mask for subsequent rendering.
   */
  endDrawMask() {
    const gl = this.gl;
    this.quitCurrentRegion();
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    gl.colorMask(true, true, true, true);
    this.setMaskType(this.currentMaskType.pop() ?? MaskType.Include, false);
  }
  /**
   * Set the mask type for rendering
   * @param type - The mask type to apply
   * @param start - Whether this is the start of mask drawing
   */
  setMaskType(type, start = false) {
    const gl = this.gl;
    this.quitCurrentRegion();
    if (start) {
      this.clearMask();
      gl.stencilFunc(gl.ALWAYS, 1, 255);
    } else {
      switch (type) {
        case MaskType.Include:
          gl.stencilFunc(gl.EQUAL, 1, 255);
          break;
        case MaskType.Exclude:
          gl.stencilFunc(gl.NOTEQUAL, 1, 255);
          break;
      }
    }
  }
  /**
   * Clear the current mask by clearing the stencil buffer.
   * This effectively removes any previously defined mask.
   */
  clearMask() {
    const gl = this.gl;
    this.quitCurrentRegion();
    gl.clearStencil(0);
    gl.clear(gl.STENCIL_BUFFER_BIT);
    gl.stencilFunc(gl.ALWAYS, 1, 255);
  }
  /**
   * Creates a custom shader.
   * @param vs - Vertex shader code.
   * @param fs - Fragment shader code.
   * @param type - Shader type.
   * @returns The created shader object.
   */
  createCostumShader(vs, fs, type, textureUnitNum = 0) {
    return GLShader.createCostumShader(this, vs, fs, type, textureUnitNum);
  }
  /**
   * Starts rendering to a Frame Buffer Object (FBO)
   * Sets up the FBO for rendering by binding it, adjusting viewport size and projection
   * @param fbo - The Frame Buffer Object to render to
   */
  startFBO(fbo, color = this.defaultColor) {
    this.quitCurrentRegion();
    fbo.bind(color);
    this.clearTextureUnit();
    this.resizeSize(fbo.width, fbo.height, fbo.width, fbo.height);
    this.updateProjection(0, fbo.width, 0, fbo.height);
    this.save();
    this.matrixStack.identity();
    this.currentFBO.push(fbo);
  }
  /**
   * Ends rendering to a Frame Buffer Object
   * Restores the default framebuffer and original viewport settings
   * @param fbo - The Frame Buffer Object to unbind
   */
  endFBO() {
    if (this.currentFBO.length > 0) {
      const fbo = this.currentFBO.pop();
      this.quitCurrentRegion();
      fbo.unbind();
      this.clearTextureUnit();
      this.resizeSize(
        this.logicWidth,
        this.logicHeight,
        this.physicsWidth,
        this.physicsHeight
      );
      this.restore();
    }
  }
  /**
   * Convenience method to render to a Frame Buffer Object
   * Handles starting and ending the FBO rendering automatically
   * @param fbo - The Frame Buffer Object to render to
   * @param cb - Callback function containing render commands to execute on the FBO
   */
  drawToFBO(fbo, cb) {
    this.startFBO(fbo);
    cb();
    this.endFBO();
  }
  /**
   * Set the blend mode for rendering
   * @param mode - The blend mode to apply
   */
  setBlendMode(mode) {
    switch (mode) {
      case BlendMode.Additive:
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
        break;
      case BlendMode.Subtractive:
        this.gl.blendFunc(this.gl.ZERO, this.gl.ONE_MINUS_SRC_COLOR);
        break;
      case BlendMode.Mix:
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        break;
    }
  }
  /**
   * Render light shadow
   * @param occlusion - The occlusion polygon
   * @param lightSource - The light source position
   */
  drawLightShadowMask(options) {
    this.startDrawMask(options.type || MaskType.Exclude);
    const shadowPolygon = this.light.createLightShadowMaskPolygon(options.occlusion, options.lightSource, options.baseProjectionLength);
    shadowPolygon.forEach((polygon) => {
      this.renderGraphic({
        points: polygon,
        color: Color.Black
      });
    });
    this.endDrawMask();
  }
  cssToGameCoords(x, y) {
    const css = x instanceof Vec2 ? x : new Vec2(x, y);
    const rect = this.canvas.getBoundingClientRect();
    const normalizedX = css.x / rect.width;
    const normalizedY = css.y / rect.height;
    const gameX = normalizedX * this.logicWidth;
    const gameY = normalizedY * this.logicHeight;
    return new Vec2(gameX, gameY);
  }
  gameToCssCoords(x, y) {
    const gameCoords = x instanceof Vec2 ? x : new Vec2(x, y ?? 0);
    const rect = this.canvas.getBoundingClientRect();
    const normalizedX = gameCoords.x / this.logicWidth;
    const normalizedY = gameCoords.y / this.logicHeight;
    const cssXRelativeToCanvas = normalizedX * rect.width;
    const cssYRelativeToCanvas = normalizedY * rect.height;
    const cssX = cssXRelativeToCanvas;
    const cssY = cssYRelativeToCanvas;
    return new Vec2(cssX, cssY);
  }
}
class Uniform {
  constructor(data) {
    this.isDirty = false;
    this.data = data;
  }
  setUniform(key, data) {
    if (this.data[key] != data) {
      this.isDirty = true;
    }
    this.data[key] = data;
  }
  /**
   * @ignore
   */
  clearDirty() {
    this.isDirty = false;
  }
  getUnifromNames() {
    return Object.keys(this.data);
  }
  bind(gl, uniformName, loc, region) {
    if (!loc) return;
    const value = this.data[uniformName];
    if (typeof value === "number") {
      gl.uniform1f(loc, value);
    } else if (Array.isArray(value)) {
      switch (value.length) {
        case 1:
          if (Number.isInteger(value[0])) {
            gl.uniform1i(loc, value[0]);
          } else {
            gl.uniform1f(loc, value[0]);
          }
          break;
        case 2:
          if (Number.isInteger(value[0])) {
            gl.uniform2iv(loc, value);
          } else {
            gl.uniform2fv(loc, value);
          }
          break;
        case 3:
          if (Number.isInteger(value[0])) {
            gl.uniform3iv(loc, value);
          } else {
            gl.uniform3fv(loc, value);
          }
          break;
        case 4:
          if (Number.isInteger(value[0])) {
            gl.uniform4iv(loc, value);
          } else {
            gl.uniform4fv(loc, value);
          }
          break;
        case 9:
          gl.uniformMatrix3fv(loc, false, value);
          break;
        case 16:
          gl.uniformMatrix4fv(loc, false, value);
          break;
        default:
          console.error(`Unsupported uniform array length for ${uniformName}:`, value.length);
          break;
      }
    } else if (typeof value === "boolean") {
      gl.uniform1i(loc, value ? 1 : 0);
    } else if (value.base?.texture) {
      const usedTextureUnit = region.useTexture(value.base.texture)[0];
      gl.uniform1i(loc, usedTextureUnit);
    } else {
      console.error(`Unsupported uniform type for ${uniformName}:`, typeof value);
    }
  }
}
const DEFAULT_EMIT_RATE = 10;
const DEFAULT_EMIT_TIME = 0;
const DEFAULT_LOCAL_SPACE = true;
class Particle {
  /**
   * Creates a new particle instance
   * @param rapid - The Rapid renderer instance
   * @param options - Particle configuration options
   */
  constructor(emitter, options) {
    this.life = 0;
    this.datas = {};
    this.emitter = emitter;
    this.rapid = emitter.rapid;
    this.options = options;
    if (options.texture instanceof Texture) {
      this.texture = options.texture;
    } else if (options.texture instanceof Array && options.texture[0] instanceof Array) {
      this.texture = Random.pickWeight(options.texture);
    } else if (options.texture instanceof Array) {
      this.texture = Random.pick(options.texture);
    }
    this.collider = new CircleCollider(emitter.entity, options.colliderRaduis ?? 10);
    this.collider.extraData = this;
    this.maxLife = Random.scalarOrRange(options.life, 1);
    this.datas = {
      speed: this.processAttribute(options.animation.speed, 0),
      rotation: this.processAttribute(options.animation.rotation, 0),
      scale: this.processAttribute(options.animation.scale, 1),
      color: this.processAttribute(options.animation.color, Color.White),
      velocity: this.processAttribute(options.animation.velocity, Vec2.ZERO),
      acceleration: this.processAttribute(options.animation.acceleration, Vec2.ZERO)
    };
    this.position = Vec2.ZERO;
    this.initializePosition();
  }
  processAttribute(attribute, defaultData) {
    if (!attribute) return { value: defaultData };
    if (isPlainObject(attribute)) {
      const attr = attribute;
      const start = Random.scalarOrRange(attr.start, defaultData);
      const end = Random.scalarOrRange(attr.end || start, defaultData);
      return {
        delta: attr.delta ?? this.getDelta(start, end, this.maxLife),
        value: start,
        damping: attr.damping
      };
    } else {
      return this.processAttribute({ start: attribute }, defaultData);
    }
  }
  updateDamping(deltaTime) {
    for (const att of Object.values(this.datas)) {
      if (att.damping) {
        const value = att.value;
        const timeBasedDamping = Math.pow(att.damping, deltaTime);
        if (typeof value === "number") {
          att.value *= timeBasedDamping;
        } else if (value.multiply) {
          att.value = value.multiply(timeBasedDamping);
        }
      }
    }
  }
  updateDelta(deltaTime) {
    const datas = this.datas;
    for (const att of Object.values(datas)) {
      if (att.delta) {
        const value = att.value;
        if (typeof value === "number") {
          att.value += deltaTime * att.delta;
        } else if (value.add) {
          att.value = value.add(att.delta.multiply(deltaTime));
        }
      }
    }
    datas.color.value.clamp();
    datas.velocity.value = datas.velocity.value.add(datas.acceleration.value.multiply(deltaTime));
    const direction = Vec2.fromAngle(datas.rotation.value);
    const speedOffset = direction.multiply(datas.speed.value * deltaTime);
    this.position = this.position.add(speedOffset).add(datas.velocity.value.multiply(deltaTime));
  }
  getDelta(start, end, lifeTime) {
    if (lifeTime === 0) return start;
    if (typeof start === "number" && typeof end === "number") {
      return (end - start) / lifeTime;
    } else if (start instanceof Vec2 && end instanceof Vec2) {
      return end.subtract(start).divide(lifeTime);
    } else if (start instanceof Color && end instanceof Color) {
      return end.subtract(start).divide(lifeTime);
    }
    return start;
  }
  updateOffset() {
    if (this.options.localSpace) {
      this.collider.offset = this.position;
    } else {
      const entityGlobalPos = this.emitter.entity.transform.getGlobalPosition();
      this.collider.offset = entityGlobalPos.subtract(this.position);
    }
  }
  /**
   * Updates particle state
   * @param deltaTime - Time in seconds since last update
   * @returns Whether the particle is still active
   */
  update(deltaTime) {
    this.life += deltaTime;
    if (this.life >= this.maxLife) {
      return false;
    }
    this.updateDamping(deltaTime);
    this.updateDelta(deltaTime);
    return true;
  }
  /**
   * Renders the particle at a given position.
   */
  render() {
    this.rapid.renderSprite({
      ...this.options,
      position: this.position,
      scale: this.datas.scale.value,
      rotation: this.datas.rotation.value,
      color: this.datas.color.value,
      texture: this.texture
    });
  }
  initializePosition() {
    switch (this.options.emitShape) {
      case ParticleShape.POINT:
        this.position = Vec2.ZERO;
        break;
      case ParticleShape.CIRCLE:
        const angle = Math.random() * Math.PI * 2;
        const radius = (this.options.emitRadius || 0) * Math.sqrt(Math.random());
        this.position = new Vec2(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius
        );
        break;
      case ParticleShape.RECT:
        this.position = new Vec2(
          (Math.random() - 0.5) * (this.options.emitRect?.width || 0),
          (Math.random() - 0.5) * (this.options.emitRect?.height || 0)
        );
        break;
    }
    if (!this.options.localSpace) {
      this.position.addSelf(this.emitter.entity.transform.getGlobalPosition());
    }
  }
}
class ParticleEmitter extends Component {
  /**
   * Creates a new particle emitter
   * @param rapid - The Rapid renderer instance
   * @param options - Emitter configuration options
   */
  constructor(options) {
    super(options);
    this.particles = [];
    this.emitting = false;
    this.emitTimer = 0;
    this.emitRate = DEFAULT_EMIT_RATE;
    this.emitTime = DEFAULT_EMIT_TIME;
    this.emitTimeCounter = 0;
    this.localSpace = DEFAULT_LOCAL_SPACE;
    this.emitRate = options.emitRate ?? DEFAULT_EMIT_RATE;
    this.emitTime = options.emitTime ?? DEFAULT_EMIT_TIME;
    this.localSpace = options.localSpace ?? DEFAULT_LOCAL_SPACE;
  }
  /**
   * Sets particle emission rate.
   * In continuous mode (`emitTime`=0), this is particles per second.
   * In burst mode (`emitTime`>0), this is particles per burst.
   * @param rate - The emission rate.
   */
  setEmitRate(rate) {
    this.emitRate = rate;
  }
  /**
   * Sets time interval between emissions. Set to 0 for continuous emission.
   * @param time - Time interval in seconds
   */
  setEmitTime(time) {
    this.emitTime = time;
  }
  /**
   * Starts emitting particles
   */
  start() {
    this.emitting = true;
    this.emitTimer = 0;
    this.emitTimeCounter = 0;
  }
  /**
   * Stops emitting new particles but allows existing ones to complete their lifecycle
   */
  stop() {
    this.emitting = false;
  }
  /**
   * Clears all particles and resets the emitter
   */
  clear() {
    this.particles = [];
    this.emitTimer = 0;
    this.emitTimeCounter = 0;
  }
  /**
   * Emits a specified number of particles immediately.
   * @param count - Number of particles to emit
   */
  emit(count) {
    this.entity;
    const actualCount = Math.floor(Math.min(count, (this.options.maxParticles || Infinity) - this.particles.length));
    for (let i = 0; i < actualCount; i++) {
      const particle = new Particle(this, { ...this.options, localSpace: this.localSpace });
      this.particles.unshift(particle);
    }
  }
  /**
   * Updates particle emitter state
   * @param deltaTime - Time in seconds since last update
   */
  onUpdate(deltaTime) {
    if (this.emitting && this.emitRate > 0) {
      if (this.emitTime > 0) {
        this.emitTimeCounter += deltaTime;
        while (this.emitTimeCounter >= this.emitTime) {
          this.emit(this.emitRate);
          this.emitTimeCounter -= this.emitTime;
        }
      } else {
        this.emitTimer += deltaTime;
        const timePerParticle = 1 / this.emitRate;
        while (this.emitTimer >= timePerParticle) {
          this.emit(1);
          this.emitTimer -= timePerParticle;
        }
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (!this.particles[i].update(deltaTime)) {
        this.particles.splice(i, 1);
      }
    }
  }
  /**
   * Renders all particles
   */
  onRender() {
    this.rapid.save();
    if (!this.localSpace) {
      const worldTransform = this.game.worldTransform;
      this.rapid.matrixStack.setTransform(worldTransform.getTransform());
    }
    for (const particle of this.particles) {
      particle.render();
    }
    this.rapid.restore();
  }
  /**
   * Gets current particle count
   */
  getParticleCount() {
    return this.particles.length;
  }
  /**
   * Checks if the particle emitter is active (has particles or is emitting)
   */
  isActive() {
    return this.emitting || this.particles.length > 0;
  }
  /**
   * Triggers a single burst of particles, regardless of whether the emitter is running.
   * The number of particles is determined by `emitRate`.
   */
  oneShot() {
    this.emit(this.emitRate);
  }
}
export {
  ArrayType,
  BaseTexture,
  BlendMode,
  Body,
  BodyType,
  Camera,
  CanvasLayer,
  CircleCollider,
  Collider,
  Color,
  Component,
  DynamicArrayBuffer,
  FrameBufferObject,
  GLShader,
  Game,
  GameObject,
  InputManager,
  Label,
  LineTextureMode,
  MaskType,
  MathUtils,
  MatrixStack,
  PartcileBody,
  Particle,
  ParticleEmitter,
  ParticleShape,
  PhysicsManager,
  PointCollider,
  PolygonCollider,
  Random,
  Rapid,
  SCALEFACTOR,
  ScaleRadio,
  Scene,
  ShaderType,
  Sprite,
  Text,
  Texture,
  TextureCache,
  TextureWrapMode,
  TileMapRender,
  TileSet,
  TilemapBody,
  TilemapShape,
  Uniform,
  Vec2,
  WebglBufferArray,
  WebglElementBufferArray,
  checkCollision,
  graphicAttributes,
  spriteAttributes
};
