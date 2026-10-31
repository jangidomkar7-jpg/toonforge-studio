import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const $ = id => document.getElementById(id);
const canvas = $('sceneCanvas');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b8e1ef');
const camera = new THREE.PerspectiveCamera(34, 16/9, .1, 100);
camera.position.set(0, 3.3, 11);
const hemi = new THREE.HemisphereLight(0xffffff, 0x78936d, 2.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.3); sun.position.set(-4, 8, 6); sun.castShadow = true; scene.add(sun);
const world = new THREE.Group(); scene.add(world);

let scenes = [], current = 0, playing = false, raf = 0, recorder = null, chunks = [], playToken = 0;
let hero1, hero2, props = [], sceneStart = performance.now(), currentAction = 'idle';
const gltfLoader = new GLTFLoader();
const modelCache = {};
let sceneLoadToken = 0;

const material = (c, rough=.82) => new THREE.MeshStandardMaterial({color:c, roughness:rough});
const M = {
  skin: material('#efb58d'), skin2: material('#d99a70'),
  hair: material('#30232b'), hair2: material('#211d29'),
  shirt1: material('#ef775d'), shirt2: material('#318ed1'),
  pants1: material('#315078'), pants2: material('#e6b94f'),
  shoe: material('#382d35'), white: material('#fffaf0'),
  black: material('#211f2b'), mouth: material('#6d2837'),
  ground: material('#77bd7d'), trunk: material('#865638'),
  leaf: material('#40985e'), gold: material('#ffd45a'),
  purple: material('#a78bfa')
};
const mat = (color) => material(color);
function addMesh(parent, geo, matl, x=0, y=0, z=0) {
  const o = new THREE.Mesh(geo, matl); o.position.set(x,y,z);
  o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
function group(parent, x=0,y=0,z=0) {
  const g = new THREE.Group(); g.position.set(x,y,z); parent.add(g); return g;
}
function makeCharacter(x, kind=1) {
  const isGolu = kind===1;
  const root = group(world,x,0,0);
  root.userData.kind = kind;
  const scale = isGolu ? 1.08 : 1;
  root.scale.setScalar(scale);
  const body = group(root,0,0,0);
  const shirt = isGolu ? M.shirt1 : M.shirt2;
  const skin = isGolu ? M.skin : M.skin2;
  const pants = isGolu ? M.pants1 : M.pants2;
  // torso and neck
  addMesh(body,new THREE.CapsuleGeometry(isGolu?.43:.31,.62,6,12),shirt,0,1.05,0);
  addMesh(body,new THREE.CylinderGeometry(.12,.13,.2,12),skin,0,1.48,0);
  // head
  const head = group(body,0,1.9,0);
  addMesh(head,new THREE.SphereGeometry(isGolu?.43:.37,24,18),skin,0,0,0);
  // hair cap and side tufts
  addMesh(head,new THREE.SphereGeometry(.405,20,14,0,Math.PI*2,0,Math.PI*.48),isGolu?M.hair:M.hair2,0,.13,-.025);
  if (!isGolu) addMesh(head,new THREE.SphereGeometry(.13,12,10),M.hair2,0,.35,-.02);
  // ears
  for (const s of [-1,1]) addMesh(head,new THREE.SphereGeometry(.09,12,10),skin,s*.38,-.03,0);
  // eyes with pupils
  for (const s of [-1,1]) {
    addMesh(head,new THREE.SphereGeometry(.075,14,12),M.white,s*.14,.035,.34);
    addMesh(head,new THREE.SphereGeometry(.035,12,10),M.black,s*.14,.025,.402);
    addMesh(head,new THREE.SphereGeometry(.014,8,8),M.white,s*.125,.045,.43);
  }
  const mouth = addMesh(head,new THREE.SphereGeometry(.075,14,10),M.mouth,0,-.16,.345);
  mouth.scale.set(.95,.35,.35);
  // arms pivot and forearms
  const arms=[];
  for (const s of [-1,1]) {
    const pivot=group(body,s*(isGolu?.43:.36),1.31,0);
    const upper=addMesh(pivot,new THREE.CapsuleGeometry(.105,.34,4,8),shirt,0,-.23,0);
    const elbow=group(pivot,0,-.43,0);
    addMesh(elbow,new THREE.CapsuleGeometry(.085,.27,4,8),skin,0,-.18,.015);
    addMesh(elbow,new THREE.SphereGeometry(.105,10,8),skin,0,-.34,.02);
    arms.push({pivot,elbow,side:s});
  }
  // legs
  const legs=[];
  for (const s of [-1,1]) {
    const pivot=group(body,s*.16,.62,0);
    addMesh(pivot,new THREE.CapsuleGeometry(.12,.34,4,8),pants,0,-.2,0);
    addMesh(pivot,new THREE.BoxGeometry(.25,.13,.4),M.shoe,0,-.48,.12);
    legs.push(pivot);
  }
  // personality accessories
  if (isGolu) {
    addMesh(head,new THREE.TorusGeometry(.16,.035,8,18),M.gold,0,-.04,.34).rotation.x=.2;
  } else {
    const cap=addMesh(head,new THREE.ConeGeometry(.24,.18,16),M.gold,0,.39,0); cap.rotation.z=Math.PI;
  }
  root.userData.rig={body,head,mouth,arms,legs};
  return root;
}
function clearWorld(){
  while(world.children.length) {
    const child=world.children[0]; world.remove(child);
    child.traverse(o=>{if(o.geometry)o.geometry.dispose();});
  }
  props=[];
}
function tree(x,z,s=1) {
  addMesh(world,new THREE.CylinderGeometry(.12*s,.18*s,1.25*s,8),M.trunk,x,.62*s,z);
  addMesh(world,new THREE.SphereGeometry(.72*s,16,12),M.leaf,x,1.55*s,z);
}
function environment(text) {
  const lower=text.toLowerCase();
  let bg='#b8e1ef', ground='#78bd7c';
  if (/रात|अंधेरा|चाँद|चांद|night/.test(lower)) bg='#263657';
  if (/शहर|बाजार|सड़क|school|स्कूल/.test(lower)) ground='#a5a8a9';
  if (/रेगिस्तान|desert/.test(lower)) ground='#d7b779';
  scene.background=new THREE.Color(bg);
  addMesh(world,new THREE.PlaneGeometry(100,100),material(ground),0,-.08,-15).rotation.x=-Math.PI/2;
  if (/जंगल|पेड़|पेड़|वन|forest|गाँव|गांव|village/.test(lower)) {
    tree(-4,-2,1.1); tree(4.2,-2,.95); tree(5.8,-7,1.3);
    for(let i=0;i<4;i++) {
      const hill=addMesh(world,new THREE.SphereGeometry(2.5,18,12),material(i%2?'#8dc99b':'#9bce9b'),-6+i*4,1.0,-13);
      hill.scale.set(1,.45,1);
    }
  } else if (/घर|कमरा|school|स्कूल|बाजार|दुकान/.test(lower)) {
    const building=addMesh(world,new THREE.BoxGeometry(3.2,2.4,.5),material('#f2c58e'),0,1.15,-4);
    addMesh(world,new THREE.ConeGeometry(2.1,.9,4),material('#b95f55'),0,2.8,-4).rotation.y=Math.PI/4;
    addMesh(world,new THREE.BoxGeometry(.65,1.1,.08),material('#77513d'),-.7,.58,-3.7);
  } else {
    tree(-4,-3,.85); tree(4,-4,.8);
  }
  // clouds
  if (!/रात|अंधेरा|night/.test(lower)) for(let i=0;i<3;i++){
    const c=group(world,-4+i*4,4.2+(i%2)*.35,-8);
    for(let j=0;j<3;j++)addMesh(c,new THREE.SphereGeometry(.34,12,10),M.white,(j-1)*.3,j===1?.1:0,0);
  }
}
function addStoryProp(text) {
  const lower=text.toLowerCase();
  if (/खजाना|संदूक|सोना|treasure/.test(lower)) {
    const p=group(world,0,.15,1);
    addMesh(p,new THREE.BoxGeometry(.9,.55,.65),material('#9a5a2c'),0,.35,0);
    addMesh(p,new THREE.BoxGeometry(.94,.12,.69),M.gold,0,.69,0);
    addMesh(p,new THREE.BoxGeometry(.13,.22,.08),M.gold,0,.51,.36); props.push(p);
  } else if (/पत्थर|जादू|चमक|रत्न|magic|stone/.test(lower)) {
    const p=group(world,0,.55,1);
    const gem=addMesh(p,new THREE.OctahedronGeometry(.48),M.purple,0,.45,0);
    addMesh(p,new THREE.TorusGeometry(.75,.025,8,36),M.gold,0,.45,0).rotation.x=Math.PI/2;
    props.push(p);
  } else if (/गेंद|क्रिकेट|ball/.test(lower)) {
    const p=group(world,0,.35,1);addMesh(p,new THREE.SphereGeometry(.25,18,14),material('#e94b4b'),0,.25,0);props.push(p);
  }
}
function detectAction(text) {
  if (/दौड़|भाग|पीछा|भागा|भागे|run|chase/.test(text)) return 'run';
  if (/कूद|छलांग|jump/.test(text)) return 'jump';
  if (/नाच|डांस|dance/.test(text)) return 'dance';
  if (/हँस|हंस|मजाक|जोक|laugh/.test(text)) return 'laugh';
  if (/डर|घबरा|चौंक|हैरान|surprise|scared/.test(text)) return 'surprise';
  if (/खाना|खाया|भूख|खा रहे|eat/.test(text)) return 'eat';
  if (/बात|बोला|बोली|कहा|चिल्ला|समझाया|talk|said/.test(text)) return 'talk';
  if (/नमस्ते|हाथ हिल|अलविदा|wave/.test(text)) return 'wave';
  if (/चल|पहुँच|पहुंच|गए|गया|गयी|आया|आए|walk/.test(text)) return 'walk';
  return 'idle';
}
async function loadHeroModel(file, x, kind) {
  if (!modelCache[file]) {
    modelCache[file] = gltfLoader.loadAsync(`models/${file}`).then(gltf => gltf.scene).catch(err => {
      console.error(`Could not load models/${file}`, err);
      throw err;
    });
  }
  const source = await modelCache[file];
  const model = source.clone(true);
  const root = group(world, x, 0, 0);
  root.add(model);
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3(); box.getSize(size);
  const height = Math.max(size.y, 0.01);
  const targetHeight = kind === 1 ? 2.35 : 2.2;
  model.scale.setScalar(targetHeight / height);
  const scaledBox = new THREE.Box3().setFromObject(model);
  model.position.y -= scaledBox.min.y;
  // Models face +Z, matching the camera direction.
  root.userData.kind = kind;
  root.userData.isGLB = true;
  root.userData.baseY = 0;
  return root;
}
async function showScene(i) {
  if(!scenes.length)return;
  current=Math.max(0,Math.min(i,scenes.length-1));
  const token = ++sceneLoadToken;
  clearWorld();
  const text=scenes[current].text;
  environment(text); addStoryProp(text);
  hero1 = hero2 = null;
  currentAction=scenes[current].action; sceneStart=performance.now();
  camera.position.set(/जंगल|forest/.test(text)?-.45:0,3.25,10.8);
  camera.lookAt(0,1.35,0);
  $('caption').textContent=text;
  $('sceneLabel').textContent=`Scene ${current+1} / ${scenes.length}`;
  $('sceneCount').textContent=scenes.length;
  $('sceneList').querySelectorAll('.scene-item').forEach((el,n)=>el.classList.toggle('active',n===current));
  $('timeline').querySelectorAll('.timeline-card').forEach((el,n)=>el.classList.toggle('active',n===current));
  $('prev').disabled=current===0; $('next').disabled=current===scenes.length-1;
  $('stageLoading').style.display='none';
  $('status').textContent='गोलू और चिंटू के 3D मॉडल लोड हो रहे हैं…';
  try {
    const [golu, chintu] = await Promise.all([
      loadHeroModel('golu.glb', -1.45, 1),
      loadHeroModel('chintu.glb', 1.45, 2)
    ]);
    if (token !== sceneLoadToken) return;
    hero1 = golu; hero2 = chintu;
    $('status').textContent='असली 3D गोलू और चिंटू लोड हो गए!';
  } catch (error) {
    if (token !== sceneLoadToken) return;
    $('status').textContent='3D मॉडल नहीं लोड हुए। models/golu.glb और models/chintu.glb के नाम और जगह जाँचें।';
    console.error(error);
  }
}

function resize(){
  const rect=canvas.getBoundingClientRect(); if(!rect.width||!rect.height)return;
  renderer.setSize(rect.width,rect.height,false);
  camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);
if(window.ResizeObserver)new ResizeObserver(resize).observe($('stage'));
resize();

function poseCharacter(ch, action, t, offset=0) {
  if(!ch)return;
  const q=t*3.2+offset;
  // The supplied GLB files are static meshes (not rigged yet), so animate
  // the complete 3D character with readable body movement until rigged clips are added.
  ch.position.y = 0;
  ch.rotation.set(0, 0, 0);
  if(action==='walk' || action==='run') {
    ch.position.y = Math.abs(Math.sin(q*(action==='run'?8:4))) * (action==='run'?.13:.055);
    ch.position.x += Math.sin(q*.18+offset)*.0015;
    ch.rotation.z = Math.sin(q*2)*.035;
  } else if(action==='jump') {
    ch.position.y = Math.abs(Math.sin(q*1.8))*.65;
    ch.rotation.z = Math.sin(q*1.8)*.06;
  } else if(action==='dance' || action==='laugh') {
    ch.position.y = Math.abs(Math.sin(q*(action==='dance'?2:4)))*(action==='dance'?.2:.07);
    ch.rotation.z = Math.sin(q*(action==='dance'?2:4))*(action==='dance'?.18:.07);
  } else if(action==='surprise') {
    ch.rotation.z = Math.sin(q*2)*.025;
    ch.position.y = .035;
  } else if(action==='talk' || action==='wave') {
    ch.rotation.y = Math.sin(q*1.5)*.12;
    ch.rotation.z = Math.sin(q*2)*.025;
  } else {
    ch.position.y = Math.sin(q)*.025;
    ch.rotation.y = Math.sin(q*.6)*.035;
  }
}

function animate(now=0){
  raf=requestAnimationFrame(animate);
  const t=(now-sceneStart)*.001;
  poseCharacter(hero1,currentAction,t,0);
  poseCharacter(hero2, currentAction==='talk'?'idle':currentAction,t,1.4);
  props.forEach(p=>{p.rotation.y=now*.0006;p.position.y=.15+Math.sin(now*.002)*.1;});
  renderer.render(scene,camera);
}
animate();

function splitStory(value){
  return value.replace(/\n+/g,' ').split(/(?<=[।.!?])\s+/).map(s=>s.trim()).filter(Boolean);
}
function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function generate(){
  const lines=splitStory($('story').value);
  if(!lines.length){$('status').textContent='पहले अपनी कहानी लिखें।';return;}
  scenes=lines.map((text,i)=>({text,title:`दृश्य ${i+1}`,action:detectAction(text)}));
  current=0; playing=false; playToken++;
  $('sceneList').innerHTML='';$('timeline').innerHTML='';
  scenes.forEach((s,i)=>{
    const item=document.createElement('button');item.className='scene-item';
    item.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span>${escapeHTML(s.text.slice(0,62))}`;
    item.onclick=()=>showScene(i);$('sceneList').append(item);
    const card=document.createElement('button');card.className='timeline-card';
    card.innerHTML=`<b>दृश्य ${String(i+1).padStart(2,'0')} · ${s.action.toUpperCase()}</b><span>${escapeHTML(s.text)}</span>`;
    card.onclick=()=>showScene(i);$('timeline').append(card);
  });
  $('duration').textContent=`अनुमानित अवधि: लगभग ${Math.max(5,scenes.length*4)} सेकंड`;
  $('download').disabled=false;$('projectTitle').textContent='मेरी कार्टून कहानी';
  showScene(0);$('status').textContent=`${scenes.length} दृश्य तैयार। “फिर से चलाएँ” दबाएँ।`;
}
function speak(text){
  if(!$('narration').checked||!('speechSynthesis'in window))return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);u.lang=$('voice').value;u.rate=.92;
  const voices=speechSynthesis.getVoices();
  const v=voices.find(v=>v.lang.toLowerCase().startsWith(u.lang.toLowerCase()));
  if(v)u.voice=v;speechSynthesis.speak(u);
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function playAll(){
  if(!scenes.length){$('status').textContent='पहले ऑटो एनिमेशन बनाएँ।';return;}
  playing=true;const token=++playToken;$('status').textContent='कहानी चल रही है…';
  for(let i=0;i<scenes.length&&playing&&token===playToken;i++){
    showScene(i);speak(scenes[i].text);await wait(Math.max(3500,scenes[i].text.length*65));
  }
  if(token===playToken){playing=false;if('speechSynthesis'in window)speechSynthesis.cancel();$('status').textContent='कहानी पूरी हुई।';}
}
$('generate').onclick=generate;
$('playAll').onclick=playAll;
$('prev').onclick=()=>showScene(current-1);
$('next').onclick=()=>showScene(current+1);
$('helpBtn').onclick=()=>$('helpDialog').showModal();
$('closeHelp').onclick=()=>$('helpDialog').close();
$('ratio').onchange=()=>{
  const [w,h]=$('ratio').value.split(':').map(Number);
  $('stage').style.aspectRatio=`${w}/${h}`;resize();
};
$('download').onclick=()=>{
  if(!scenes.length)return;
  if(!canvas.captureStream||!window.MediaRecorder){$('status').textContent='इस ब्राउज़र में वीडियो रिकॉर्डिंग उपलब्ध नहीं है।';return;}
  const stream=canvas.captureStream(30);
  let mime='video/webm;codecs=vp9';if(!MediaRecorder.isTypeSupported(mime))mime='video/webm';
  chunks=[];recorder=new MediaRecorder(stream,{mimeType:mime});
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onstop=()=>{
    const blob=new Blob(chunks,{type:'video/webm'}),url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='toonforge-cartoon.webm';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
    stream.getTracks().forEach(t=>t.stop());
    $('status').textContent='वीडियो WebM फॉर्मेट में डाउनलोड हुई। आवाज़ रिकॉर्डिंग में शामिल न भी हो सकती है।';
    $('download').disabled=false;
  };
  recorder.start();$('download').disabled=true;$('status').textContent='वीडियो रिकॉर्ड हो रही है…';
  playing=false;playToken++;let idx=0;
  const next=()=>{
    if(idx>=scenes.length){recorder.stop();return;}
    showScene(idx++);setTimeout(next,3800);
  };next();
};
if('speechSynthesis'in window)speechSynthesis.getVoices();
