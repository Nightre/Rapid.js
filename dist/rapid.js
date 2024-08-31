const t=(t,e,r)=>{const i=t.createShader(r);if(!i)throw new Error("Unable to create webgl shader");t.shaderSource(i,e),t.compileShader(i);if(!t.getShaderParameter(i,t.COMPILE_STATUS)){const r=t.getShaderInfoLog(i);throw console.error("Shader compilation failed:",r),new Error("Unable to compile shader: "+r+e)}return i};const e=5126;class r{constructor(t){this.usedElemNum=0,this.maxElemNum=512,this.bytePerElem=t.BYTES_PER_ELEMENT,this.arrayType=t,this.arraybuffer=new ArrayBuffer(this.maxElemNum*this.bytePerElem),this.typedArray=new t(this.arraybuffer),t==Float32Array&&(this.uint32=new Uint32Array(this.arraybuffer))}clear(){this.usedElemNum=0}resize(t=0){if((t+=this.usedElemNum)>this.maxElemNum){for(;t>this.maxElemNum;)this.maxElemNum<<=1;this.setMaxSize(this.maxElemNum)}}setMaxSize(t=this.maxElemNum){const e=this.typedArray;this.maxElemNum=t,this.arraybuffer=new ArrayBuffer(t*this.bytePerElem),this.typedArray=new this.arrayType(this.arraybuffer),this.uint32&&(this.uint32=new Uint32Array(this.arraybuffer)),this.typedArray.set(e)}push(t){this.typedArray[this.usedElemNum++]=t}pushUint(t){this.uint32[this.usedElemNum++]=t}pop(t){this.usedElemNum-=t}getArray(t=0,e){return null==e?this.typedArray:this.typedArray.subarray(t,e)}get length(){return this.typedArray.length}}class i extends r{constructor(t,e,r=t.ARRAY_BUFFER){super(e),this.dirty=!0,this.webglBufferSize=0,this.gl=t,this.buffer=t.createBuffer(),this.type=r}push(t){super.push(t),this.dirty=!0}bindBuffer(){this.gl.bindBuffer(this.type,this.buffer)}bufferData(){if(this.dirty){const t=this.gl;this.maxElemNum>this.webglBufferSize?(t.bufferData(this.type,this.getArray(),t.STATIC_DRAW),this.webglBufferSize=this.maxElemNum):t.bufferSubData(this.type,0,this.getArray(0,this.usedElemNum)),this.dirty=!1}}}class s extends r{constructor(){super(Float32Array)}pushMat(){const t=this.usedElemNum-6,e=this.typedArray;this.resize(6),this.push(e[t+0]),this.push(e[t+1]),this.push(e[t+2]),this.push(e[t+3]),this.push(e[t+4]),this.push(e[t+5])}popMat(){this.pop(6)}pushIdentity(){this.resize(6),this.push(1),this.push(0),this.push(0),this.push(1),this.push(0),this.push(0)}translate(t,e){if(t instanceof a)return this.translate(t.x,t.y);const r=this.usedElemNum-6,i=this.typedArray;i[r+4]=i[r+0]*t+i[r+2]*e+i[r+4],i[r+5]=i[r+1]*t+i[r+3]*e+i[r+5]}rotate(t){const e=this.usedElemNum-6,r=this.typedArray,i=Math.cos(t),s=Math.sin(t),n=r[e+0],h=r[e+1],a=r[e+2],o=r[e+3];r[e+0]=n*i-h*s,r[e+1]=n*s+h*i,r[e+2]=a*i-o*s,r[e+3]=a*s+o*i}scale(t,e){if(t instanceof a)return this.scale(t.x,t.y);const r=this.usedElemNum-6,i=this.typedArray;i[r+0]=i[r+0]*t,i[r+1]=i[r+1]*t,i[r+2]=i[r+2]*e,i[r+3]=i[r+3]*e}apply(t,e){if(t instanceof a)return new a(...this.apply(t.x,t.y));const r=this.usedElemNum-6,i=this.typedArray;return[i[r+0]*t+i[r+2]*e+i[r+4],i[r+1]*t+i[r+3]*e+i[r+5]]}getInverse(){const t=this.usedElemNum-6,e=this.typedArray,r=e[t+0],i=e[t+1],s=e[t+2],n=e[t+3],h=e[t+4],a=e[t+5],o=r*n-i*s;return new Float32Array([n/o,-i/o,-s/o,r/o,(s*a-n*h)/o,(i*h-r*a)/o])}getTransform(){const t=this.usedElemNum-6,e=this.typedArray;return new Float32Array([e[t+0],e[t+1],e[t+2],e[t+3],e[t+4],e[t+5]])}setTransform(t){const e=this.usedElemNum-6,r=this.typedArray;r[e+0]=t[0],r[e+1]=t[1],r[e+2]=t[2],r[e+3]=t[3],r[e+4]=t[4],r[e+5]=t[5]}}class n extends i{constructor(t,e,r,i){super(t,Uint16Array,t.ELEMENT_ARRAY_BUFFER),this.setMaxSize(e*i);for(let t=0;t<i;t++)this.addObject(t*r);this.bindBuffer(),this.bufferData()}addObject(t){}}class h{constructor(t,e,r,i){this._r=t,this._g=e,this._b=r,this._a=i,this.updateUint()}get r(){return this._r}set r(t){this._r=t,this.updateUint()}get g(){return this._g}set g(t){this._g=t,this.updateUint()}get b(){return this._b}set b(t){this._b=t,this.updateUint()}get a(){return this._a}set a(t){this._a=t,this.updateUint()}updateUint(){this.uint32=(this._a<<24|this._b<<16|this._g<<8|this._r)>>>0}setRGBA(t,e,r,i){this.r=t,this.g=e,this.b=r,this.a=i,this.updateUint()}copy(t){this.setRGBA(t.r,t.g,t.b,t.a)}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b&&t.a===this.a}static fromHex(t){t.startsWith("#")&&(t=t.slice(1));const e=parseInt(t.slice(0,2),16),r=parseInt(t.slice(2,4),16),i=parseInt(t.slice(4,6),16);let s=255;return t.length>=8&&(s=parseInt(t.slice(6,8),16)),new h(e,r,i,s)}add(t){return new h(Math.min(this.r+t.r,255),Math.min(this.g+t.g,255),Math.min(this.b+t.b,255),Math.min(this.a+t.a,255))}subtract(t){return new h(Math.max(this.r-t.r,0),Math.max(this.g-t.g,0),Math.max(this.b-t.b,0),Math.max(this.a-t.a,0))}}class a{constructor(t,e){this.x=void 0!==t?t:0,this.y=void 0!==e?e:0}scalarMult(t){return this.x*=t,this.y*=t,this}perpendicular(){const t=this.x;return this.x=-this.y,this.y=t,this}invert(){return this.x=-this.x,this.y=-this.y,this}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}normalize(){const t=this.length();return this.x/=t,this.y/=t,this}angle(){return this.y/this.x}static Angle(t,e){return Math.atan2(e.x-t.x,e.y-t.y)}static Add(t,e){return new a(t.x+e.x,t.y+e.y)}static Sub(t,e){return new a(t.x-e.x,t.y-e.y)}static Middle(t,e){return a.Add(t,e).scalarMult(.5)}}class o{constructor(t){this.cache=new Map,this.render=t}async textureFromUrl(t,e=!1){let r=this.cache.get(t);if(!r){const i=await this.loadImage(t);r=u.fromImageSource(this.render,i,e),this.cache.set(t,r)}return new l(r)}async loadImage(t){return new Promise((e=>{const r=new Image;r.onload=()=>{e(r)},r.src=t}))}createText(t){return new c(this.render,t)}}class u{constructor(t,e,r){this.texture=t,this.width=e,this.height=r}static fromImageSource(t,e,r=!1){return new u(function(t,e,r){const i=t.createTexture();if(t.bindTexture(t.TEXTURE_2D,i),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,r?t.LINEAR:t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,r?t.LINEAR:t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),!i)throw new Error("unable to create texture");return i}(t.gl,e,r),e.width,e.height)}}class l{constructor(t){this.scale=1,this.setBase(t)}setBase(t,e=1){t&&(this.base=t,this.setClipRegion(0,0,t.width*e,t.height*e))}setClipRegion(t,e,r,i){this.base&&(this.clipX=t/this.base.width,this.clipY=e/this.base.width,this.clipW=this.clipX+r/this.base.width,this.clipH=this.clipY+i/this.base.height,this.width=r*this.scale,this.height=i*this.scale)}static fromImageSource(t,e,r=!1){return new l(u.fromImageSource(t,e,r))}static fromUrl(t,e){return t.textures.textureFromUrl(e)}}const d=2;class c extends l{constructor(t,e){super(),this.scale=.5,this.rapid=t,this.options=e,this.text=e.text||"",this.updateTextImage()}updateTextImage(){const t=this.createTextCanvas();this.setBase(u.fromImageSource(this.rapid,t,!0))}createTextCanvas(){const t=document.createElement("canvas"),e=t.getContext("2d");if(!e)throw new Error("Failed to get canvas context");e.font=`${this.options.fontSize||16}px ${this.options.fontFamily||"Arial"}`,e.fillStyle=this.options.color||"#000",e.textAlign=this.options.textAlign||"left",e.textBaseline=this.options.textBaseline||"top";const r=this.text.split("\n");let i=0,s=0;for(const t of r){const r=e.measureText(t);i=Math.max(i,r.width),s+=this.options.fontSize||16}t.width=2*i,t.height=2*s,e.scale(2,2),e.font=`${this.options.fontSize||16}px ${this.options.fontFamily||"Arial"}`,e.fillStyle=this.options.color||"#000",e.textAlign=this.options.textAlign||"left",e.textBaseline=this.options.textBaseline||"top";let n=0;for(const t of r)e.fillText(t,0,n),n+=this.options.fontSize||16;return t}setText(t){this.text=t,this.updateTextImage()}}class p{constructor(e,r,i){this.attributeLoc={},this.uniformLoc={};const s=function(t,e){if(t.includes("%TEXTURE_NUM%")&&(t=t.replace("%TEXTURE_NUM%",e.toString())),t.includes("%GET_COLOR%")){let r="";for(let t=0;t<e;t++)r+=0==t?`if(vTextureId == ${t}.0)`:t==e-1?"else":`else if(vTextureId == ${t}.0)`,r+=`{color = texture2D(uTextures[${t}], vRegion);}`;t=t.replace("%GET_COLOR%",r)}return t}(i,e.maxTextureUnits);this.program=((e,r,i)=>{var s=e.createProgram(),n=t(e,r,35633),h=t(e,i,35632);if(!s)throw new Error("Unable to create program shader");return e.attachShader(s,n),e.attachShader(s,h),e.linkProgram(s),s})(e.gl,r,s),this.gl=e.gl,this.parseShader(r),this.parseShader(s)}setUniforms(t,e){var r;const i=this.gl;for(const s in t){const n=t[s],h=this.getUniform(s);if(n instanceof l&&(null===(r=n.base)||void 0===r?void 0:r.texture))i.activeTexture(i.TEXTURE0+e),i.bindTexture(i.TEXTURE_2D,n.base.texture),i.uniform1i(h,e),e+=1;else if("number"==typeof n)i.uniform1f(h,n);else if(Array.isArray(n))switch(n.length){case 1:Number.isInteger(n[0])?i.uniform1i(h,n[0]):i.uniform1f(h,n[0]);break;case 2:Number.isInteger(n[0])?i.uniform2iv(h,n):i.uniform2fv(h,n);break;case 3:Number.isInteger(n[0])?i.uniform3iv(h,n):i.uniform3fv(h,n);break;case 4:Number.isInteger(n[0])?i.uniform4iv(h,n):i.uniform4fv(h,n);break;case 9:i.uniformMatrix3fv(h,!1,n);break;case 16:i.uniformMatrix4fv(h,!1,n);break;default:console.error(`Unsupported uniform array length for ${s}:`,n.length)}else"boolean"==typeof n?i.uniform1i(h,n?1:0):console.error(`Unsupported uniform type for ${s}:`,typeof n)}}getUniform(t){return this.uniformLoc[t]}use(){this.gl.useProgram(this.program)}parseShader(t){const e=this.gl,r=t.match(/attribute\s+\w+\s+(\w+)/g);if(r)for(const t of r){const r=t.split(" ")[2],i=e.getAttribLocation(this.program,r);-1!=i&&(this.attributeLoc[r]=i)}const i=t.match(/uniform\s+\w+\s+(\w+)/g);if(i)for(const t of i){const r=t.split(" ")[2];this.uniformLoc[r]=e.getUniformLocation(this.program,r)}}setAttribute(t){const e=this.attributeLoc[t.name];if(void 0!==e){const r=this.gl;r.vertexAttribPointer(e,t.size,t.type,t.normalized||!1,t.stride,t.offset||0),r.enableVertexAttribArray(e)}}}class f{constructor(t,e){this.usedTextures=[],this.needBind=new Set,this.attribute=e,this.rapid=t,this.gl=t.gl,this.webglArrayBuffer=new i(t.gl,Float32Array,t.gl.ARRAY_BUFFER),this.TEXTURE_UNITS_ARRAY=Array.from({length:t.maxTextureUnits},((t,e)=>e))}addVertex(t,e,...r){const[i,s]=this.rapid.transformPoint(t,e);this.webglArrayBuffer.push(i),this.webglArrayBuffer.push(s)}useTexture(t){let e=this.usedTextures.indexOf(t);return-1===e&&(this.usedTextures.length>=this.rapid.maxTextureUnits&&this.render(),this.usedTextures.push(t),e=this.usedTextures.length-1,this.needBind.add(e)),e}enterRegion(t){this.currentShader=null!=t?t:this.defaultShader,this.currentShader.use(),this.initializeForNextRender(),this.webglArrayBuffer.bindBuffer();for(const t of this.attribute)this.currentShader.setAttribute(t);this.gl.uniformMatrix4fv(this.currentShader.uniformLoc.uProjectionMatrix,!1,this.rapid.projection)}exitRegion(){}initDefaultShader(t,e){this.webglArrayBuffer.bindBuffer(),this.defaultShader=new p(this.rapid,t,e)}render(){this.executeRender(),this.initializeForNextRender()}executeRender(){this.webglArrayBuffer.bufferData();const t=this.gl;for(const e of this.needBind)t.activeTexture(t.TEXTURE0+e),t.bindTexture(t.TEXTURE_2D,this.usedTextures[e]);this.needBind.clear()}initializeForNextRender(){this.webglArrayBuffer.clear(),this.usedTextures=[]}}class g extends f{constructor(t){super(t,m),this.vertex=0,this.drawType=t.gl.TRIANGLE_FAN,this.initDefaultShader("precision mediump float;\r\n\r\nattribute vec2 aPosition;\r\nattribute vec4 aColor;\r\nvarying vec4 vColor;\r\nuniform mat4 uProjectionMatrix;\r\nuniform vec4 uColor;\r\n\r\nvoid main(void) {\r\n    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);\r\n    vColor = aColor;\r\n}\r\n","precision mediump float;\r\n\r\nvarying vec4 vColor;\r\nvoid main(void) {\r\n    gl_FragColor = vColor;//vColor;\r\n}\r\n")}startRender(){this.vertex=0,this.webglArrayBuffer.clear()}addVertex(t,e,r){this.webglArrayBuffer.resize(3),super.addVertex(t,e),this.webglArrayBuffer.pushUint(r),this.vertex+=1}drawCircle(t,e,r,i){const s=2*Math.PI/30;this.startRender(),this.addVertex(t,e,i);for(let n=0;n<=30;n++){const h=n*s,a=t+r*Math.cos(h),o=e+r*Math.sin(h);this.addVertex(a,o,i)}this.executeRender()}executeRender(){super.executeRender();this.gl.drawArrays(this.drawType,0,this.vertex),this.drawType=this.rapid.gl.TRIANGLE_FAN,this.vertex=0}}const m=[{name:"aPosition",size:2,type:e,stride:12},{name:"aColor",size:4,type:5121,stride:12,offset:2*Float32Array.BYTES_PER_ELEMENT,normalized:!0}];class x extends n{constructor(t,e){super(t,6,4,e)}addObject(t){super.addObject(),this.push(t),this.push(t+3),this.push(t+2),this.push(t),this.push(t+1),this.push(t+2)}}class y extends f{constructor(t){const e=t.gl;super(t,E),this.batchSprite=0,this.initDefaultShader("precision mediump float;\r\n\r\nattribute vec2 aPosition;\r\nattribute vec2 aRegion;\r\nattribute float aTextureId;\r\nattribute vec4 aColor;\r\n\r\nuniform mat4 uProjectionMatrix;\r\n\r\nvarying vec2 vRegion;\r\nvarying float vTextureId;\r\nvarying vec4 vColor;\r\n\r\nvoid main(void) {\r\n    vRegion = aRegion;\r\n    vTextureId = aTextureId;\r\n    vColor = aColor;\r\n    gl_Position = uProjectionMatrix * vec4(aPosition, 0.0, 1.0);\r\n}","precision mediump float;\r\nuniform sampler2D uTextures[%TEXTURE_NUM%];\r\n\r\nvarying vec2 vRegion;\r\nvarying float vTextureId;\r\nvarying vec4 vColor;\r\n\r\nvoid main(void) {\r\n    vec4 color;\r\n    %GET_COLOR%\r\n\r\n    gl_FragColor = color*vColor;\r\n}"),this.MAX_BATCH=Math.floor(16384),this.indexBuffer=new x(e,this.MAX_BATCH)}addVertex(t,e,r,i,s,n){super.addVertex(t,e),this.webglArrayBuffer.push(r),this.webglArrayBuffer.push(i),this.webglArrayBuffer.push(s),this.webglArrayBuffer.pushUint(n)}renderSprite(t,e,r,i,s,n,h,a,o,u,l){var d;l&&(null===(d=this.currentShader)||void 0===d||d.setUniforms(l,1)),this.batchSprite>=this.MAX_BATCH&&this.render(),this.batchSprite++,this.webglArrayBuffer.resize(24);const c=this.useTexture(t),p=a+e,f=o+r,g=i+n,m=s+h;this.addVertex(a,o,i,s,c,u),this.addVertex(p,o,g,s,c,u),this.addVertex(p,f,g,m,c,u),this.addVertex(a,f,i,m,c,u)}executeRender(){super.executeRender();const t=this.gl;t.drawElements(t.TRIANGLES,6*this.batchSprite,t.UNSIGNED_SHORT,0)}enterRegion(t){super.enterRegion(t),this.indexBuffer.bindBuffer(),this.gl.uniform1iv(this.currentShader.uniformLoc.uTextures,this.TEXTURE_UNITS_ARRAY)}initializeForNextRender(){super.initializeForNextRender(),this.batchSprite=0}}const E=[{name:"aPosition",size:2,type:e,stride:24},{name:"aRegion",size:2,type:e,stride:24,offset:2*Float32Array.BYTES_PER_ELEMENT},{name:"aTextureId",size:1,type:e,stride:24,offset:4*Float32Array.BYTES_PER_ELEMENT},{name:"aColor",size:4,type:5121,stride:24,offset:5*Float32Array.BYTES_PER_ELEMENT,normalized:!0}];var b,A;!function(t){t[t.BEVEL=0]="BEVEL",t[t.ROUND=1]="ROUND",t[t.MITER=2]="MITER"}(b||(b={})),function(t){t[t.BUTT=0]="BUTT",t[t.ROUND=1]="ROUND",t[t.SQUARE=2]="SQUARE"}(A||(A={}));const T=1e-4,R=(t,e,r,i)=>{i.push(t),i.push(a.Add(t,r)),i.push(a.Add(e,r)),i.push(e),i.push(a.Add(e,r)),i.push(t)},S=(t,e,r,i,s)=>{const n=a.Sub(t,e).length();let h=Math.atan2(r.y-t.y,r.x-t.x),o=Math.atan2(e.y-t.y,e.x-t.x);const u=h;o>h?o-h>=Math.PI-T&&(o-=2*Math.PI):h-o>=Math.PI-T&&(h-=2*Math.PI);let l=o-h;if(Math.abs(l)>=Math.PI-T&&Math.abs(l)<=Math.PI+T){const e=a.Sub(t,i);0===e.x?e.y>0&&(l=-l):e.x>=-1e-4&&(l=-l)}const d=(Math.abs(l*n)/7>>0)+1,c=l/d;for(let e=0;e<d;e++)s.push(new a(t.x,t.y)),s.push(new a(t.x+n*Math.cos(u+c*e),t.y+n*Math.sin(u+c*e))),s.push(new a(t.x+n*Math.cos(u+c*(1+e)),t.y+n*Math.sin(u+c*(1+e))))},w=(t,e,r,i,s,n,h)=>{const o=a.Sub(e,t).perpendicular(),u=a.Sub(r,e).perpendicular();((t,e,r)=>(e.x-t.x)*(r.y-t.y)-(r.x-t.x)*(e.y-t.y))(t,e,r)>0&&(o.invert(),u.invert()),o.normalize().scalarMult(s),u.normalize().scalarMult(s);const l=((t,e,r,i)=>{const s=e.y-t.y,n=t.x-e.x,h=i.y-r.y,o=r.x-i.x,u=s*o-h*n;if(u>-1e-4&&u<T)return null;{const e=s*t.x+n*t.y,i=h*r.x+o*r.y;return new a((o*e-n*i)/u,(s*i-h*e)/u)}})(a.Add(o,t),a.Add(o,e),a.Add(u,r),a.Add(u,e));let d=null,c=Number.MAX_VALUE;l&&(d=a.Sub(l,e),c=d.length());const p=c/s|0,f=a.Sub(t,e).length(),g=a.Sub(e,r).length();if(c>f||c>g)i.push(a.Add(t,o)),i.push(a.Sub(t,o)),i.push(a.Add(e,o)),i.push(a.Sub(t,o)),i.push(a.Add(e,o)),i.push(a.Sub(e,o)),n===b.ROUND?S(e,a.Add(e,o),a.Add(e,u),r,i):n===b.BEVEL||n===b.MITER&&p>=h?(i.push(e),i.push(a.Add(e,o)),i.push(a.Add(e,u))):n===b.MITER&&p<h&&l&&(i.push(a.Add(e,o)),i.push(e),i.push(l),i.push(a.Add(e,u)),i.push(e),i.push(l)),i.push(a.Add(r,u)),i.push(a.Sub(e,u)),i.push(a.Add(e,u)),i.push(a.Add(r,u)),i.push(a.Sub(e,u)),i.push(a.Sub(r,u));else{if(i.push(a.Add(t,o)),i.push(a.Sub(t,o)),i.push(a.Sub(e,d)),i.push(a.Add(t,o)),i.push(a.Sub(e,d)),i.push(a.Add(e,o)),n===b.ROUND){const t=a.Add(e,o),r=a.Add(e,u),s=a.Sub(e,d),n=e;i.push(t),i.push(n),i.push(s),S(n,t,r,s,i),i.push(n),i.push(r),i.push(s)}else(n===b.BEVEL||n===b.MITER&&p>=h)&&(i.push(a.Add(e,o)),i.push(a.Add(e,u)),i.push(a.Sub(e,d))),n===b.MITER&&p<h&&(i.push(l),i.push(a.Add(e,o)),i.push(a.Add(e,u)));i.push(a.Add(r,u)),i.push(a.Sub(e,d)),i.push(a.Add(e,u)),i.push(a.Add(r,u)),i.push(a.Sub(e,d)),i.push(a.Sub(r,u))}};class v{constructor(t){this.projectionDirty=!0,this.matrixStack=new s,this.textures=new o(this),this.devicePixelRatio=window.devicePixelRatio||1,this.defaultColor=new h(255,255,255,255),this.defaultColorBlack=new h(0,0,0,255),this.regions=new Map;const e=(t=>{const e=t.getContext("webgl2")||t.getContext("webgl");if(!e)throw new Error("TODO");return e})(t.canvas);this.gl=e,this.canvas=t.canvas,this.maxTextureUnits=e.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS),this.width=t.width||this.canvas.width,this.height=t.width||this.canvas.height,this.backgroundColor=t.backgroundColor||new h(255,255,255,255),this.registerBuildInRegion(),this.initWebgl(e)}initWebgl(t){this.resize(this.width,this.height),t.enable(t.BLEND),t.disable(t.DEPTH_TEST),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA)}registerBuildInRegion(){this.registerRegion("sprite",y),this.registerRegion("graphic",g)}registerRegion(t,e){this.regions.set(t,new e(this))}setRegion(t,e){if(t!=this.currentRegionName||e&&e!==this.currentRegion.currentShader){const r=this.regions.get(t);this.currentRegion&&(this.currentRegion.render(),this.currentRegion.exitRegion()),this.currentRegion=r,this.currentRegionName=t,r.enterRegion(e)}}save(){this.matrixStack.pushMat()}restore(){this.matrixStack.popMat()}startRender(t=!0){t&&this.matrixStack.clear(),this.matrixStack.pushIdentity(),this.currentRegion=void 0,this.currentRegionName=void 0}endRender(){var t;null===(t=this.currentRegion)||void 0===t||t.render(),this.projectionDirty=!1}renderSprite(t,e=0,r=0,i){if(t.base){if(i instanceof h)return this.renderSprite(t,e,r,{color:i});this.setRegion("sprite",null==i?void 0:i.shader),this.currentRegion.renderSprite(t.base.texture,t.width,t.height,t.clipX,t.clipY,t.clipW,t.clipH,e,r,((null==i?void 0:i.color)||this.defaultColor).uint32,null==i?void 0:i.uniforms)}}renderLine(t=0,e=0,r){const i=((t,e)=>{if(t.length<2)return[];let r=e.cap||A.BUTT,i=e.join||b.BEVEL,s=(e.width||1)/2,n=e.miterLimit||10,h=[],o=[];if(2===t.length)i=b.BEVEL,w(t[0],a.Middle(t[0],t[1]),t[1],h,s,i,n);else{for(let e=0;e<t.length-1;e++)0===e?o.push(t[0]):e===t.length-2?o.push(t[t.length-1]):o.push(a.Middle(t[e],t[e+1]));for(let e=1;e<o.length;e++)w(o[e-1],t[e],o[e],h,s,i,n)}if(r===A.ROUND){let e=h[0],r=h[1],i=t[1],s=h[h.length-1],n=h[h.length-3],a=t[t.length-2];S(t[0],e,r,i,h),S(t[t.length-1],s,n,a,h)}else if(r===A.SQUARE){let e=h[h.length-1],r=h[h.length-3];R(h[0],h[1],a.Sub(t[0],t[1]).normalize().scalarMult(a.Sub(t[0],h[0]).length()),h),R(e,r,a.Sub(t[t.length-1],t[t.length-2]).normalize().scalarMult(a.Sub(r,t[t.length-1]).length()),h)}return h})(r.points,r);this.renderGraphic(t,e,i,r.color,this.gl.TRIANGLES)}renderGraphic(t=0,e=0,r,i,s){this.startGraphicDraw(),s&&(this.currentRegion.drawType=s),r.forEach((r=>{this.addGraphicVertex(r.x+t,r.y+e,i||this.defaultColorBlack)})),this.endGraphicDraw()}startGraphicDraw(t){this.setRegion("graphic",t),this.currentRegion.startRender()}addGraphicVertex(t,e,r){if(t instanceof a)return this.addGraphicVertex(t.x,t.y,e);this.currentRegion.addVertex(t,e,r.uint32)}endGraphicDraw(){this.currentRegion.render()}resize(t,e){this.width=t,this.height=e;const r=t*this.devicePixelRatio,i=e*this.devicePixelRatio;this.canvas.width=r,this.canvas.height=i,this.gl.viewport(0,0,r,i),this.projection=this.createOrthMatrix(0,t,e,0),this.projectionDirty=!0}clear(){const t=this.gl,e=this.backgroundColor;t.clearColor(e.r,e.g,e.b,e.a),t.clear(t.COLOR_BUFFER_BIT)}createOrthMatrix(t,e,r,i){return new Float32Array([2/(e-t),0,0,0,0,2/(i-r),0,0,0,0,-1,0,-(e+t)/(e-t),-(i+r)/(i-r),0,1])}transformPoint(t,e){return this.matrixStack.apply(t,e)}}export{u as BaseTexture,A as CapTyps,h as Color,r as DynamicArrayBuffer,p as GLShader,b as JoinTyps,s as MatrixStack,v as Rapid,d as SCALEFACTOR,c as Text,l as Texture,o as TextureCache,a as Vec2,i as WebglBufferArray,n as WebglElementBufferArray,m as graphicAttributes,E as spriteAttributes};
