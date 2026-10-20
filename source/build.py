from pathlib import Path
import base64, json, zipfile, xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent.parent
src=root/'source'
s=(src/'template.html').read_text()
parts=[('STYLES',['base.css','game.css','redesign.css','full.css','audio.css']),('CONTENT',['content.js','full-content.js']),('ANIMATION',['animation.js']),('STATE',['state.js']),('SCORM',['scorm.js']),('AUDIO',['audio.js']),('ENGINE',['game.js']),('VISUAL',['visual.js']),('FULL',['full.js'])]
for marker,files in parts:
 s=s.replace('/*__'+marker+'__*/','\n'.join((src/f).read_text() for f in files))
audio={p.stem:base64.b64encode(p.read_bytes()).decode() for p in sorted((root/'assets/audio').iterdir()) if p.suffix in ('.mp3','.wav')}
assert len(audio)==13, 'Seven music themes and six key samples are required.'
s=s.replace('/*__AUDIO_DATA__*/','const AUDIO_ASSETS = '+json.dumps(audio,separators=(',',':'))+';')
assert '/*__' not in s
data=lambda p,mime:'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
s=s.replace('assets/tokoh.png',data(root/'assets/tokoh.png','image/png'))
(root/'index.html').write_text(s)
standalone=s
for p in (root/'assets').glob('*.png'):
 standalone=standalone.replace('assets/'+p.name,data(p,'image/png'))
for p in (root/'assets/fonts').glob('*.woff'):
 standalone=standalone.replace('assets/fonts/'+p.name,data(p,'font/woff'))
(root.parent/'IDL-Audio-v1.1.1.html').write_text(standalone)
ns='http://www.imsproject.org/xsd/imscp_rootv1p1p2';adl='http://www.adlnet.org/xsd/adlcp_rootv1p2'
ET.register_namespace('',ns);ET.register_namespace('adlcp',adl)
tag=lambda n:'{'+ns+'}'+n
manifest=ET.Element(tag('manifest'),{'identifier':'IDL-INTEGRITAS-V1','version':'1.0'})
metadata=ET.SubElement(manifest,tag('metadata'));ET.SubElement(metadata,tag('schema')).text='ADL SCORM';ET.SubElement(metadata,tag('schemaversion')).text='1.2'
orgs=ET.SubElement(manifest,tag('organizations'),{'default':'ORG-IDL'});org=ET.SubElement(orgs,tag('organization'),{'identifier':'ORG-IDL'});ET.SubElement(org,tag('title')).text='Integrity Decision Lab'
item=ET.SubElement(org,tag('item'),{'identifier':'ITEM-IDL','identifierref':'RES-IDL','isvisible':'true'});ET.SubElement(item,tag('title')).text='Empat Misi Integritas'
resources=ET.SubElement(manifest,tag('resources'));res=ET.SubElement(resources,tag('resource'),{'identifier':'RES-IDL','type':'webcontent','href':'index.html','{'+adl+'}scormtype':'sco'})
runtime=[root/'index.html',*sorted(p for p in (root/'assets').rglob('*') if p.is_file())]
for p in runtime:ET.SubElement(res,tag('file'),{'href':p.relative_to(root).as_posix()})
ET.indent(manifest);ET.ElementTree(manifest).write(root/'imsmanifest.xml',encoding='utf-8',xml_declaration=True)
with zipfile.ZipFile(root.parent/'IDL-Audio-v1.1.1.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(root.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(root.parent))
with zipfile.ZipFile(root.parent/'IDL-SCORM-12-v1.1.1.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in [root/'imsmanifest.xml',*runtime]:z.write(p,p.relative_to(root))
print('Built standalone HTML, editable offline ZIP, and SCORM 1.2 ZIP.')
