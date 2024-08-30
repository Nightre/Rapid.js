const t=(t,e,r)=>{const i=t.createShader(r);if(!i)throw new Error("Unable to create webgl shader");t.shaderSource(i,e),t.compileShader(i);if(!t.getShaderParameter(i,t.COMPILE_STATUS)){const r=t.getShaderInfoLog(i);throw console.error("Shader compilation failed:",r),new Error("Unable to compile shader: "+r+e)}return i};const e=5126;class r{constructor(t){this.usedElemNum=0,this.maxElemNum=512,this.bytePerElem=t.BYTES_PER_ELEMENT,this.arrayType=t,this.arraybuffer=new ArrayBuffer(this.maxElemNum*this.bytePerElem),this.typedArray=new t(this.arraybuffer),t==Float32Array&&(this.uint32=new Uint32Array(this.arraybuffer))}clear(){this.usedElemNum=0}resize(t=0){if((t+=this.usedElemNum)>this.maxElemNum){for(;t>this.maxElemNum;)this.maxElemNum<<=1;this.setMaxSize(this.maxElemNum)}}setMaxSize(t=this.maxElemNum){const e=this.typedArray;this.maxElemNum=t,this.arraybuffer=new ArrayBuffer(t*this.bytePerElem),this.typedArray=new this.arrayType(this.arraybuffer),this.uint32&&(this.uint32=new Uint32Array(this.arraybuffer)),this.typedArray.set(e)}push(t){this.typedArray[this.usedElemNum++]=t}pushUint(t){this.uint32[this.usedElemNum++]=t}pop(t){this.usedElemNum-=t}getArray(t=0,e){return null==e?this.typedArray:this.typedArray.subarray(t,e)}get length(){return this.typedArray.length}}class i extends r{constructor(t,e,r=t.ARRAY_BUFFER){super(e),this.dirty=!0,this.webglBufferSize=0,this.gl=t,this.buffer=t.createBuffer(),this.type=r}push(t){super.push(t),this.dirty=!0}bindBuffer(){this.gl.bindBuffer(this.type,this.buffer)}bufferData(){if(this.dirty){const t=this.gl;this.maxElemNum>this.webglBufferSize?(t.bufferData(this.type,this.getArray(),t.STATIC_DRAW),this.webglBufferSize=this.maxElemNum):t.bufferSubData(this.type,0,this.getArray(0,this.usedElemNum)),this.dirty=!1}}}class s extends r{constructor(){super(Float32Array)}pushMat(){const t=this.usedElemNum-6,e=this.typedArray;this.resize(6),this.push(e[t+0]),this.push(e[t+1]),this.push(e[t+2]),this.push(e[t+3]),this.push(e[t+4]),this.push(e[t+5])}popMat(){this.pop(6)}pushIdentity(){this.resize(6),this.push(1),this.push(0),this.push(0),this.push(1),this.push(0),this.push(0)}translate(t,e){const r=this.usedElemNum-6,i=this.typedArray;i[r+4]=i[r+0]*t+i[r+2]*e+i[r+4],i[r+5]=i[r+1]*t+i[r+3]*e+i[r+5]}rotate(t){const e=this.usedElemNum-6,r=this.typedArray,i=Math.cos(t),s=Math.sin(t),n=r[e+0],a=r[e+1],h=r[e+2],o=r[e+3];r[e+0]=n*i-a*s,r[e+1]=n*s+a*i,r[e+2]=h*i-o*s,r[e+3]=h*s+o*i}scale(t,e=t){const r=this.usedElemNum-6,i=this.typedArray;i[r+0]=i[r+0]*t,i[r+1]=i[r+1]*t,i[r+2]=i[r+2]*e,i[r+3]=i[r+3]*e}apply(t,e){const r=this.usedElemNum-6,i=this.typedArray;return[i[r+0]*t+i[r+2]*e+i[r+4],i[r+1]*t+i[r+3]*e+i[r+5]]}getInverse(){const t=this.usedElemNum-6,e=this.typedArray,r=e[t+0],i=e[t+1],s=e[t+2],n=e[t+3],a=e[t+4],h=e[t+5],o=r*n-i*s;return new Float32Array([n/o,-i/o,-s/o,r/o,(s*h-n*a)/o,(i*a-r*h)/o])}getTransform(){const t=this.usedElemNum-6,e=this.typedArray;return new Float32Array([e[t+0],e[t+1],e[t+2],e[t+3],e[t+4],e[t+5]])}setTransform(t){const e=this.usedElemNum-6,r=this.typedArray;r[e+0]=t[0],r[e+1]=t[1],r[e+2]=t[2],r[e+3]=t[3],r[e+4]=t[4],r[e+5]=t[5]}}class n extends i{constructor(t,e,r,i){super(t,Uint16Array,t.ELEMENT_ARRAY_BUFFER),this.setMaxSize(e*i);for(let t=0;t<i;t++)this.addObject(t*r);this.bindBuffer(),this.bufferData()}addObject(t){}}class a{constructor(t,e,r,i){this._r=t,this._g=e,this._b=r,this._a=i,this.updateUint()}get r(){return this._r}set r(t){this._r=t,this.updateUint()}get g(){return this._g}set g(t){this._g=t,this.updateUint()}get b(){return this._b}set b(t){this._b=t,this.updateUint()}get a(){return this._a}set a(t){this._a=t,this.updateUint()}updateUint(){this.uint32=(this._a<<24|this._b<<16|this._g<<8|this._r)>>>0}setRGBA(t,e,r,i){this.r=t,this.g=e,this.b=r,this.a=i,this.updateUint()}copy(t){this.setRGBA(t.r,t.g,t.b,t.a)}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b&&t.a===this.a}static fromHex(t){t.startsWith("#")&&(t=t.slice(1));const e=parseInt(t.slice(0,2),16),r=parseInt(t.slice(2,4),16),i=parseInt(t.slice(4,6),16);let s=255;return t.length>=8&&(s=parseInt(t.slice(6,8),16)),new a(e,r,i,s)}add(t){return new a(Math.min(this.r+t.r,255),Math.min(this.g+t.g,255),Math.min(this.b+t.b,255),Math.min(this.a+t.a,255))}subtract(t){return new a(Math.max(this.r-t.r,0),Math.max(this.g-t.g,0),Math.max(this.b-t.b,0),Math.max(this.a-t.a,0))}}class h{constructor(e,r,i,s){this.attributeLoc={},this.uniformLoc={};const n=function(t,e){if(t.includes("%TEXTURE_NUM%")&&(t=t.replace("%TEXTURE_NUM%",e.toString())),t.includes("%GET_COLOR%")){let r="";for(let t=0;t<e;t++)r+=0==t?`if(vTextureId == ${t}.0)`:t==e-1?"else":`else if(vTextureId == ${t}.0)`,r+=`{color = texture2D(uTextures[${t}], vRegion);}`;t=t.replace("%GET_COLOR%",r)}return t}(i,e.maxTextureUnits);this.program=((e,r,i)=>{var s=e.createProgram(),n=t(e,r,35633),a=t(e,i,35632);if(!s)throw new Error("Unable to create program shader");return e.attachShader(s,n),e.attachShader(s,a),e.linkProgram(s),s})(e.gl,r,n),this.gl=e.gl,this.attribute=s,this.parseShader(r),this.parseShader(n)}setUniforms(t){const e=this.gl;for(const r in t){const i=t[r],s=this.getUniform(r);if("number"==typeof i)e.uniform1f(s,i);else if(Array.isArray(i))switch(i.length){case 1:Number.isInteger(i[0])?e.uniform1i(s,i[0]):e.uniform1f(s,i[0]);break;case 2:Number.isInteger(i[0])?e.uniform2iv(s,i):e.uniform2fv(s,i);break;case 3:Number.isInteger(i[0])?e.uniform3iv(s,i):e.uniform3fv(s,i);break;case 4:Number.isInteger(i[0])?e.uniform4iv(s,i):e.uniform4fv(s,i);break;case 9:e.uniformMatrix3fv(s,!1,i);break;case 16:e.uniformMatrix4fv(s,!1,i);break;default:console.error(`Unsupported uniform array length for ${r}:`,i.length)}else"boolean"==typeof i?e.uniform1i(s,i?1:0):console.error(`Unsupported uniform type for ${r}:`,typeof i)}}getUniform(t){return this.uniformLoc[t]}use(){this.gl.useProgram(this.program)}parseShader(t){const e=this.gl,r=t.match(/attribute\s+\w+\s+(\w+)/g);if(r)for(const t of r){const r=t.split(" ")[2],i=e.getAttribLocation(this.program,r);-1!=i&&(this.attributeLoc[r]=i)}const i=t.match(/uniform\s+\w+\s+(\w+)/g);if(i)for(const t of i){const r=t.split(" ")[2];this.uniformLoc[r]=e.getUniformLocation(this.program,r)}}setAttribute(t){const e=this.attributeLoc[t.name];if(void 0!==e){const r=this.gl;r.vertexAttribPointer(e,t.size,t.type,t.normalized||!1,t.stride,t.offset||0),r.enableVertexAttribArray(e)}}}class o{constructor(t,e){this.usedTextures=[],this.needBind=new Set,this.attribute=e,this.rapid=t,this.gl=t.gl,this.webglArrayBuffer=new i(t.gl,Float32Array,t.gl.ARRAY_BUFFER),this.TEXTURE_UNITS_ARRAY=Array.from({length:t.maxTextureUnits},((t,e)=>e))}addVertex(t,e,...r){const[i,s]=this.rapid.transformPoint(t,e);this.webglArrayBuffer.push(i),this.webglArrayBuffer.push(s)}useTexture(t){let e=this.usedTextures.indexOf(t);return-1===e&&(this.usedTextures.length>=this.rapid.maxTextureUnits&&this.render(),this.usedTextures.push(t),e=this.usedTextures.length-1,this.needBind.add(e)),e}enterRegion(t){this.currentShader=null!=t?t:this.defaultShader,this.currentShader.use(),this.initializeForNextRender(),this.webglArrayBuffer.bindBuffer();for(const t of this.attribute)this.currentShader.setAttribute(t);this.gl.uniformMatrix4fv(this.currentShader.uniformLoc.uProjectionMatrix,!1,this.rapid.projection)}exitRegion(){}initDefaultShader(t,e){this.webglArrayBuffer.bindBuffer(),this.defaultShader=new h(this.rapid,t,e,this.attribute)}render(){this.executeRender(),this.initializeForNextRender()}executeRender(){this.webglArrayBuffer.bufferData();const t=this.gl;for(const e of this.needBind)t.activeTexture(t.TEXTURE0+e),t.bindTexture(t.TEXTURE_2D,this.usedTextures[e]);this.needBind.clear()}initializeForNextRender(){this.webglArrayBuffer.clear(),this.usedTextures=[]}}class u extends o{constructor(t){super(t,c),this.vertex=0,this.initDefaultShader("precision mediump float;\r\n\r\nattribute vec2 aPosition;\r\nattribute vec4 aColor;\r\nvarying vec4 vColor;\r\nuniform mat4 uProjectionMatrix;\r\nuniform vec4 uColor;\r\n\r\nvoid main(void) {\r\n    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);\r\n    vColor = aColor;\r\n}\r\n","precision mediump float;\r\n\r\nvarying vec4 vColor;\r\nvoid main(void) {\r\n    gl_FragColor = vColor;//vColor;\r\n}\r\n")}startRender(){this.vertex=0,this.webglArrayBuffer.clear()}addVertex(t,e,r){this.webglArrayBuffer.resize(3),super.addVertex(t,e),this.webglArrayBuffer.pushUint(r),this.vertex+=1}drawCircle(t,e,r,i){const s=2*Math.PI/30;this.startRender(),this.addVertex(t,e,i);for(let n=0;n<=30;n++){const a=n*s,h=t+r*Math.cos(a),o=e+r*Math.sin(a);this.addVertex(h,o,i)}this.executeRender()}executeRender(){super.executeRender();const t=this.gl;t.drawArrays(t.TRIANGLE_FAN,0,this.vertex),this.vertex=0}}const c=[{name:"aPosition",size:2,type:e,stride:12},{name:"aColor",size:4,type:5121,stride:12,offset:2*Float32Array.BYTES_PER_ELEMENT,normalized:!0}];class d extends n{constructor(t,e){super(t,6,4,e)}addObject(t){super.addObject(),this.push(t),this.push(t+3),this.push(t+2),this.push(t),this.push(t+1),this.push(t+2)}}class l extends o{constructor(t){const e=t.gl;super(t,f),this.batchSprite=0,this.initDefaultShader("precision mediump float;\r\n\r\nattribute vec2 aPosition;\r\nattribute vec2 aRegion;\r\nattribute float aTextureId;\r\nattribute vec4 aColor;\r\n\r\nuniform mat4 uProjectionMatrix;\r\n\r\nvarying vec2 vRegion;\r\nvarying float vTextureId;\r\nvarying vec4 vColor;\r\n\r\nvoid main(void) {\r\n    vRegion = aRegion;\r\n    vTextureId = aTextureId;\r\n    vColor = aColor;\r\n    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);\r\n}","precision mediump float;\r\nuniform sampler2D uTextures[%TEXTURE_NUM%];\r\n\r\nvarying vec2 vRegion;\r\nvarying float vTextureId;\r\nvarying vec4 vColor;\r\n\r\nvoid main(void) {\r\n    vec4 color;\r\n    %GET_COLOR%\r\n\r\n    gl_FragColor = color*vColor;\r\n}"),this.MAX_BATCH=Math.floor(16384),this.indexBuffer=new d(e,this.MAX_BATCH)}addVertex(t,e,r,i,s,n){super.addVertex(t,e),this.webglArrayBuffer.push(r),this.webglArrayBuffer.push(i),this.webglArrayBuffer.push(s),this.webglArrayBuffer.pushUint(n)}renderSprite(t,e,r,i,s,n,a,h,o,u,c){var d;c&&(null===(d=this.currentShader)||void 0===d||d.setUniforms(c)),this.batchSprite>=this.MAX_BATCH&&this.render(),this.batchSprite++,this.webglArrayBuffer.resize(24);const l=this.useTexture(t),f=h+e,g=o+r,m=i+n,p=s+a;this.addVertex(h,o,i,s,l,u),this.addVertex(f,o,m,s,l,u),this.addVertex(f,g,m,p,l,u),this.addVertex(h,g,i,p,l,u)}executeRender(){super.executeRender();const t=this.gl;t.drawElements(t.TRIANGLES,6*this.batchSprite,t.UNSIGNED_SHORT,0)}enterRegion(t){super.enterRegion(t),this.indexBuffer.bindBuffer(),this.gl.uniform1iv(this.currentShader.uniformLoc.uTextures,this.TEXTURE_UNITS_ARRAY)}initializeForNextRender(){super.initializeForNextRender(),this.batchSprite=0}}const f=[{name:"aPosition",size:2,type:e,stride:24},{name:"aRegion",size:2,type:e,stride:24,offset:2*Float32Array.BYTES_PER_ELEMENT},{name:"aTextureId",size:1,type:e,stride:24,offset:4*Float32Array.BYTES_PER_ELEMENT},{name:"aColor",size:4,type:5121,stride:24,offset:5*Float32Array.BYTES_PER_ELEMENT,normalized:!0}];class g{constructor(t){this.cache=new Map,this.render=t}async textureFromUrl(t,e=!1){let r=this.cache.get(t);if(!r){const i=await this.loadImage(t);r=m.fromImageSource(this.render,i,e),this.cache.set(t,r)}return new p(r)}async loadImage(t){return new Promise((e=>{const r=new Image;r.onload=()=>{e(r)},r.src=t}))}}class m{constructor(t,e,r){this.texture=t,this.width=e,this.height=r}static fromImageSource(t,e,r=!1){return new m(function(t,e,r){const i=t.createTexture();if(t.bindTexture(t.TEXTURE_2D,i),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,r?t.LINEAR:t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,r?t.LINEAR:t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),!i)throw new Error("unable to create texture");return i}(t.gl,e,r),e.width,e.height)}}class p{constructor(t){this.base=t,this.setClipRegion(0,0,t.width,t.height)}setClipRegion(t,e,r,i){this.clipX=t/this.base.width,this.clipY=e/this.base.width,this.clipW=this.clipX+r/this.base.width,this.clipH=this.clipY+i/this.base.width,this.width=r,this.height=i}static fromImageSource(t,e,r=!1){return new p(m.fromImageSource(t,e,r))}static fromUrl(t,e){return t.textures.textureFromUrl(e)}}class x{constructor(t){this.projectionDirty=!0,this.matrixStack=new s,this.textures=new g(this),this.devicePixelRatio=window.devicePixelRatio||1,this.defaultColor=new a(255,255,255,255),this.regions=new Map;const e=(t=>{const e=t.getContext("webgl2")||t.getContext("webgl");if(!e)throw new Error("TODO");return e})(t.canvas);this.gl=e,this.canvas=t.canvas,this.maxTextureUnits=e.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS),this.width=t.width||this.canvas.width,this.height=t.width||this.canvas.height,this.backgroundColor=t.backgroundColor||new a(255,255,255,255),this.registerBuildInRegion(),this.initWebgl(e)}initWebgl(t){this.resize(this.width,this.height),t.enable(t.BLEND),t.disable(t.DEPTH_TEST),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA)}registerBuildInRegion(){this.registerRegion("sprite",l),this.registerRegion("graphic",u)}registerRegion(t,e){this.regions.set(t,new e(this))}setRegion(t,e){if(t!=this.currentRegionName||e&&e!==this.currentRegion.currentShader){const r=this.regions.get(t);this.currentRegion&&(this.currentRegion.render(),this.currentRegion.exitRegion()),this.currentRegion=r,this.currentRegionName=t,r.enterRegion(e)}}save(){this.matrixStack.pushMat()}restore(){this.matrixStack.popMat()}startRender(t=!0){t&&this.matrixStack.clear(),this.matrixStack.pushIdentity(),this.currentRegion=void 0,this.currentRegionName=void 0}endRender(){var t;null===(t=this.currentRegion)||void 0===t||t.render(),this.projectionDirty=!1}renderSprite(t,e=0,r=0,i){if(i instanceof a)return this.renderSprite(t,e,r,{color:i});this.setRegion("sprite",null==i?void 0:i.shader),this.currentRegion.renderSprite(t.base.texture,t.width,t.height,t.clipX,t.clipY,t.clipW,t.clipH,e,r,((null==i?void 0:i.color)||this.defaultColor).uint32,null==i?void 0:i.uniforms)}startGraphicDraw(t){this.setRegion("graphic",t),this.currentRegion.startRender()}addGraphicVertex(t,e,r){this.currentRegion.addVertex(t,e,r.uint32)}endGraphicDraw(){this.currentRegion.render()}resize(t,e){this.width=t,this.height=e;const r=t*this.devicePixelRatio,i=e*this.devicePixelRatio;this.canvas.width=r,this.canvas.height=i,this.gl.viewport(0,0,r,i),this.projection=this.createOrthMatrix(0,t,e,0),this.projectionDirty=!0}clear(){const t=this.gl,e=this.backgroundColor;t.clearColor(e.r,e.g,e.b,e.a),t.clear(t.COLOR_BUFFER_BIT)}createOrthMatrix(t,e,r,i){return new Float32Array([2/(e-t),0,0,0,0,2/(i-r),0,0,0,0,-1,0,-(e+t)/(e-t),-(i+r)/(i-r),0,1])}transformPoint(t,e){return this.matrixStack.apply(t,e)}}export{m as BaseTexture,a as Color,r as DynamicArrayBuffer,h as GLShader,s as MatrixStack,x as Rapid,p as Texture,g as TextureCache,i as WebglBufferArray,n as WebglElementBufferArray,c as graphicAttributes,f as spriteAttributes};
