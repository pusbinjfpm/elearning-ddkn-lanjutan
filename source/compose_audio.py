"""Original, deterministic instrumental cues for Integrity Decision Lab.

No third-party songs or samples. Requires numpy, scipy and ffmpeg to regenerate.
The ordinary HTML build only needs the rendered assets already supplied.
"""
from pathlib import Path
import json, subprocess, tempfile, argparse
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

ROOT=Path(__file__).resolve().parent.parent
DEST=ROOT/'assets/audio'; DEST.mkdir(parents=True,exist_ok=True)
SR=32000
RNG=np.random.default_rng(20261020)
TAU=2*np.pi

THEMES={
 'pagi':dict(title='Pagi yang Menunggu',bpm=78,mood='Hangat, ringan',kind='piano',chords=[[50,57,61,66,69],[47,54,57,62,66],[43,50,54,57,62],[45,52,57,59,64]],motif=[2,3,4,3,1,2,0,1],pulse=.20,pad=.28),
 'amplop':dict(title='Sebuah Titipan',bpm=68,mood='Penasaran, misteri ringan',kind='bell',chords=[[45,52,55,59,64],[41,48,52,57,60],[38,45,48,52,57],[40,47,52,56,59]],motif=[3,2,4,1,3,4,2,0],pulse=.12,pad=.35),
 'deteksi':dict(title='Di Antara Berkas',bpm=76,mood='Investigatif, fokus',kind='keys',chords=[[38,45,53,57,64],[46,53,57,60,65],[43,50,57,58,62],[45,52,55,59,64]],motif=[1,3,2,4,1,2,3,0],pulse=.26,pad=.28),
 'pertimbangkan':dict(title='Ruang Pertimbangan',bpm=72,mood='Ketegangan ringan, tertahan',kind='keys',chords=[[40,47,55,59,66],[36,43,52,55,59],[45,52,55,59,64],[47,54,57,63,66]],motif=[2,4,3,1,2,1,3,0],pulse=.36,pad=.40),
 'teladankan':dict(title='Standar yang Dijaga',bpm=64,mood='Serius, reflektif',kind='piano',chords=[[43,50,58,62,69],[39,46,55,58,62],[36,43,51,55,62],[38,45,54,57,62]],motif=[3,2,1,3,4,2,1,0],pulse=.08,pad=.40),
 'strategikan':dict(title='Merangkai Langkah',bpm=84,mood='Optimistis, terarah',kind='marimba',chords=[[51,58,62,67,70],[48,55,58,63,67],[44,51,55,58,63],[46,53,58,60,65]],motif=[1,2,3,4,2,3,1,0],pulse=.30,pad=.25),
 'penutup':dict(title='Bekal untuk Esok',bpm=66,mood='Tenang, hangat, selesai',kind='piano',chords=[[50,57,61,66,69],[43,50,54,57,62],[47,54,57,62,66],[45,52,57,61,64]],motif=[2,3,4,2,1,2,1,0],pulse=.06,pad=.38)
}

