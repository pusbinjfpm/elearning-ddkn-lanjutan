// Approved reception motion; amplitude 1.65 by default in game settings.
function createReceptionMotion(canvas, asset, onFailure){
const W=1672,H=941;let gl,program,texture,uniforms={},vertexCount=0,ready=false,enabled=false,amplitude=1.65,time=0,last=0,frame=0;
const vs=`attribute vec2 aPosition; uniform float uTime;uniform float uPower;uniform float uCharacters;uniform float uPlants;varying vec2 vUV;
float bell(vec2 p,vec2 c,vec2 r){vec2 d=(p-c)/r;return exp(-dot(d,d)*2.0);}
void main(){vec2 p=aPosition;vUV=p/vec2(1672.,941.);float t=uTime;
if(p.x>430.&&p.x<870.){float b=sin(t*1.43);float anchor=clamp((550.-p.y)/325.,0.,1.);p.y-=b*1.7*anchor*uPower*uCharacters;p.x+=sin(t*.71)*.6*anchor*uPower*uCharacters;float hand=bell(aPosition,vec2(722.,499.),vec2(150.,65.));p.y+=sin(t*1.1+.8)*1.35*hand*uPower*uCharacters;p.x+=sin(t*.9)*.65*hand*uPower*uCharacters;}
if(p.x>900.){float b=sin(t*1.17+.9);float anchor=clamp((941.-p.y)/700.,0.,1.);p.y-=b*1.8*anchor*uPower*uCharacters;p.x+=(p.x-1175.)*.0024*b*anchor*uPower*uCharacters;float hand=bell(aPosition,vec2(983.,867.),vec2(85.,130.));p.x+=sin(t*.92)*1.25*hand*uPower*uCharacters;float hair=bell(aPosition,vec2(1170.,150.),vec2(140.,100.));p.x+=sin(t*.85+.4)*.45*hair*uPower*uCharacters;}
if(p.x<300.){float top=clamp((488.-p.y)/188.,0.,1.);float trail=clamp((p.y-540.)/230.,0.,1.)*smoothstep(80.,155.,p.x);p.x+=(sin(t*1.05)*top*1.8+sin(t*.86+.5)*trail*3.0)*uPower*uPlants;p.y+=sin(t*1.1+.7)*top*.65*uPower*uPlants;}
gl_Position=vec4(p.x/1672.*2.-1.,1.-p.y/941.*2.,0.,1.);}`;
const fs=`precision mediump float;uniform sampler2D uTexture;uniform float uBlink;varying vec2 vUV;
void eye(inout vec4 color,vec2 p,vec2 center,vec2 radius){vec2 d=(p-center)/radius;float ellipse=dot(d,d);if(ellipse<1.0&&uBlink>.01){float edge=-1.0+uBlink*2.05;if(d.y<edge){float mixEdge=1.-smoothstep(.86,1.,ellipse);vec3 skin=mix(vec3(.96,.64,.43),vec3(1.,.71,.50),clamp(d.y*.5+.5,0.,1.));color.rgb=mix(color.rgb,skin,mixEdge);float curve=.17*(1.-d.x*d.x);float stroke=1.-smoothstep(.06,.18,abs(d.y-(edge-.13+curve)));color.rgb=mix(color.rgb,vec3(.19,.105,.075),stroke*mixEdge*.90);}}}
void main(){vec4 c=texture2D(uTexture,vUV);vec2 p=vUV*vec2(1672.,941.);if(p.x>430.&&p.x<870.){c.a*=1.-smoothstep(563.-.033*p.x,565.-.033*p.x,p.y);eye(c,p,vec2(596.,303.),vec2(14.5,10.5));eye(c,p,vec2(645.,309.),vec2(12.5,10.5));}if(c.a<.015)discard;gl_FragColor=c;}`;

const dust=document.getElementById('receptionDust'),glow=document.getElementById('receptionGlow');
for(let i=0;i<14;i++){const dot=document.createElement('i');dot.style.setProperty('--x',(54+(i*17%43))+'%');dot.style.setProperty('--y',(8+(i*23%76))+'%');dust.appendChild(dot);}const dots=[...dust.children];
const img=new Image();
function shader(kind,source){const sh=gl.createShader(kind);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));return sh;}
function init(){gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl)throw new Error('WebGL tidak tersedia');program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const vertices=[];for(const [x0,y0,x1,y1] of [[0,285,275,790],[445,205,855,565],[925,80,1420,941]]){const nx=Math.ceil((x1-x0)/15),ny=Math.ceil((y1-y0)/15);for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){let a=x0+(x1-x0)*x/nx,b=y0+(y1-y0)*y/ny,c=x0+(x1-x0)*(x+1)/nx,d=y0+(y1-y0)*(y+1)/ny;vertices.push(a,b,c,b,a,d,a,d,c,b,c,d);}}
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);vertexCount=vertices.length/2;
for(const n of ['uTime','uPower','uCharacters','uPlants','uBlink','uTexture'])uniforms[n]=gl.getUniformLocation(program,n);texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.uniform1i(uniforms.uTexture,0);gl.viewport(0,0,W,H);ready=true;}
function blink(t){const phase=t%11.7;for(const start of [3.1,7.65,7.98]){const dt=phase-start;if(dt>=0&&dt<.19)return Math.sin(Math.PI*dt/.19);}return 0;}

function render(){const t=time,lit=amplitude>0;glow.style.opacity=lit?String(.14+.075*Math.sin(t*.67)+.035*Math.sin(t*.31)):'0';dust.style.opacity=lit?'1':'0';if(lit)dots.forEach((dot,i)=>{dot.style.transform=`translate(${Math.sin(t*.24+i)*7}px,${-((t*1.6+i*9)%46)}px)`;dot.style.opacity=String((.10+.13*Math.sin(t*.67+i)**2)*amplitude);});if(!ready||!gl||gl.isContextLost())return;
gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uPower,amplitude);gl.uniform1f(uniforms.uCharacters,1);gl.uniform1f(uniforms.uPlants,1);gl.uniform1f(uniforms.uBlink,amplitude>0?blink(time):0);gl.drawArrays(gl.TRIANGLES,0,vertexCount);}
function tick(now){if(enabled&&!document.hidden){if(last)time+=Math.min((now-last)/1000,.05);render();}last=now;frame=requestAnimationFrame(tick);}
img.onload=()=>{try{init();render();}catch(e){onFailure();}frame=requestAnimationFrame(tick);};img.onerror=onFailure;img.src=asset;
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;onFailure();});
canvas.addEventListener('webglcontextrestored',()=>{try{init();canvas.style.visibility='visible';document.getElementById('actorsFallback').style.display='none';document.getElementById('motionNotice').classList.add('hidden');render();}catch(e){onFailure();}});
document.addEventListener('visibilitychange',()=>{last=0;});window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));
return {set(active,power){enabled=active;amplitude=power;last=0;render();}};
}
