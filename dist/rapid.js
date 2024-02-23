class t{constructor(t){this.usedElemNum=0,this.maxElemNum=512,this.bytePerElem=t.BYTES_PER_ELEMENT,this.arrayType=t,this.arraybuffer=new ArrayBuffer(this.maxElemNum*this.bytePerElem),this.typedArray=new t(this.arraybuffer),t==Float32Array&&(this.uint32=new Uint32Array(this.arraybuffer))}clear(){this.usedElemNum=0}resize(t=0){if((t+=this.usedElemNum)>this.maxElemNum){for(;t>this.maxElemNum;)this.maxElemNum<<=1;this.setMaxSize(this.maxElemNum)}}setMaxSize(t=this.maxElemNum){const e=this.typedArray;this.maxElemNum=t,this.arraybuffer=new ArrayBuffer(t*this.bytePerElem),this.typedArray=new this.arrayType(this.arraybuffer),this.uint32&&(this.uint32=new Uint32Array(this.arraybuffer)),this.typedArray.set(e)}push(t){this.typedArray[this.usedElemNum++]=t}pushUint(t){this.uint32[this.usedElemNum++]=t}pop(t){this.usedElemNum-=t}getArray(t=0,e){return null==e?this.typedArray:this.typedArray.subarray(t,e)}get length(){return this.typedArray.length}}class e extends t{constructor(t,e,r=t.ARRAY_BUFFER){super(e),this.dirty=!0,this.webglBufferSize=0,this.gl=t,this.buffer=t.createBuffer(),this.type=r}push(t){super.push(t),this.dirty=!0}bindBuffer(){this.gl.bindBuffer(this.type,this.buffer)}bufferData(){if(this.dirty){const t=this.gl;this.maxElemNum>this.webglBufferSize?(t.bufferData(this.type,this.getArray(),t.STATIC_DRAW),this.webglBufferSize=this.maxElemNum):t.bufferSubData(this.type,0,this.getArray(0,this.usedElemNum)),this.dirty=!1}}}class r extends t{constructor(){super(Float32Array)}pushMat(){const t=this.usedElemNum-6,e=this.typedArray;this.resize(6),this.push(e[t+0]),this.push(e[t+1]),this.push(e[t+2]),this.push(e[t+3]),this.push(e[t+4]),this.push(e[t+5])}popMat(){this.pop(6)}pushIdentity(){this.resize(6),this.push(1),this.push(0),this.push(0),this.push(1),this.push(0),this.push(0)}translate(t,e){const r=this.usedElemNum-6,i=this.typedArray;i[r+4]=i[r+0]*t+i[r+2]*e+i[r+4],i[r+5]=i[r+1]*t+i[r+3]*e+i[r+5]}rotate(t){const e=this.usedElemNum-6,r=this.typedArray,i=Math.cos(t),s=Math.sin(t),h=r[e+0],a=r[e+1],n=r[e+2],o=r[e+3];r[e+0]=h*i-a*s,r[e+1]=h*s+a*i,r[e+2]=n*i-o*s,r[e+3]=n*s+o*i}scale(t,e=t){const r=this.usedElemNum-6,i=this.typedArray;i[r+0]=i[r+0]*t,i[r+1]=i[r+1]*t,i[r+2]=i[r+2]*e,i[r+3]=i[r+3]*e}apply(t,e){const r=this.usedElemNum-6,i=this.typedArray;return[i[r+0]*t+i[r+2]*e+i[r+4],i[r+1]*t+i[r+3]*e+i[r+5]]}getInverse(){const t=this.usedElemNum-6,e=this.typedArray,r=e[t+0],i=e[t+1],s=e[t+2],h=e[t+3],a=e[t+4],n=e[t+5],o=r*h-i*s;return new Float32Array([h/o,-i/o,-s/o,r/o,(s*n-h*a)/o,(i*a-r*n)/o])}getTransform(){const t=this.usedElemNum-6,e=this.typedArray;return new Float32Array([e[t+0],e[t+1],e[t+2],e[t+3],e[t+4],e[t+5]])}setTransform(t){const e=this.usedElemNum-6,r=this.typedArray;r[e+0]=t[0],r[e+1]=t[1],r[e+2]=t[2],r[e+3]=t[3],r[e+4]=t[4],r[e+5]=t[5]}}class i extends e{constructor(t,e,r,i){super(t,Uint16Array,t.ELEMENT_ARRAY_BUFFER),this.setMaxSize(e*i);for(let t=0;t<i;t++)this.addObject(t*r);this.bindBuffer(),this.bufferData()}addObject(t){}}class s{constructor(t,e,r,i){this._r=t,this._g=e,this._b=r,this._a=i,this.updateUint()}get r(){return this._r}set r(t){this._r=t,this.updateUint()}get g(){return this._g}set g(t){this._g=t,this.updateUint()}get b(){return this._b}set b(t){this._b=t,this.updateUint()}get a(){return this._a}set a(t){this._a=t,this.updateUint()}updateUint(){this.uint32=(this._a<<24|this._b<<16|this._g<<8|this._r)>>>0}setRGBA(t,e,r,i){this.r=t,this.g=e,this.b=r,this.a=i,this.updateUint()}copy(t){this.setRGBA(t.r,t.g,t.b,t.a)}equals(t){return t.r==this.r&&t.g==this.g&&t.b==this.b&&t.a==this.a}static fromHex(t){t.startsWith("#")&&(t=t.slice(1));const e=parseInt(t.slice(0,2),16),r=parseInt(t.slice(2,4),16),i=parseInt(t.slice(4,6),16);let h=255;return t.length>=8&&(h=parseInt(t.slice(6,8),16)),new s(e,r,i,h)}add(t){return new s(Math.min(this.r+t.r,255),Math.min(this.g+t.g,255),Math.min(this.b+t.b,255),Math.min(this.a+t.a,255))}subtract(t){return new s(Math.max(this.r-t.r,0),Math.max(this.g-t.g,0),Math.max(this.b-t.b,0),Math.max(this.a-t.a,0))}}const h=(t,e,r)=>{const i=t.createShader(r);if(!i)throw new Error("Unable to create webgl shader");t.shaderSource(i,e),t.compileShader(i);if(!t.getShaderParameter(i,t.COMPILE_STATUS)){const r=t.getShaderInfoLog(i);throw console.error("Shader compilation failed:",r),new Error("Unable to compile shader: "+r+e)}return i};class a{constructor(t,e,r){this.attributeLoc={},this.unifromLoc={},this.program=((t,e,r)=>{var i=t.createProgram(),s=h(t,e,35633),a=h(t,r,35632);if(!i)throw new Error("Unable to create program shader");return t.attachShader(i,s),t.attachShader(i,a),t.linkProgram(i),i})(t.gl,e,r),this.gl=t.gl,this.parseShader(e),this.parseShader(r)}use(){this.gl.useProgram(this.program)}parseShader(t){const e=this.gl,r=t.match(/attribute\s+\w+\s+(\w+)/g);if(r)for(const t of r){const r=t.split(" ")[2];this.attributeLoc[r]=e.getAttribLocation(this.program,r)}const i=t.match(/uniform\s+\w+\s+(\w+)/g);if(i)for(const t of i){const r=t.split(" ")[2];this.unifromLoc[r]=e.getUniformLocation(this.program,r)}}setAttribute(t){const e=this.gl;e.vertexAttribPointer(this.attributeLoc[t.name],t.size,t.type,t.normalized||!1,t.stride,t.offset||0),e.enableVertexAttribArray(this.attributeLoc[t.name])}}class n{constructor(t,r){this.usedTextures=[],this.needBind=new Set,this.attribute=r,this.rapid=t,this.gl=t.gl,this.webglArrayBuffer=new e(t.gl,Float32Array,t.gl.ARRAY_BUFFER),this.TEXTURE_UNITS_ARRAY=Array.from({length:t.MAX_TEXTURE_UNITS},((t,e)=>e))}addVertex(t,e,...r){const[i,s]=this.rapid.transformPoint(t,e);this.webglArrayBuffer.push(i),this.webglArrayBuffer.push(s)}useTexture(t){let e=this.usedTextures.indexOf(t);return-1===e&&(this.usedTextures.length>=this.rapid.MAX_TEXTURE_UNITS&&this.render(),this.usedTextures.push(t),e=this.usedTextures.length-1,this.needBind.add(e)),e}enterRegion(t){this.currentShader=null!=t?t:this.defaultShader,this.currentShader.use(),this.initializeForNextRender(),this.webglArrayBuffer.bindBuffer();for(const t of this.attribute)this.currentShader.setAttribute(t);this.gl.uniformMatrix4fv(this.currentShader.unifromLoc.uProjectionMatrix,!1,this.rapid.projection)}exitRegion(){}initDefaultShader(t,e){this.webglArrayBuffer.bindBuffer(),this.defaultShader=new a(this.rapid,t,e)}render(){this.executeRender(),this.initializeForNextRender()}executeRender(){this.webglArrayBuffer.bufferData();const t=this.gl;for(const e of this.needBind)t.activeTexture(t.TEXTURE0+e),t.bindTexture(t.TEXTURE_2D,this.usedTextures[e]);this.needBind.clear()}initializeForNextRender(){this.webglArrayBuffer.clear(),this.usedTextures=[]}}class o extends n{constructor(t){const e=t.gl;super(t,[{name:"aPosition",size:2,type:e.FLOAT,stride:12},{name:"aColor",size:4,type:e.UNSIGNED_BYTE,stride:12,offset:2*Float32Array.BYTES_PER_ELEMENT,normalized:!0}]),this.vertex=0,this.initDefaultShader("precision mediump float;\r\n\r\nattribute vec2 aPosition;\r\nattribute vec4 aColor;\r\nvarying vec4 vColor;\r\nuniform mat4 uProjectionMatrix;\r\nuniform vec4 uColor;\r\n\r\nvoid main(void) {\r\n    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);\r\n    vColor = aColor;\r\n}\r\n","precision mediump float;\r\n\r\nvarying vec4 vColor;\r\nvoid main(void) {\r\n    gl_FragColor = vColor;//vColor;\r\n}\r\n")}startRender(){this.vertex=0,this.webglArrayBuffer.clear()}addVertex(t,e,r){this.webglArrayBuffer.resize(3),super.addVertex(t,e),this.webglArrayBuffer.pushUint(r),this.vertex+=1}executeRender(){super.executeRender();const t=this.gl;t.drawArrays(t.TRIANGLE_FAN,0,this.vertex),this.vertex=0}}class u extends i{constructor(t,e){super(t,6,4,e)}addObject(t){super.addObject(),this.push(t),this.push(t+3),this.push(t+2),this.push(t),this.push(t+1),this.push(t+2)}}class c extends n{constructor(t){const e=t.gl;super(t,[{name:"aPosition",size:2,type:e.FLOAT,stride:24},{name:"aRegion",size:2,type:e.FLOAT,stride:24,offset:2*Float32Array.BYTES_PER_ELEMENT},{name:"aTextureId",size:1,type:e.FLOAT,stride:24,offset:4*Float32Array.BYTES_PER_ELEMENT},{name:"aColor",size:4,type:e.UNSIGNED_BYTE,stride:24,offset:5*Float32Array.BYTES_PER_ELEMENT,normalized:!0}]),this.batchSprite=0,this.initDefaultShader("precision mediump float;\r\n\r\nattribute vec2 aPosition;\r\nattribute vec2 aRegion;\r\nattribute float aTextureId;\r\nattribute vec4 aColor;\r\n\r\nuniform mat4 uProjectionMatrix;\r\n\r\nvarying vec2 vRegion;\r\nvarying float vTextureId;\r\nvarying vec4 vColor;\r\n\r\nvoid main(void) {\r\n    vRegion = aRegion;\r\n    vTextureId = aTextureId;\r\n    vColor = aColor;\r\n    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);\r\n}",this.generateFragShader("precision mediump float;\r\nuniform sampler2D uTextures[%TEXTURE_NUM%];\r\n\r\nvarying vec2 vRegion;\r\nvarying float vTextureId;\r\nvarying vec4 vColor;\r\n\r\nvoid main(void) {\r\n    vec4 color;\r\n    %GET_COLOR%\r\n\r\n    gl_FragColor = color*vColor;\r\n}",t.MAX_TEXTURE_UNITS)),this.MAX_BATCH=Math.floor(16384),this.indexBuffer=new u(e,this.MAX_BATCH)}addVertex(t,e,r,i,s,h){super.addVertex(t,e),this.webglArrayBuffer.push(r),this.webglArrayBuffer.push(i),this.webglArrayBuffer.push(s),this.webglArrayBuffer.pushUint(h)}renderSprite(t,e,r,i,s,h,a,n,o,u){this.batchSprite>=this.MAX_BATCH&&this.render(),this.batchSprite++,this.webglArrayBuffer.resize(24);const c=this.useTexture(t),d=n+e,l=o+r,g=i+h,p=s+a;this.addVertex(n,o,i,s,c,u),this.addVertex(d,o,g,s,c,u),this.addVertex(d,l,g,p,c,u),this.addVertex(n,l,i,p,c,u)}executeRender(){super.executeRender();const t=this.gl;t.drawElements(t.TRIANGLES,6*this.batchSprite,t.UNSIGNED_SHORT,0)}enterRegion(t){super.enterRegion(t),this.indexBuffer.bindBuffer(),this.gl.uniform1iv(this.currentShader.unifromLoc.uTextures,this.TEXTURE_UNITS_ARRAY)}initializeForNextRender(){super.initializeForNextRender(),this.batchSprite=0}generateFragShader(t,e){let r="";t=t.replace("%TEXTURE_NUM%",e.toString());for(let t=0;t<e;t++)r+=0==t?`if(vTextureId == ${t}.0)`:t==e-1?"else":`else if(vTextureId == ${t}.0)`,r+=`{color = texture2D(uTextures[${t}], vRegion);}`;return t=t.replace("%GET_COLOR%",r)}}class d{constructor(t){this.cache=new Map,this.render=t}async textureFromUrl(t,e=!1){let r=this.cache.get(t);if(!r){const i=await this.loadImage(t);r=l.fromImageSource(this.render,i,e),this.cache.set(t,r)}return new g(r)}async loadImage(t){return new Promise((e=>{const r=new Image;r.onload=()=>{e(r)},r.src=t}))}}class l{constructor(t,e,r){this.texture=t,this.width=e,this.height=r}static fromImageSource(t,e,r=!1){return new l(function(t,e,r){const i=t.createTexture();if(t.bindTexture(t.TEXTURE_2D,i),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,r?t.LINEAR:t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,r?t.LINEAR:t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),!i)throw new Error("unable to create texture");return i}(t.gl,e,r),e.width,e.height)}}class g{constructor(t){this.base=t,this.setClipRegion(0,0,t.width,t.height)}setClipRegion(t,e,r,i){this.clipX=t/this.base.width,this.clipY=e/this.base.width,this.clipW=this.clipX+r/this.base.width,this.clipH=this.clipY+i/this.base.width,this.width=r,this.height=i}static fromImageSource(t,e,r=!1){return new g(l.fromImageSource(t,e,r))}static fromUrl(t,e){return t.texture.textureFromUrl(e)}}class p{constructor(t){this.projectionDirty=!0,this.matrixStack=new r,this.texture=new d(this),this.regions=new Map,this.defaultColor=new s(255,255,255,255);const e=(t=>{const e=t.getContext("webgl2")||t.getContext("webgl");if(!e)throw new Error("TODO");return e})(t.canvas);this.gl=e,this.canvas=t.canvas,this.MAX_TEXTURE_UNITS=e.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS),this.projection=this.createOrthMatrix(0,this.canvas.width,this.canvas.height,0),this.registerBuildInRegion(),this.backgroundColor=t.backgroundColor||new s(255,255,255,255),this.width=t.width||this.canvas.width,this.height=t.width||this.canvas.height,this.resize(this.width,this.height),e.enable(e.BLEND),e.disable(e.DEPTH_TEST),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA)}registerBuildInRegion(){this.registerRegion("sprite",c),this.registerRegion("graphic",o)}registerRegion(t,e){this.regions.set(t,new e(this))}setRegion(t,e){if(t!=this.currentRegionName||e&&e!==this.currentRegion.currentShader){const r=this.regions.get(t);this.currentRegion&&(this.currentRegion.render(),this.currentRegion.exitRegion()),this.currentRegion=r,this.currentRegionName=t,r.enterRegion(e)}}save(){this.matrixStack.pushMat()}restore(){this.matrixStack.popMat()}startRender(t=!0){t&&this.matrixStack.clear(),this.matrixStack.pushIdentity(),this.currentRegion=void 0,this.currentRegionName=void 0}endRender(){var t;null===(t=this.currentRegion)||void 0===t||t.render(),this.projectionDirty=!1}renderSprite(t,e=0,r=0,i=this.defaultColor,s){this.setRegion("sprite",s),this.currentRegion.renderSprite(t.base.texture,t.width,t.height,t.clipX,t.clipY,t.clipW,t.clipH,e,r,i.uint32)}startGraphicDraw(t){this.setRegion("graphic",t),this.currentRegion.startRender()}addGraphicVertex(t,e,r){this.currentRegion.addVertex(t,e,r.uint32)}endGraphicDraw(){this.currentRegion.render()}resize(t,e){const r=this.gl;this.width=t,this.height=e,this.projection=this.createOrthMatrix(0,this.width,this.height,0),r.viewport(0,0,this.width,this.height),this.projectionDirty=!0}clear(){const t=this.gl,e=this.backgroundColor;t.clearColor(e.r,e.g,e.b,e.a),t.clear(t.COLOR_BUFFER_BIT)}createOrthMatrix(t,e,r,i){return new Float32Array([2/(e-t),0,0,0,0,2/(i-r),0,0,0,0,-1,0,-(e+t)/(e-t),-(i+r)/(i-r),0,1])}transformPoint(t,e){return this.matrixStack.apply(t,e)}}export{l as BaseTexture,s as Color,t as DynamicArrayBuffer,r as MatrixStack,p as Rapid,g as Texture,d as TextureCache,e as WebglBufferArray,i as WebglElementBufferArray};
