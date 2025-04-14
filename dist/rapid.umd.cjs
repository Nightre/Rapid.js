"use strict";var t,e,r;exports.MaskType=void 0,(t=exports.MaskType||(exports.MaskType={})).Include="normal",t.Exclude="inverse",exports.TilemapShape=void 0,(e=exports.TilemapShape||(exports.TilemapShape={})).SQUARE="square",e.ISOMETRIC="isometric",exports.ShaderType=void 0,(r=exports.ShaderType||(exports.ShaderType={})).SPRITE="sprite",r.GRAPHIC="graphic";class i{constructor(t){this.render=t}}var s;exports.ArrayType=void 0,(s=exports.ArrayType||(exports.ArrayType={}))[s.Float32=0]="Float32",s[s.Uint32=1]="Uint32",s[s.Uint16=2]="Uint16";class a{constructor(t){this.usedElemNum=0,this.maxElemNum=512,this.bytePerElem=this.getArrayType(t).BYTES_PER_ELEMENT,this.arrayType=t,this.arraybuffer=new ArrayBuffer(this.maxElemNum*this.bytePerElem),this.updateTypedArray()}getArrayType(t){switch(t){case exports.ArrayType.Float32:return Float32Array;case exports.ArrayType.Uint32:return Uint32Array;case exports.ArrayType.Uint16:return Uint16Array}}updateTypedArray(){switch(this.uint32=new Uint32Array(this.arraybuffer),this.float32=new Float32Array(this.arraybuffer),this.uint16=new Uint16Array(this.arraybuffer),this.arrayType){case exports.ArrayType.Float32:this.typedArray=this.float32;break;case exports.ArrayType.Uint32:this.typedArray=this.uint32;break;case exports.ArrayType.Uint16:this.typedArray=this.uint16}}clear(){this.usedElemNum=0}resize(t=0){if((t+=this.usedElemNum)>this.maxElemNum){for(;t>this.maxElemNum;)this.maxElemNum<<=1;this.setMaxSize(this.maxElemNum)}}setMaxSize(t=this.maxElemNum){const e=this.typedArray;this.maxElemNum=t,this.arraybuffer=new ArrayBuffer(t*this.bytePerElem),this.updateTypedArray(),this.typedArray.set(e)}pushUint32(t){this.uint32[this.usedElemNum++]=t}pushFloat32(t){this.float32[this.usedElemNum++]=t}pushUint16(t){this.uint16[this.usedElemNum++]=t}pop(t){this.usedElemNum-=t}getArray(t=0,e){return null==e?this.typedArray:this.typedArray.subarray(t,e)}get length(){return this.typedArray.length}}class n extends a{constructor(t,e,r=t.ARRAY_BUFFER,i=t.STATIC_DRAW){super(e),this.dirty=!0,this.webglBufferSize=0,this.gl=t,this.buffer=t.createBuffer(),this.type=r,this.usage=i}pushFloat32(t){super.pushFloat32(t),this.dirty=!0}pushUint32(t){super.pushUint32(t),this.dirty=!0}pushUint16(t){super.pushUint16(t),this.dirty=!0}bindBuffer(){this.gl.bindBuffer(this.type,this.buffer)}bufferData(){if(this.dirty){const t=this.gl;this.maxElemNum>this.webglBufferSize?(t.bufferData(this.type,this.getArray(),this.usage),this.webglBufferSize=this.maxElemNum):t.bufferSubData(this.type,0,this.getArray(0,this.usedElemNum)),this.dirty=!1}}}class o extends a{constructor(){super(exports.ArrayType.Float32)}pushMat(){const t=this.usedElemNum-6,e=this.typedArray;this.resize(6),this.pushFloat32(e[t+0]),this.pushFloat32(e[t+1]),this.pushFloat32(e[t+2]),this.pushFloat32(e[t+3]),this.pushFloat32(e[t+4]),this.pushFloat32(e[t+5])}popMat(){this.pop(6)}pushIdentity(){this.resize(6),this.pushFloat32(1),this.pushFloat32(0),this.pushFloat32(0),this.pushFloat32(1),this.pushFloat32(0),this.pushFloat32(0)}translate(t,e){if("number"!=typeof t)return this.translate(t.x,t.y);const r=this.usedElemNum-6,i=this.typedArray;i[r+4]=i[r+0]*t+i[r+2]*e+i[r+4],i[r+5]=i[r+1]*t+i[r+3]*e+i[r+5]}rotate(t){const e=this.usedElemNum-6,r=this.typedArray,i=Math.cos(t),s=Math.sin(t),a=r[e+0],n=r[e+1],o=r[e+2],h=r[e+3];r[e+0]=a*i-n*s,r[e+1]=a*s+n*i,r[e+2]=o*i-h*s,r[e+3]=o*s+h*i}scale(t,e){if("number"!=typeof t)return this.scale(t.x,t.y);e||(e=t);const r=this.usedElemNum-6,i=this.typedArray;i[r+0]=i[r+0]*t,i[r+1]=i[r+1]*t,i[r+2]=i[r+2]*e,i[r+3]=i[r+3]*e}apply(t,e){if("number"!=typeof t)return new l(...this.apply(t.x,t.y));const r=this.usedElemNum-6,i=this.typedArray;return[i[r+0]*t+i[r+2]*e+i[r+4],i[r+1]*t+i[r+3]*e+i[r+5]]}getInverse(){const t=this.usedElemNum-6,e=this.typedArray,r=e[t+0],i=e[t+1],s=e[t+2],a=e[t+3],n=e[t+4],o=e[t+5],h=r*a-i*s;return new Float32Array([a/h,-i/h,-s/h,r/h,(s*o-a*n)/h,(i*n-r*o)/h])}getTransform(){const t=this.usedElemNum-6,e=this.typedArray;return new Float32Array([e[t+0],e[t+1],e[t+2],e[t+3],e[t+4],e[t+5]])}setTransform(t){const e=this.usedElemNum-6,r=this.typedArray;r[e+0]=t[0],r[e+1]=t[1],r[e+2]=t[2],r[e+3]=t[3],r[e+4]=t[4],r[e+5]=t[5]}getGlobalPosition(){const t=this.usedElemNum-6,e=this.typedArray;return new l(e[t+4],e[t+5])}setGlobalPosition(t,e){if("number"!=typeof t)return void this.setGlobalPosition(t.x,t.y);const r=this.usedElemNum-6,i=this.typedArray;i[r+4]=t,i[r+5]=e}getGlobalRotation(){const t=this.usedElemNum-6,e=this.typedArray;return Math.atan2(e[t+1],e[t+0])}setGlobalRotation(t){const e=this.usedElemNum-6,r=this.typedArray,i=this.getGlobalScale(),s=Math.cos(t),a=Math.sin(t);r[e+0]=s*i.x,r[e+1]=a*i.x,r[e+2]=-a*i.y,r[e+3]=s*i.y}getGlobalScale(){const t=this.usedElemNum-6,e=this.typedArray,r=Math.sqrt(e[t+0]*e[t+0]+e[t+1]*e[t+1]),i=Math.sqrt(e[t+2]*e[t+2]+e[t+3]*e[t+3]);return new l(r,i)}setGlobalScale(t,e){if("number"!=typeof t)return void this.setGlobalScale(t.x,t.y);const r=this.getGlobalRotation(),i=Math.cos(r),s=Math.sin(r),a=this.usedElemNum-6,n=this.typedArray;n[a+0]=i*t,n[a+1]=s*t,n[a+2]=-s*e,n[a+3]=i*e}globalToLocal(t){const e=this.getInverse();return new l(e[0]*t.x+e[2]*t.y+e[4],e[1]*t.x+e[3]*t.y+e[5])}localToGlobal(t){return this.apply(t)}toCSSTransform(){const t=this.usedElemNum-6,e=this.typedArray;return`matrix(${e[t+0]}, ${e[t+1]}, ${e[t+2]}, ${e[t+3]}, ${e[t+4]}, ${e[t+5]})`}identity(){const t=this.usedElemNum-6,e=this.typedArray;e[t+0]=1,e[t+1]=0,e[t+2]=0,e[t+3]=1,e[t+4]=0,e[t+5]=0}applyTransform(t,e=0,r=0){(t.saveTransform??1)&&this.pushMat(),t.afterSave&&t.afterSave();const i=t.x||0,s=t.y||0;(i||s)&&this.translate(i,s),t.position&&this.translate(t.position),t.rotation&&this.rotate(t.rotation),t.scale&&this.scale(t.scale);let a=t.offsetX||0,n=t.offsetY||0;t.offset&&(a+=t.offset.x,n+=t.offset.y);const o=t.origin;return o&&("number"==typeof o?(a-=o*e,n-=o*r):(a-=o.x*e,n-=o.y*r)),{offsetX:a,offsetY:n}}applyTransformAfter(t){t.beforRestore&&t.beforRestore(),(t.restoreTransform??1)&&this.popMat()}}class h extends n{constructor(t,e,r,i){super(t,exports.ArrayType.Uint16,t.ELEMENT_ARRAY_BUFFER,t.STATIC_DRAW),this.setMaxSize(e*i);for(let t=0;t<i;t++)this.addObject(t*r);this.bindBuffer(),this.bufferData()}addObject(t){}}class u{constructor(t,e,r,i=255){this._r=t,this._g=e,this._b=r,this._a=i,this.updateUint()}get r(){return this._r}set r(t){this._r=t,this.updateUint()}get g(){return this._g}set g(t){this._g=t,this.updateUint()}get b(){return this._b}set b(t){this._b=t,this.updateUint()}get a(){return this._a}set a(t){this._a=t,this.updateUint()}updateUint(){this.uint32=(this._a<<24|this._b<<16|this._g<<8|this._r)>>>0}setRGBA(t,e,r,i){this.r=t,this.g=e,this.b=r,this.a=i,this.updateUint()}copy(t){this.setRGBA(t.r,t.g,t.b,t.a)}clone(){return new u(this._r,this._g,this._b,this._a)}equal(t){return t.r===this.r&&t.g===this.g&&t.b===this.b&&t.a===this.a}static fromHex(t){t.startsWith("#")&&(t=t.slice(1));const e=parseInt(t.slice(0,2),16),r=parseInt(t.slice(2,4),16),i=parseInt(t.slice(4,6),16);let s=255;return t.length>=8&&(s=parseInt(t.slice(6,8),16)),new u(e,r,i,s)}add(t){return new u(Math.min(this.r+t.r,255),Math.min(this.g+t.g,255),Math.min(this.b+t.b,255),Math.min(this.a+t.a,255))}subtract(t){return new u(Math.max(this.r-t.r,0),Math.max(this.g-t.g,0),Math.max(this.b-t.b,0),Math.max(this.a-t.a,0))}}u.Red=new u(255,0,0,255),u.Green=new u(0,255,0,255),u.Blue=new u(0,0,255,255),u.Yellow=new u(255,255,0,255),u.Purple=new u(128,0,128,255),u.Orange=new u(255,165,0,255),u.Pink=new u(255,192,203,255),u.Gray=new u(128,128,128,255),u.Brown=new u(139,69,19,255),u.Cyan=new u(0,255,255,255),u.Magenta=new u(255,0,255,255),u.Lime=new u(192,255,0,255),u.White=new u(255,255,255,255),u.Black=new u(0,0,0,255),u.TRANSPARENT=new u(0,0,0,0);class l{constructor(t,e){this.x=void 0!==t?t:0,this.y=void 0!==e?e:0}add(t){return new l(this.x+t.x,this.y+t.y)}subtract(t){return new l(this.x-t.x,this.y-t.y)}multiply(t){return t instanceof l?new l(this.x*t.x,this.y*t.y):new l(this.x*t,this.y*t)}divide(t){return t instanceof l?new l(this.x/t.x,this.y/t.y):new l(this.x/t,this.y/t)}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}distanceTo(t){const e=this.x-t.x,r=this.y-t.y;return Math.sqrt(e*e+r*r)}clone(){return new l(this.x,this.y)}copy(t){this.x=t.x,this.y=t.y}equal(t){return t.x==this.x&&t.y==this.y}perpendicular(){const t=this.x;return this.x=-this.y,this.y=t,this}invert(){return this.x=-this.x,this.y=-this.y,this}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}normalize(){const t=this.length();return this.x=this.x/t||0,this.y=this.y/t||0,this}angle(){return Math.atan2(this.y,this.x)}middle(t){return new l((this.x+t.x)/2,(this.y+t.y)/2)}abs(){return new l(Math.abs(this.x),Math.abs(this.y))}floor(){return new l(Math.floor(this.x),Math.floor(this.y))}ceil(){return new l(Math.ceil(this.x),Math.ceil(this.y))}snap(t){return new l(Math.round(this.x/t)*t,Math.round(this.y/t)*t)}stringify(){return`Vec2(${this.x}, ${this.y})`}static FromArray(t){return t.map((t=>new l(t[0],t[1])))}}l.ZERO=new l(0,0),l.ONE=new l(1,1),l.UP=new l(0,1),l.DOWN=new l(0,-1),l.LEFT=new l(-1,0),l.RIGHT=new l(1,0);const c=(t,e,r,i)=>{const s=[],a=i?Math.atan2(e.y,e.x):Math.atan2(-e.y,-e.x),n=Math.PI;for(let e=0;e<10;e++){const i=a+e/10*n,o=a+(e+1)/10*n,h=Math.cos(i)*r,u=Math.sin(i)*r,c=Math.cos(o)*r,d=Math.sin(o)*r;s.push(t),s.push(t.add(new l(h,u))),s.push(t.add(new l(c,d)))}return s},d=t=>{const e=t.points;if(e.length<2)return[];const r=((t,e=!1)=>{const r=[];if(t.length<2||e&&t.length<3)return r;const i=t.length,s=(t,e,r)=>{const i=e.subtract(t).normalize(),s=e.subtract(r).normalize(),a=s.dot(i);if(a<-.999)return{normal:i.perpendicular(),miters:1};{let t=s.add(i).normalize();i.cross(s)<0&&(t=t.multiply(-1));let e=1/Math.sqrt((1-a)/2);return{normal:t,miters:Math.min(e,4)}}};if(e){for(let e=0;e<i-1;e++){const a=0===e?t[i-2]:t[e-1],n=t[e],o=t[e+1];r.push(s(a,n,o))}r.push(r[0])}else for(let e=0;e<i;e++)if(0===e){const e=t[1].subtract(t[0]).normalize();r.push({normal:e.perpendicular(),miters:1})}else if(e===i-1){const i=t[e].subtract(t[e-1]).normalize();r.push({normal:i.perpendicular(),miters:1})}else r.push(s(t[e-1],t[e],t[e+1]));return r})(e,t.closed),i=(t.width||1)/2,s=[],a=t.roundCap||!1;for(let t=0;t<e.length-1;t++){const a=e[t],n=r[t].normal,o=r[t].miters,h=a.add(n.multiply(o*i)),u=a.subtract(n.multiply(o*i)),l=e[t+1],c=r[t+1].normal,d=r[t+1].miters,p=l.add(c.multiply(d*i)),f=l.subtract(c.multiply(d*i));s.push(h),s.push(u),s.push(p),s.push(p),s.push(f),s.push(u)}if(a&&!t.closed){const t=e[0],a=r[0].normal;s.push(...c(t,a,i,!0));const n=e[e.length-1],o=r[e.length-1].normal;s.push(...c(n,o,i,!1))}return s};var p="precision mediump float;\r\nvarying vec2 vRegion;\r\nvarying vec4 vColor;\r\n\r\nuniform sampler2D uTexture;\r\nuniform int uUseTexture;\r\n\r\nvoid main(void) {\r\n    vec4 color;\r\n    if(uUseTexture > 0){\r\n        color = texture2D(uTexture, vRegion) * vColor;\r\n    }else{\r\n        color = vColor;\r\n    }\r\n    gl_FragColor = color;\r\n}\r\n",f="precision mediump float;\r\n\r\nattribute vec2 aPosition;\r\nattribute vec4 aColor;\r\nattribute vec2 aRegion;\r\n\r\nvarying vec4 vColor;\r\nuniform mat4 uProjectionMatrix;\r\nuniform vec4 uColor;\r\nvarying vec2 vRegion;\r\n\r\nvoid main(void) {\r\n    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);\r\n    \r\n    vColor = aColor;\r\n    vRegion = aRegion;\r\n}\r\n";const g=(t,e,r)=>{const i=t.createShader(r);if(!i)throw new Error("Unable to create webgl shader");t.shaderSource(i,e),t.compileShader(i);if(!t.getShaderParameter(i,t.COMPILE_STATUS)){const r=t.getShaderInfoLog(i);throw console.error("Shader compilation failed:",r),new Error("Unable to compile shader: "+r+e)}return i};function x(t,e,r,i=!1,s=!1){const a=t.createTexture();if(!a)throw new Error("unable to create texture");return t.bindTexture(t.TEXTURE_2D,a),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,r?t.LINEAR:t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,r?t.LINEAR:t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,s),i?t.texImage2D(t.TEXTURE_2D,0,t.RGBA,e.width,e.height,0,t.RGBA,t.UNSIGNED_BYTE,null):t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),a}const m=5126;var y="precision mediump float;\r\nuniform sampler2D uTextures[%TEXTURE_NUM%];\r\n\r\nvarying vec2 vRegion;\r\nvarying float vTextureId;\r\nvarying vec4 vColor;\r\n\r\nvoid main(void) {\r\n    vec4 color;\r\n    %GET_COLOR%\r\n\r\n    gl_FragColor = color * vColor;\r\n}",T="precision mediump float;\r\n\r\nattribute vec2 aPosition;\r\nattribute vec2 aRegion;\r\nattribute float aTextureId;\r\nattribute vec4 aColor;\r\n\r\nuniform mat4 uProjectionMatrix;\r\n\r\nvarying vec2 vRegion;\r\nvarying float vTextureId;\r\nvarying vec4 vColor;\r\n\r\nvoid main(void) {\r\n    vRegion = aRegion;\r\n    vTextureId = aTextureId;\r\n    vColor = aColor;\r\n\r\n    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);\r\n}";const E=[{name:"aPosition",size:2,type:m,stride:24},{name:"aRegion",size:2,type:m,stride:24,offset:2*Float32Array.BYTES_PER_ELEMENT},{name:"aTextureId",size:1,type:m,stride:24,offset:4*Float32Array.BYTES_PER_ELEMENT},{name:"aColor",size:4,type:5121,stride:24,offset:5*Float32Array.BYTES_PER_ELEMENT,normalized:!0}],b=[{name:"aPosition",size:2,type:m,stride:20},{name:"aColor",size:4,type:5121,stride:20,offset:2*Float32Array.BYTES_PER_ELEMENT,normalized:!0},{name:"aRegion",size:2,type:m,stride:20,offset:3*Float32Array.BYTES_PER_ELEMENT}];class R{constructor(t,e,r,i,s=0){this.attributeLoc={},this.uniformLoc={},this.attributes=[];const a=function(t,e){if(t.includes("%TEXTURE_NUM%")&&(t=t.replace("%TEXTURE_NUM%",e.toString())),t.includes("%GET_COLOR%")){let r="";for(let t=0;t<e;t++)r+=0==t?`if(vTextureId == ${t}.0)`:t==e-1?"else":`else if(vTextureId == ${t}.0)`,r+=`{color = texture2D(uTextures[${t}], vRegion);}`;t=t.replace("%GET_COLOR%",r)}return t}(r,t.maxTextureUnits-s);this.program=((t,e,r)=>{var i=t.createProgram(),s=g(t,e,35633),a=g(t,r,35632);if(!i)throw new Error("Unable to create program shader");if(t.attachShader(i,s),t.attachShader(i,a),t.linkProgram(i),!t.getProgramParameter(i,t.LINK_STATUS)){const e=t.getProgramInfoLog(i);throw new Error("Unable to link shader program: "+e)}return i})(t.gl,e,a),this.gl=t.gl,this.usedTexture=s,this.parseShader(e),this.parseShader(a),i&&this.setAttributes(i)}setUniforms(t,e){const r=this.gl;for(const i of t.getUnifromNames()){const s=this.getUniform(i);e=t.bind(r,i,s,e)}return e}getUniform(t){return this.uniformLoc[t]}use(){this.gl.useProgram(this.program)}parseShader(t){const e=this.gl,r=t.match(/attribute\s+\w+\s+(\w+)/g);if(r)for(const t of r){const r=t.split(" ")[2],i=e.getAttribLocation(this.program,r);-1!=i&&(this.attributeLoc[r]=i)}const i=t.match(/uniform\s+\w+\s+(\w+)/g);if(i)for(const t of i){const r=t.split(" ")[2];this.uniformLoc[r]=e.getUniformLocation(this.program,r)}}setAttribute(t){const e=this.attributeLoc[t.name];if(void 0!==e){const r=this.gl;r.vertexAttribPointer(e,t.size,t.type,t.normalized||!1,t.stride,t.offset||0),r.enableVertexAttribArray(e)}}setAttributes(t){this.attributes=t;for(const e of t)this.setAttribute(e)}updateAttributes(){this.setAttributes(this.attributes)}static createCostumShader(t,e,r,i,s=0){let a={[exports.ShaderType.SPRITE]:y,[exports.ShaderType.GRAPHIC]:p}[i],n={[exports.ShaderType.SPRITE]:T,[exports.ShaderType.GRAPHIC]:f}[i];const o={[exports.ShaderType.SPRITE]:E,[exports.ShaderType.GRAPHIC]:b}[i];return a=a.replace("void main(void) {",r+"\nvoid main(void) {"),n=n.replace("void main(void) {",e+"\nvoid main(void) {"),a=a.replace("gl_FragColor = ","fragment(color);\ngl_FragColor = "),n=n.replace("gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);","vec2 position = aPosition;\nvertex(position, vRegion);\ngl_Position = uProjectionMatrix * vec4(position, 0.0, 1.0);"),new R(t,n,a,o,s)}}class w{constructor(t){this.usedTextures=[],this.needBind=new Set,this.shaders=new Map,this.isCostumShader=!1,this.rapid=t,this.gl=t.gl,this.webglArrayBuffer=new n(t.gl,exports.ArrayType.Float32,t.gl.ARRAY_BUFFER,t.gl.STREAM_DRAW),this.MAX_TEXTURE_UNIT_ARRAY=Array.from({length:t.maxTextureUnits},((t,e)=>e))}setTextureUnits(t){return this.MAX_TEXTURE_UNIT_ARRAY.slice(t,-1)}addVertex(t,e,...r){const[i,s]=this.rapid.matrixStack.apply(t,e);this.webglArrayBuffer.pushFloat32(i),this.webglArrayBuffer.pushFloat32(s)}useTexture(t){let e=this.usedTextures.indexOf(t);return-1===e&&(this.usedTextures.length>=this.rapid.maxTextureUnits&&this.render(),this.usedTextures.push(t),e=this.usedTextures.length-1,this.needBind.add(e)),e}enterRegion(t){this.currentShader=t??this.getShader("default"),this.currentShader.use(),this.initializeForNextRender(),this.webglArrayBuffer.bindBuffer(),this.currentShader.updateAttributes(),this.updateProjection(),this.isCostumShader=Boolean(t)}updateProjection(){this.gl.uniformMatrix4fv(this.currentShader.uniformLoc.uProjectionMatrix,!1,this.rapid.projection)}setCostumUnifrom(t){let e=!1;return this.costumUnifrom!=t?(e=!0,this.costumUnifrom=t):t?.isDirty&&(e=!0),t?.clearDirty(),e}exitRegion(){}initDefaultShader(t,e,r){this.setShader("default",t,e,r)}setShader(t,e,r,i){this.webglArrayBuffer.bindBuffer(),this.shaders.set(t,new R(this.rapid,e,r,i)),"default"===t&&(this.defaultShader=this.shaders.get(t))}getShader(t){return this.shaders.get(t)}render(){this.executeRender(),this.initializeForNextRender()}executeRender(){this.webglArrayBuffer.bufferData();const t=this.gl;for(const e of this.needBind)t.activeTexture(t.TEXTURE0+e+this.currentShader.usedTexture),t.bindTexture(t.TEXTURE_2D,this.usedTextures[e]);this.needBind.clear()}initializeForNextRender(){this.webglArrayBuffer.clear(),this.usedTextures=[],this.isCostumShader=!1}hasPendingContent(){return!1}isShaderChanged(t){return(t||this.defaultShader)!=this.currentShader}}class S extends w{constructor(t){super(t),this.vertex=0,this.offset=l.ZERO,this.drawType=t.gl.TRIANGLE_FAN,this.setShader("default",f,p,b)}startRender(t,e,r,i){i&&this.currentShader?.setUniforms(i,1),this.offset=new l(t,e),this.vertex=0,this.webglArrayBuffer.clear(),r&&r.base&&(this.texture=this.useTexture(r.base.texture))}addVertex(t,e,r,i,s){this.webglArrayBuffer.resize(3),super.addVertex(t+this.offset.x,e+this.offset.y),this.webglArrayBuffer.pushUint32(s),this.webglArrayBuffer.pushFloat32(r),this.webglArrayBuffer.pushFloat32(i),this.vertex+=1}executeRender(){super.executeRender();const t=this.gl;t.uniform1i(this.currentShader.uniformLoc.uUseTexture,void 0===this.texture?0:1),this.texture&&t.uniform1i(this.currentShader.uniformLoc.uTexture,this.texture),t.drawArrays(this.drawType,0,this.vertex),this.drawType=this.rapid.gl.TRIANGLE_FAN,this.vertex=0,this.texture=void 0}}const A=Math.floor(16384);class M extends h{constructor(t,e){super(t,6,4,e)}addObject(t){super.addObject(),this.pushUint16(t),this.pushUint16(t+1),this.pushUint16(t+2),this.pushUint16(t),this.pushUint16(t+3),this.pushUint16(t+2)}}class v extends w{constructor(t){const e=t.gl;super(t),this.batchSprite=0,this.setShader("default",T,y,E),this.indexBuffer=new M(e,A)}addVertex(t,e,r,i,s,a){super.addVertex(t,e),this.webglArrayBuffer.pushFloat32(r),this.webglArrayBuffer.pushFloat32(i),this.webglArrayBuffer.pushFloat32(s),this.webglArrayBuffer.pushUint32(a)}renderSprite(t,e,r,i,s,a,n,o,h,u,l,c,d){(this.batchSprite>=A||this.rapid.projectionDirty||l&&this.setCostumUnifrom(l))&&(this.render(),l&&this.currentShader.setUniforms(l,0),this.rapid.projectionDirty&&this.updateProjection()),this.batchSprite++,this.webglArrayBuffer.resize(20);const p=this.useTexture(t),f=c?a:i,g=c?i:a,x=d?n:s,m=d?s:n,y=o,T=o+e,E=h,b=h+r;this.addVertex(y,E,f,x,p,u),this.addVertex(T,E,g,x,p,u),this.addVertex(T,b,g,m,p,u),this.addVertex(y,b,f,m,p,u)}executeRender(){super.executeRender();const t=this.gl;t.drawElements(t.TRIANGLES,6*this.batchSprite,t.UNSIGNED_SHORT,0)}enterRegion(t){super.enterRegion(t),this.indexBuffer.bindBuffer(),this.gl.uniform1iv(this.currentShader.uniformLoc.uTextures,this.setTextureUnits(this.currentShader.usedTexture))}initializeForNextRender(){super.initializeForNextRender(),this.batchSprite=0}hasPendingContent(){return this.batchSprite>0}}class U{constructor(t,e){this.cache=new Map,this.render=t,this.antialias=e}async textureFromUrl(t,e=this.antialias){let r=this.cache.get(t);if(!r){const i=await this.loadImage(t);r=F.fromImageSource(this.render,i,e),this.cache.set(t,r)}return new _(r)}textureFromFrameBufferObject(t){return new _(t)}async textureFromSource(t,e=this.antialias){let r=this.cache.get(t);return r||(r=F.fromImageSource(this.render,t,e),this.cache.set(t,r)),new _(r)}async loadImage(t){return new Promise((e=>{const r=new Image;r.onload=()=>{e(r)},r.src=t}))}createText(t){return new N(this.render,t)}destroy(t){t instanceof _?(t.base?.destroy(this.render.gl),this.removeCache(t)):(t.destroy(this.render.gl),this.removeCache(t))}createFrameBufferObject(t,e,r=this.antialias){return new C(this.render,t,e,r)}removeCache(t){const e=t instanceof _?t.base?.texture:t.texture;e&&this.cache.forEach(((t,r)=>{t===e&&this.cache.delete(r)}))}}class F{constructor(t,e,r){this.texture=t,this.width=e,this.height=r}static fromImageSource(t,e,r=!1){return new F(x(t.gl,e,r),e.width,e.height)}destroy(t){t.deleteTexture(this.texture)}}class _{constructor(t){this.scale=1,this.setBaseTextur(t)}setBaseTextur(t){t&&(this.base=t,this.setClipRegion(0,0,t.width,t.height))}setClipRegion(t,e,r,i){if(this.base)return this.clipX=t/this.base.width,this.clipY=e/this.base.height,this.clipW=this.clipX+r/this.base.width,this.clipH=this.clipY+i/this.base.height,this.width=r*this.scale,this.height=i*this.scale,this}static fromImageSource(t,e,r=!1){return new _(F.fromImageSource(t,e,r))}static fromUrl(t,e){return t.textures.textureFromUrl(e)}createSpritesHeet(t,e){if(!this.base)return[];const r=[],i=Math.floor(this.base.width/t),s=Math.floor(this.base.height/e);for(let a=0;a<s;a++)for(let s=0;s<i;s++){const i=this.clone();i.setClipRegion(s*t,a*e,t,e),r.push(i)}return r}clone(){return new _(this.base)}}class N extends _{constructor(t,e){super(),this.scale=.5,this.rapid=t,this.options=e,this.text=e.text||" ",this.updateTextImage()}updateTextImage(){const t=this.createTextCanvas();this.setBaseTextur(F.fromImageSource(this.rapid,t,!0))}createTextCanvas(){const t=document.createElement("canvas"),e=t.getContext("2d");if(!e)throw new Error("Failed to get canvas context");e.font=`${this.options.fontSize||16}px ${this.options.fontFamily||"Arial"}`,e.fillStyle=this.options.color||"#000",e.textAlign=this.options.textAlign||"left",e.textBaseline=this.options.textBaseline||"top";const r=this.text.split("\n");let i=0,s=0;for(const t of r){const r=e.measureText(t);i=Math.max(i,r.width),s+=this.options.fontSize||16}t.width=2*i,t.height=2*s,e.scale(2,2),e.font=`${this.options.fontSize||16}px ${this.options.fontFamily||"Arial"}`,e.fillStyle=this.options.color||"#000",e.textAlign=this.options.textAlign||"left",e.textBaseline=this.options.textBaseline||"top";let a=0;for(const t of r)e.fillText(t,0,a),a+=this.options.fontSize||16;return t}setText(t){this.text!=t&&(this.text=t,this.updateTextImage())}}class C extends F{constructor(t,e,r,i=!1){const s=t.gl,a=x(s,{width:e,height:r},i,!0,!1),n=s.createFramebuffer();if(!n)throw s.deleteTexture(a),new Error("Failed to create WebGL framebuffer");s.bindFramebuffer(s.FRAMEBUFFER,n),s.framebufferTexture2D(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,a,0);const o=s.createRenderbuffer();if(!o)throw s.deleteFramebuffer(n),s.deleteTexture(a),new Error("Failed to create depth-stencil renderbuffer");s.bindRenderbuffer(s.RENDERBUFFER,o),s.renderbufferStorage(s.RENDERBUFFER,s.STENCIL_INDEX8,e,r),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.STENCIL_ATTACHMENT,s.RENDERBUFFER,o),super(a,e,r),this.gl=s,this.framebuffer=n,s.bindTexture(s.TEXTURE_2D,null),s.bindFramebuffer(s.FRAMEBUFFER,null)}bind(){const t=this.gl;t.bindTexture(t.TEXTURE_2D,null),t.bindFramebuffer(t.FRAMEBUFFER,this.framebuffer),t.clearColor(.5,.2,.5,.5),t.clear(t.COLOR_BUFFER_BIT)}unbind(){this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),this.gl.bindTexture(this.gl.TEXTURE_2D,null)}resize(t,e){this.width=t,this.height=e,this.gl.bindTexture(this.gl.TEXTURE_2D,this.texture),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,t,e,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,null),this.gl.bindTexture(this.gl.TEXTURE_2D,null)}destroy(t){t.deleteFramebuffer(this.framebuffer),super.destroy(t)}}const B=new Set;class I{constructor(t,e){this.textures=new Map,this.width=t,this.height=e}setTile(t,e){e instanceof _&&(e={texture:e}),this.textures.set(t,e)}getTile(t){return this.textures.get(t)}}class P{constructor(t){this.rapid=t}getYSortRow(t,e,r){if(!t)return[];const i=[];for(const r of t){const t=Math.floor(r.ySort/e);i[t]||(i[t]=[]),i[t].push(r)}return i}getOffset(t){let e=(t.errorX??2)+1,r=(t.errorY??2)+1;if("number"==typeof t.error){const i=(t.error??2)+1;e=i,r=i}else t.error&&(e=t.error.x+1,r=t.error.y+1);return{errorX:e,errorY:r}}getTileData(t,e){const r=e.shape??exports.TilemapShape.SQUARE,i=t.width,s=r===exports.TilemapShape.ISOMETRIC?t.height/2:t.height,a=this.rapid.matrixStack,n=a.globalToLocal(l.ZERO),o=a.getGlobalScale(),{errorX:h,errorY:u}=this.getOffset(e),c=Math.ceil(this.rapid.width/i/o.x)+2*h,d=Math.ceil(this.rapid.height/s/o.y)+2*u,p=new l(n.x<0?Math.ceil(n.x/i):Math.floor(n.x/i),n.y<0?Math.ceil(n.y/s):Math.floor(n.y/s));p.x-=h,p.y-=u;let f=new l(0-n.x%i-h*i,0-n.y%s-u*s);return f=f.add(n),{startTile:p,offset:f,viewportWidth:c,viewportHeight:d,height:s,width:i,shape:r}}renderYSortRow(t,e){for(const r of e)r.render?r.render():r.renderSprite&&t.renderSprite(r.renderSprite)}renderLayer(t,e){this.rapid.matrixStack.applyTransform(e);const r=e.tileSet,{startTile:i,offset:s,viewportWidth:a,viewportHeight:n,shape:o,width:h,height:u}=this.getTileData(r,e),l=this.getYSortRow(e.ySortCallback,u,n),c=e.ySortCallback&&e.ySortCallback.length>0;var d;0!==this.rapid.matrixStack.getGlobalRotation()&&(d="TileMapRender: tilemap is not supported rotation",B.has(d)||(B.add(d),console.warn(d)),this.rapid.matrixStack.setGlobalRotation(0));for(let d=0;d<n;d++){const n=d+i.y,p=l[n]??[];if(n<0||n>=t.length)this.renderYSortRow(this.rapid,p);else{for(let l=0;l<a;l++){const a=l+i.x;if(a<0||a>=t[n].length)continue;const c=t[n][a],f=r.getTile(c);if(!f)continue;let g=l*h+s.x,x=d*u+s.y,m=d*u+s.y+(f.ySortOffset??0);n%2!=0&&o===exports.TilemapShape.ISOMETRIC&&(g+=h/2);const y=e.eachTile&&e.eachTile(c,a,n)||{};p.push({ySort:m,renderSprite:{...f,x:g+(f.x||0),y:x+(f.y||0),...y}})}c&&p.sort(((t,e)=>t.ySort-e.ySort)),this.renderYSortRow(this.rapid,p)}}this.rapid.matrixStack.applyTransform(e)}localToMap(t,e){const r=e.tileSet;if(e.shape===exports.TilemapShape.ISOMETRIC){let e=0,i=0;const s=r.height/2,a=r.width/2;let n=Math.floor(t.y/s);const o=n%2==0;let h=Math.floor(t.x/a);const u=h%2==0,c=t.x%a/a,d=t.y%s/s,p=d<c,f=d<1-c;return o||(n-=1),p&&!u&&o?n-=1:p||!u||o?f&&u&&o?(h-=2,n-=1):f||u||o||(n+=1):(n+=1,h-=2),e=h,i=n,e=Math.floor(h/2),new l(e,i)}return new l(Math.floor(t.x/r.width),Math.floor(t.y/r.height))}mapToLocal(t,e){const r=e.tileSet;if(e.shape===exports.TilemapShape.ISOMETRIC){let e=new l(t.x*r.width,t.y*r.height/2);return t.y%2!=0&&(e.x+=r.width/2),e}return new l(t.x*r.width,t.y*r.height)}}exports.BaseTexture=F,exports.Color=u,exports.DynamicArrayBuffer=a,exports.FrameBufferObject=C,exports.GLShader=R,exports.MathUtils=class{static deg2rad(t){return t*(Math.PI/180)}static rad2deg(t){return t/(Math.PI/180)}static normalizeDegrees(t){return(t%360+360)%360}},exports.MatrixStack=o,exports.Rapid=class{constructor(t){this.projectionDirty=!0,this.matrixStack=new o,this.tileMap=new P(this),this.light=new i(this),this.devicePixelRatio=window.devicePixelRatio||1,this.defaultColor=new u(255,255,255,255),this.regions=new Map,this.currentMaskType=[],this.currentTransform=[],this.currentFBO=[];const e=(t=>{const e={stencil:!0},r=t.getContext("webgl2",e)||t.getContext("webgl",e);if(!r)throw new Error("Unable to initialize WebGL. Your browser may not support it.");return r})(t.canvas);this.gl=e,this.canvas=t.canvas,this.textures=new U(this,t.antialias??!1),this.maxTextureUnits=e.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS),this.width=t.width||this.canvas.width,this.height=t.width||this.canvas.height,this.backgroundColor=t.backgroundColor||new u(255,255,255,255),this.registerBuildInRegion(),this.initWebgl(e)}renderTileMapLayer(t,e){this.tileMap.renderLayer(t,e instanceof I?{tileSet:e}:e)}initWebgl(t){this.resize(this.width,this.height),t.enable(t.BLEND),t.disable(t.DEPTH_TEST),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),t.enable(t.STENCIL_TEST),t.enable(t.SCISSOR_TEST)}clearTextureUnit(){for(let t=0;t<this.maxTextureUnits;t++)this.gl.activeTexture(this.gl.TEXTURE0+t),this.gl.bindTexture(this.gl.TEXTURE_2D,null)}registerBuildInRegion(){this.registerRegion("sprite",v),this.registerRegion("graphic",S)}registerRegion(t,e){this.regions.set(t,new e(this))}quitCurrentRegion(){this.currentRegion&&this.currentRegion.hasPendingContent()&&(this.currentRegion.render(),this.currentRegion.exitRegion())}setRegion(t,e){if(t!=this.currentRegionName||this.currentRegion&&this.currentRegion.isShaderChanged(e)){const r=this.regions.get(t);this.quitCurrentRegion(),this.currentRegion=r,this.currentRegionName=t,r.enterRegion(e)}}save(){this.matrixStack.pushMat()}restore(){this.matrixStack.popMat()}withTransform(t){this.save(),t(),this.restore()}startRender(t=!0){this.clear(),t&&this.matrixStack.clear(),this.matrixStack.pushIdentity(),this.currentRegion=void 0,this.currentRegionName=void 0}endRender(){this.currentRegion?.render(),this.projectionDirty=!1}render(t){this.startRender(),t(),this.endRender()}renderSprite(t){const e=t.texture;if(!e||!e.base)return;const{offsetX:r,offsetY:i}=this.startDraw(t,e.width,e.height);this.setRegion("sprite",t.shader),this.currentRegion.renderSprite(e.base.texture,e.width,e.height,e.clipX,e.clipY,e.clipW,e.clipH,r,i,(t.color||this.defaultColor).uint32,t.uniforms,t.flipX,t.flipY),this.afterDraw()}renderTexture(t){t.base&&this.renderSprite({texture:t})}renderLine(t){const e=t.closed?[...t.points,t.points[0]]:t.points,r=d({...t,points:e});this.renderGraphic({...t,drawType:this.gl.TRIANGLES,points:r})}renderGraphic(t){this.startGraphicDraw(t),t.points.forEach(((e,r)=>{const i=Array.isArray(t.color)?t.color[r]:t.color,s=t.uv?.[r];this.addGraphicVertex(e.x,e.y,s,i)})),this.endGraphicDraw()}startGraphicDraw(t){const{offsetX:e,offsetY:r}=this.startDraw(t);this.setRegion("graphic",t.shader);const i=this.currentRegion;i.startRender(e,r,t.texture,t.uniforms),t.drawType&&(i.drawType=t.drawType)}addGraphicVertex(t,e,r,i){this.currentRegion.addVertex(t,e,r?.x,r?.y,(i||this.defaultColor).uint32)}endGraphicDraw(){this.currentRegion.render(),this.afterDraw()}startDraw(t,e=0,r=0){return this.currentTransform.push(t),this.matrixStack.applyTransform(t,e,r)}afterDraw(){this.currentTransform.length>0&&this.matrixStack.applyTransformAfter(this.currentTransform.pop())}renderRect(t){const{width:e,height:r}=t,i=[new l(0,0),new l(e,0),new l(e,r),new l(0,r)];this.renderGraphic({...t,points:i,drawType:this.gl.TRIANGLE_FAN})}renderCircle(t){const e=t.segments||32,r=t.radius,i=t.color||this.defaultColor,s=[];for(let t=0;t<=e;t++){const i=t/e*Math.PI*2,a=Math.cos(i)*r,n=Math.sin(i)*r;s.push(new l(a,n))}this.renderGraphic({...t,points:s,color:i,drawType:this.gl.TRIANGLE_FAN})}resize(t,e){const r=t*this.devicePixelRatio,i=e*this.devicePixelRatio;this.canvas.width=r,this.canvas.height=i,this.resizeWebglSize(t,e),this.canvas.style.width=t+"px",this.canvas.style.height=e+"px",this.width=t,this.height=e}resizeWebglSize(t,e,r){const i=t*(r||this.devicePixelRatio),s=e*(r||this.devicePixelRatio);this.gl.viewport(0,0,i,s),this.updateProjection(0,t,e,0),this.gl.scissor(0,0,i,s)}updateProjection(t,e,r,i){this.projection=this.createOrthMatrix(t,e,r,i),this.projectionDirty=!0}clear(t){const e=this.gl,r=t||this.backgroundColor;e.clearColor(r.r/255,r.g/255,r.b/255,r.a/255),e.clear(e.COLOR_BUFFER_BIT),this.clearMask()}createOrthMatrix(t,e,r,i){return new Float32Array([2/(e-t),0,0,0,0,2/(i-r),0,0,0,0,-1,0,-(e+t)/(e-t),-(i+r)/(i-r),0,1])}drawMask(t=exports.MaskType.Include,e){this.startDrawMask(t),e(),this.endDrawMask()}startDrawMask(t=exports.MaskType.Include){const e=this.gl;this.currentMaskType.push(t),this.setMaskType(t,!0),e.stencilOp(e.KEEP,e.KEEP,e.REPLACE),e.colorMask(!1,!1,!1,!1)}endDrawMask(){const t=this.gl;this.quitCurrentRegion(),t.stencilOp(t.KEEP,t.KEEP,t.KEEP),t.colorMask(!0,!0,!0,!0),this.setMaskType(this.currentMaskType.pop()??exports.MaskType.Include,!1)}setMaskType(t,e=!1){const r=this.gl;if(this.quitCurrentRegion(),e)this.clearMask(),r.stencilFunc(r.ALWAYS,1,255);else switch(t){case exports.MaskType.Include:r.stencilFunc(r.EQUAL,1,255);break;case exports.MaskType.Exclude:r.stencilFunc(r.NOTEQUAL,1,255)}}clearMask(){const t=this.gl;this.quitCurrentRegion(),t.clearStencil(0),t.clear(t.STENCIL_BUFFER_BIT),t.stencilFunc(t.ALWAYS,1,255)}createCostumShader(t,e,r,i=0){return R.createCostumShader(this,t,e,r,i)}startFBO(t){this.quitCurrentRegion(),t.bind(),this.clearTextureUnit(),this.resizeWebglSize(t.width,t.height,1),this.updateProjection(0,t.width,0,t.height),this.save(),this.matrixStack.identity(),this.currentFBO.push(t)}endFBO(){if(this.currentFBO.length>0){const t=this.currentFBO.pop();this.quitCurrentRegion(),t.unbind(),this.clearTextureUnit(),this.resizeWebglSize(this.width,this.height),this.updateProjection(0,this.width,this.height,0),this.restore()}}drawToFBO(t,e){this.startFBO(t),e(),this.endFBO()}},exports.SCALEFACTOR=2,exports.Text=N,exports.Texture=_,exports.TextureCache=U,exports.TileMapRender=P,exports.TileSet=I,exports.Uniform=class{constructor(t){this.isDirty=!1,this.data=t}setUniform(t,e){this.data[t]!=e&&(this.isDirty=!0),this.data[t]=e}clearDirty(){this.isDirty=!1}getUnifromNames(){return Object.keys(this.data)}bind(t,e,r,i){const s=this.data[e];if("number"==typeof s)t.uniform1f(r,s);else if(Array.isArray(s))switch(s.length){case 1:Number.isInteger(s[0])?t.uniform1i(r,s[0]):t.uniform1f(r,s[0]);break;case 2:Number.isInteger(s[0])?t.uniform2iv(r,s):t.uniform2fv(r,s);break;case 3:Number.isInteger(s[0])?t.uniform3iv(r,s):t.uniform3fv(r,s);break;case 4:Number.isInteger(s[0])?t.uniform4iv(r,s):t.uniform4fv(r,s);break;case 9:t.uniformMatrix3fv(r,!1,s);break;case 16:t.uniformMatrix4fv(r,!1,s);break;default:console.error(`Unsupported uniform array length for ${e}:`,s.length)}else"boolean"==typeof s?t.uniform1i(r,s?1:0):s.base?.texture?(t.activeTexture(t.TEXTURE0+i),t.bindTexture(t.TEXTURE_2D,s.base.texture),t.uniform1i(r,i),i+=1):console.error(`Unsupported uniform type for ${e}:`,typeof s);return i}},exports.Vec2=l,exports.WebglBufferArray=n,exports.WebglElementBufferArray=h,exports.graphicAttributes=b,exports.spriteAttributes=E;
