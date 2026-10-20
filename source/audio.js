// Local music and short key samples; decoded on demand, no remote requests.
const MUSIC_LABELS={pagi:'Pagi yang Menunggu',amplop:'Sebuah Titipan',deteksi:'Di Antara Berkas',pertimbangkan:'Ruang Pertimbangan',teladankan:'Standar yang Dijaga',strategikan:'Merangkai Langkah',penutup:'Bekal untuk Esok'};
function musicForScene(scene){
 if(scene==='cover')return null;
 if(/^i\d+$/.test(scene)){const n=Number(scene.slice(1));return n<4?'pagi':n<9?'amplop':'deteksi';}
 if(['hypothesis','files','analysis','feedback','complete'].includes(scene))return 'deteksi';
 if(scene==='mapend'||scene.startsWith('m2'))return 'pertimbangkan';
 if(scene==='map2'||scene.startsWith('m3'))return 'teladankan';
 if(scene==='map3'||['m4brief','interventions','combination','canvas','canvasReview','m4done'].includes(scene))return 'strategikan';
 return 'penutup';
}
const gameAudio=(()=>{
 let context=null,musicBus=null,keyBus=null,desired=null,active=null,ducked=false,loadToken=0,nextTapAt=0,lastKey=0,unlocked=false,issue='',pending=null;
 let prefs={musicEnabled:true,musicVolume:40,typeEnabled:true,typeVolume:35};
 const cache=new Map(),loading=new Map(),voices=new Set(),taps=new Set(),offsets=new Map();
 const supported=!!(window.AudioContext||window.webkitAudioContext);
 function status(){const el=document.getElementById('audioStatus');if(!el)return;el.textContent=!supported?'Audio tidak tersedia di browser ini. Permainan tetap dapat dilanjutkan.':issue||(!unlocked?'Musik mulai saat perjalanan dimulai.':document.hidden?'Audio dijeda saat tab tidak aktif.':!prefs.musicEnabled||prefs.musicVolume===0?'Musik dimatikan.':desired?'Musik: '+MUSIC_LABELS[desired]:'Musik mengikuti bagian cerita.');}
 function ramp(param,value,seconds=.06){const now=context.currentTime;if(typeof param.cancelAndHoldAtTime==='function')param.cancelAndHoldAtTime(now);else{param.cancelScheduledValues(now);param.setValueAtTime(param.value,now);}param.linearRampToValueAtTime(value,now+seconds);}
 function applyLevels(){if(!context)return;ramp(musicBus.gain,(prefs.musicEnabled?prefs.musicVolume/100:0)*(ducked?.55:1),.13);ramp(keyBus.gain,prefs.typeEnabled?prefs.typeVolume/100:0,.025);}
 function init(){if(context)return true;if(!supported){status();return false;}try{const C=window.AudioContext||window.webkitAudioContext;context=new C();musicBus=context.createGain();keyBus=context.createGain();musicBus.gain.value=0;keyBus.gain.value=0;musicBus.connect(context.destination);keyBus.connect(context.destination);context.onstatechange=()=>{if(context.state==='running'){issue='';ensureMusic();}status();};applyLevels();return true;}catch(e){issue='Audio belum dapat diaktifkan. Coba lagi melalui Pengaturan.';status();return false;}}
 function trimCache(){const musicKeys=[...cache.keys()].filter(k=>Object.hasOwn(MUSIC_LABELS,k));let count=musicKeys.length;for(const key of musicKeys){if(count<=3)break;if(key===desired||[...voices].some(v=>v.key===key))continue;cache.delete(key);count--;}}
 function load(key){if(cache.has(key))return Promise.resolve(cache.get(key));if(loading.has(key))return loading.get(key);const encoded=AUDIO_ASSETS[key];if(!encoded)return Promise.reject(Error('Missing audio '+key));const job=(async()=>{const raw=atob(encoded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const buffer=await context.decodeAudioData(bytes.buffer);cache.set(key,buffer);trimCache();return buffer;})();loading.set(key,job);job.then(()=>loading.delete(key),()=>loading.delete(key));return job;}
 function retire(voice,seconds=.8){if(!voice||voice.retiring)return;voice.retiring=true;const elapsed=context.currentTime-voice.started;offsets.set(voice.key,(voice.offset+Math.max(0,elapsed))%voice.source.buffer.duration);ramp(voice.gain.gain,0,seconds);try{voice.source.stop(context.currentTime+seconds+.025);}catch(e){}if(active===voice)active=null;}
 async function ensureMusic(){if(!context||context.state!=='running'||document.hidden||!unlocked||!desired||!prefs.musicEnabled||prefs.musicVolume===0)return;if(active?.key===desired&&!active.retiring)return;if(pending?.key===desired)return;const key=desired,token=++loadToken;pending={key,token};try{const buffer=await load(key);if(token!==loadToken||desired!==key||context.state!=='running'||document.hidden||!prefs.musicEnabled||prefs.musicVolume===0)return;const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=buffer.duration;gain.gain.value=0;source.connect(gain);gain.connect(musicBus);const now=context.currentTime,offset=offsets.get(key)||0;const old=active;active={key,source,gain,started:now,offset,retiring:false};const voice=active;voices.add(voice);source.onended=()=>{voices.delete(voice);source.disconnect();gain.disconnect();trimCache();};source.start(now,offset%buffer.duration);gain.gain.linearRampToValueAtTime(1,now+1.05);retire(old,1.05);if(voices.size>3){for(const v of [...voices]){if(v!==active&&v!==old){try{v.source.stop(now+.03);}catch(e){}}}}issue='';status();}catch(e){if(token===loadToken){issue='Musik belum dapat diputar. Coba matikan lalu aktifkan Musik latar.';status();}}finally{if(pending?.token===token)pending=null;}}
 async function unlock(){if(!init())return false;unlocked=true;try{if(context.state!=='running')await context.resume();if(context.state!=='running')throw Error('suspended');issue='';applyLevels();ensureMusic();for(let i=1;i<=6;i++)load('key-'+i).catch(()=>{});status();return true;}catch(e){issue='Ketuk halaman atau aktifkan kembali suara untuk memulai audio.';status();return false;}}
 function stopTyping(){if(!context)return;for(const t of [...taps]){try{ramp(t.gain.gain,0,.008);t.source.stop(context.currentTime+.01);}catch(e){}taps.delete(t);}nextTapAt=0;}
 function key(character){
  if(!context||!unlocked||context.state!=='running'||document.hidden||ducked||!prefs.typeEnabled||prefs.typeVolume===0||!character)return;
  const now=context.currentTime;
  // Let punctuation breathe; sound timing is independent of text reveal speed.
  if(/[,.!?;:…]/.test(character)){nextTapAt=Math.max(nextTapAt,now+(/[.!?…]/.test(character)?.24:.14)+Math.random()*.08);return;}
  if(/\s/.test(character)||now<nextTapAt)return;
  let sample=1+Math.floor(Math.random()*6);if(sample===lastKey)sample=sample%6+1;
  const buffer=cache.get('key-'+sample);if(!buffer)return;
  lastKey=sample;nextTapAt=now+.115+Math.random()*.065;
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;
  source.playbackRate.value=.97+Math.random()*.06;gain.gain.value=.80+Math.random()*.14;
  source.connect(gain);gain.connect(keyBus);const tap={source,gain};taps.add(tap);
  source.onended=()=>{taps.delete(tap);source.disconnect();gain.disconnect();};source.start(now);
 }
 function scene(next){const target=musicForScene(next);if(target!==desired){desired=target;loadToken++;pending=null;if(!desired)retire(active,.25);}ensureMusic();status();}
 function applySettings(settings){prefs={musicEnabled:settings.musicEnabled,musicVolume:settings.musicVolume,typeEnabled:settings.typeEnabled,typeVolume:settings.typeVolume};for(const k of ['musicEnabled','typeEnabled']){const el=document.getElementById(k);if(el)el.checked=prefs[k];}for(const k of ['musicVolume','typeVolume']){const el=document.getElementById(k),out=document.getElementById(k+'Value');if(el)el.value=String(prefs[k]);if(out)out.textContent=prefs[k]+'%';}if(!prefs.typeEnabled||prefs.typeVolume===0)stopTyping();applyLevels();if(!prefs.musicEnabled||prefs.musicVolume===0){loadToken++;pending=null;retire(active,.15);}else ensureMusic();status();}
 function setDucked(value){ducked=value;if(value)stopTyping();applyLevels();}
 function suspend(){stopTyping();if(context&&context.state==='running')context.suspend().catch(()=>{});status();}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else if(unlocked)unlock();});
 window.addEventListener('pagehide',suspend);
 window.addEventListener('pageshow',e=>{if(e.persisted&&unlocked&&!document.hidden)unlock();});
 document.addEventListener('pointerdown',()=>{if(unlocked&&context?.state!=='running'&&!document.hidden)unlock();},{capture:true});
 document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.code==='Space')&&unlocked&&context?.state!=='running'&&!document.hidden)unlock();},{capture:true});
 return {unlock,scene,key,stopTyping,setDucked,applySettings,refreshStatus:status};
})();