def note(midi,duration,kind='piano'):
 t=np.arange(int(duration*SR),dtype=np.float64)/SR
 f=440*2**((midi-69)/12)
 if kind=='pad':
  wave=np.zeros_like(t)
  for ratio,amp in [(1,.65),(2,.16),(3,.045)]:
   wave+=amp*(np.sin(TAU*f*ratio*t+.003*np.sin(TAU*.23*t))+.62*np.sin(TAU*f*ratio*1.0016*t+.7))/1.62
  attack=np.sin(np.minimum(t/.85,1)*np.pi/2)**2
  release=np.sin(np.minimum(np.maximum(duration-t,0)/1.25,1)*np.pi/2)**2
  return wave*attack*release*.70
 if kind=='bass':
  wave=np.sin(TAU*f*t)+.16*np.sin(TAU*2*f*t)+.045*np.sin(TAU*3*f*t)
  env=(1-np.exp(-t/.022))*np.exp(-t/1.5)*np.minimum((duration-t)/.20,1).clip(0,1)
  return wave*env*.6
 if kind=='bell':
  wave=sum(a*np.sin(TAU*f*r*t)*np.exp(-t/d) for r,a,d in [(1,.8,1.4),(2,.16,.8),(3.01,.035,.45),(4.98,.012,.26)])
 elif kind=='marimba':
  wave=sum(a*np.sin(TAU*f*r*t)*np.exp(-t/d) for r,a,d in [(1,1,1.1),(4,.065,.22),(10,.009,.10)])
 elif kind=='keys':
  wave=np.sin(TAU*f*t+.65*np.exp(-t/.14)*np.sin(TAU*2*f*t))*np.exp(-t/1.1)
  wave+=.13*np.sin(TAU*f*2*t)*np.exp(-t/.4)
 else:
  wave=np.zeros_like(t)
  for k,a in [(1,.72),(2,.19),(3,.075),(4,.032),(5,.014),(6,.006)]:
   decay=(1.65 if midi<65 else 1.25)/(1+.32*(k-1))
   wave+=a*(np.sin(TAU*f*k*t)+.28*np.sin(TAU*f*k*1.0013*t))*.78*np.exp(-t/decay)
  noise=sosfilt(butter(2,[900,3800],fs=SR,btype='bandpass',output='sos'),RNG.normal(0,1,len(t)))
  wave+=noise*np.exp(-t/.008)*.025
 return wave*(1-np.exp(-t/.006))*np.minimum((duration-t)/.14,1).clip(0,1)*.65

def add(buffer,signal,seconds,gain,pan=0):
 start=int(seconds*SR)%len(buffer)
 stereo=signal[:,None]*np.array([np.cos((pan+1)*np.pi/4),np.sin((pan+1)*np.pi/4)])[None,:]*gain
 end=start+len(signal)
 if end<=len(buffer):buffer[start:end]+=stereo
 else:
  n=len(buffer)-start;buffer[start:]+=stereo[:n];buffer[:len(signal)-n]+=stereo[n:]

def room_periodic(x):
 # Circular reverberation preserves tails at the loop boundary.
 out=x.copy()
 for channel in [0,1]:
  ir=np.zeros(len(x))
  for delay,amp in [(.043,.12),(.079,.09),(.127,.065),(.191,.05),(.307,.04),(.443,.03),(.683,.02),(.997,.013)]:
   ir[int((delay+channel*.007)*SR)]=amp
  out[:,channel]+=np.fft.irfft(np.fft.rfft(x[:,1-channel])*np.fft.rfft(ir),n=len(x))
 return out

def render_theme(key,spec):
 beat=60/spec['bpm'];duration=64*beat;frames=round(duration*SR)
 mix=np.zeros((frames,2),dtype=np.float64)
 for bar in range(16):
  chord=spec['chords'][(bar//2)%4];at=bar*4*beat
  if bar%2==0:
   for j,m in enumerate(chord[1:]):add(mix,note(m,8*beat+1.1,'pad'),at,spec['pad']*.19,(j-1.5)*.25)
  add(mix,note(chord[0]-12,3.6*beat,'bass'),at,.29,-.08)
  if spec['pulse']>.15:add(mix,note(chord[0]-12,1.5*beat,'bass'),at+2.5*beat,.13,.08)
  # Broken voicings, with small deterministic human timing and dynamics.
  pattern=[(0,1),(1.5,2),(2.5,3)] if spec['kind']=='piano' else [(0,1),(1,2),(2,3),(3.5,2)]
  for beatpos,chordidx in pattern:
   add(mix,note(chord[chordidx],min(3.8,4.3*beat),spec['kind']),at+(beatpos+.016*RNG.uniform(-1,1))*beat,.23*RNG.uniform(.85,1.05),(chordidx-2)*.24)
  # A restrained two-phrase melody; the second half varies its register.
  if bar%4 in [0,1,3]:
   step=spec['motif'][bar%8];pitch=chord[step]+(12 if step<2 else 0)
   add(mix,note(pitch,3.7,spec['kind']),at+(.5 if bar%2 else 1)*beat,.20,.12)
   if bar%4==1:add(mix,note(chord[2]+12,2.6,'bell'),at+3*beat,.075,-.2)
  if spec['pulse']:
   for b in [0,2]:
    tick=note(chord[1],.33,'marimba')
    add(mix,tick,at+(b+.5)*beat,spec['pulse']*.13,-.28 if b==0 else .28)
 mix=room_periodic(mix)
 # Periodic EQ: remove subsonic energy and gently soften the top end.
 frequencies=np.fft.rfftfreq(frames,1/SR)
 shape=(1-np.exp(-(frequencies/35)**4))/np.sqrt(1+(frequencies/6500)**6)
 for ch in [0,1]:mix[:,ch]=np.fft.irfft(np.fft.rfft(mix[:,ch])*shape,n=frames)
 mix-=mix.mean(axis=0)
 rms=float(np.sqrt(np.mean(mix*mix)));mix*=min(.085/max(rms,1e-8),.62/np.max(np.abs(mix)))
 with tempfile.TemporaryDirectory() as tmp:
  wav=Path(tmp)/'cue.wav';wavfile.write(wav,SR,(mix*32767).astype(np.int16))
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-c:a','libmp3lame','-b:a','112k','-ar',str(SR),'-metadata','title='+spec['title'],'-metadata','artist=Integrity Decision Lab','-metadata','comment=Original instrumental composition for this game',str(DEST/(key+'.mp3'))],check=True)
 return dict(title=spec['title'],mood=spec['mood'],bpm=spec['bpm'],duration=round(duration,3),sample_rate=SR,peak=round(float(np.max(np.abs(mix))),5),rms=round(float(np.sqrt(np.mean(mix*mix))),5),boundary_step=round(float(np.max(np.abs(mix[0]-mix[-1]))),6))

def render_keys():
 # Soft, low-pitched contacts: rounded attack, damped body, very quiet release.
 # Isolated seed makes key-only rebuilds reproducible without changing music.
 rng=np.random.default_rng(20261021)
 for i in range(6):
  duration=.070+i*.002;t=np.arange(int(duration*SR))/SR
  noise=rng.normal(size=len(t))
  dry=sosfilt(butter(3,[180+15*i,1900+65*i],fs=SR,btype='bandpass',output='sos'),noise)
  attack=(1-np.exp(-t/.0045))**2
  wave=dry*np.exp(-t/.010)*.16
  wave+=np.sin(TAU*(170+13*i)*t)*np.exp(-t/.013)*.32
  wave+=np.sin(TAU*(330+19*i)*t)*np.exp(-t/.009)*.065
  release=np.maximum(t-(.026+i*.001),0)
  wave+=np.where(release>0,dry*(1-np.exp(-release/.004))*np.exp(-release/.007)*.035,0)
  wave*=attack*np.minimum((duration-t)/.009,1).clip(0,1)
  wave=sosfilt(butter(2,2300,fs=SR,btype='lowpass',output='sos'),wave)
  wave-=wave.mean();wave*=np.sin(np.minimum(t/.004,1)*np.pi/2)**2
  wave*=np.minimum((duration-t)/.009,1).clip(0,1)
  wave*=min(.020/np.sqrt(np.mean(wave*wave)),.19/max(np.max(np.abs(wave)),1e-8))
  wavfile.write(DEST/f'key-{i+1}.wav',SR,(wave*32767).astype(np.int16))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--keys-only',action='store_true');args=parser.parse_args()
 if not args.keys_only:
  report={}
  for key,spec in THEMES.items():
   report[key]=render_theme(key,spec);print(key,report[key],flush=True)
  (DEST/'audio-info.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 render_keys()
 (DEST/'TENTANG-AUDIO.txt').write_text('Musik dan efek ketikan disusun khusus untuk Integrity Decision Lab pada 20 Oktober 2026.\nKomposisi instrumental dan sintesis bunyi dibuat dari sumber compose_audio.py; tidak memakai rekaman lagu atau sampel pihak ketiga.\nTujuh tema stereo berulang, enam variasi ketikan mono. Semua audio disertakan di dalam game offline.\n')
