import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = id => document.getElementById(id);
const canvas = $('sceneCanvas');
const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b9e2ed');
const camera = new THREE.PerspectiveCamera(34,16/9,.1,100);
camera.position.set(0,3.4,10.8);
const hemi = new THREE.HemisphereLight(0xffffff,0x73936c,2.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff,2.2); sun.position.set(-4,8,5); sun.castShadow=true; scene.add(sun);
const world = new THREE.Group(); scene.add(world);
let scenes=[], current=0, playing=false, raf=0, recordChunks=[], recorder=null, startRecord=0, speechTimer=null;
let characterA, characterB, props=[];
const mat = (color,roughness=.85)=>new THREE.MeshStandardMaterial({color,roughness});
const colors={skin:mat('#f4bd91'),hair:mat('#3b2631'),shirt:mat('#ef6680'),pants:mat('#344d8a'),skin2:mat('#d99b70'),shirt2:mat('#4e9be8'),ground:mat('#74b87d'),trunk:mat('#855a3c'),leaf:mat('#4b9d69'),stone:mat('#b8a6ed'),gold:mat('#ffd45e'),white:mat('#fff8e9')};
function mesh(geo,material,x,y,z,parent=world){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function makeCharacter(x, second=false){
 const g=new THREE.Group();world.add(g);g.position.x=x;
 const skin=second?colors.skin2:colors.skin, shirt=second?colors.shirt2:colors.shirt;
 mesh(new THREE.CylinderGeometry(.28,.34,.8,16),shirt,0,1.15,0,g);
 mesh(new THREE.SphereGeometry(.36,24,18),skin,0,1.85,0,g);
 mesh(new THREE.SphereGeometry(.37,20,14,0,Math.PI*2,0,Math.PI*.55),colors.hair,0,2.02,-.02,g);
 mesh(new THREE.SphereGeometry(.045,12,10),mat('#24202b'),-.12,1.88,.32,g);
 mesh(new THREE.SphereGeometry(.045,12,10),mat('#24202b'),.12,1.88,.32,g);
 mesh(new THREE.SphereGeometry(.045,12,10),mat('#fff'),-.135,1.9,.355,g);
 mesh(new THREE.SphereGeometry(.045,12,10),mat('#fff'),.105,1.9,.355,g);
 const smile=mesh(new THREE.TorusGeometry(.095,.018,8,16,Math.PI),mat('#8b3947'),0,1.72,.33,g);smile.rotation.z=Math.PI;
 for(const s of [-1,1]){
  const arm=mesh(new THREE.CapsuleGeometry(.09,.48,4,8),shirt,s*.37,1.22,0,g);arm.rotation.z=s*.22;
  const leg=mesh(new THREE.CapsuleGeometry(.11,.43,4,8),colors.pants,s*.14,.42,0,g);
  mesh(new THREE.SphereGeometry(.15,12,10),colors.pants,s*.14,.15,.08,g);
 }
 return g;
}
function clearWorld(){while(world.children.length){const o=world.children.pop();o.traverse?.(v=>{v.geometry?.dispose();});}props=[];}
function addTree(x,z,scale=1){mesh(new THREE.CylinderGeometry(.12*scale,.18*scale,1.2*scale,8),colors.trunk,x,.6*scale,z);mesh(new THREE.SphereGeometry(.75*scale,16,12),colors.leaf,x,1.55*scale,z)}
function buildEnvironment(index){
 // Ground plane and distant hills
 mesh(new THREE.PlaneGeometry(200,200),colors.ground,0,-.06,-20).rotation.x=-Math.PI/2;
 for(let i=0;i<5;i++){const hill=mesh(new THREE.SphereGeometry(2.7,20,12),mat(i%2?'#8fc8a0':'#9bcf9b'),-6+i*3,1.1,-12);hill.scale.set(1,.48,1)}
 addTree(-4,-1,1.1);addTree(4.3,-2,.9);addTree(5.8,-8,1.4);
 // soft cloud puffs
 for(let i=0;i<3;i++){const c=new THREE.Group();world.add(c);c.position.set(-4+i*4,4.4-i%2*.6,-8);for(let j=0;j<3;j++)mesh(new THREE.SphereGeometry(.38,12,10),colors.white,(j-1)*.35, j===1?.12:0,0,c)}
}
function makeMagicStone(){const g=new THREE.Group();world.add(g);g.position.set(0,.55,1);const s=mesh(new THREE.OctahedronGeometry(.55),colors.stone,0,.5,0,g);s.rotation.y=.4;mesh(new THREE.TorusGeometry(.85,.035,8,40),colors.gold,0,.5,0,g).rotation.x=Math.PI/2;return g}
function showScene(i){
 if(!scenes.length)return;
 current=Math.max(0,Math.min(i,scenes.length-1));clearWorld();buildEnvironment(current);
 characterA=makeCharacter(-1.35,false);characterB=makeCharacter(1.35,true);
 const text=scenes[current].text.toLowerCase();
 const hasMagic=/पत्थर|जादू|चमक|magic|stone|glow/.test(text);
 if(hasMagic){const stone=makeMagicStone();props.push(stone)}
 camera.position.set(text.includes('जंगल')||text.includes('forest')?-0.5:0,3.2,10.8);camera.lookAt(0,1.4,0);
 $('caption').textContent=scenes[current].text;
 $('sceneLabel').textContent=`Scene ${current+1} / ${scenes.length}`;
 $('sceneCount').textContent=scenes.length;
 $('sceneList').querySelectorAll('.scene-item').forEach((el,n)=>el.classList.toggle('active',n===current));
 $('timeline').querySelectorAll('.timeline-card').forEach((el,n)=>el.classList.toggle('active',n===current));
 $('prev').disabled=current===0;$('next').disabled=current===scenes.length-1;
 $('stageLoading').style.display='none';
}
function resize(){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);new ResizeObserver(resize).observe($('stage'));resize();
function animate(t=0){
 raf=requestAnimationFrame(animate);
 const time=t*.001;
 if(characterA){characterA.position.y=Math.sin(time*3)*.045;characterA.rotation.y=Math.sin(time*1.4)*.12}
 if(characterB){characterB.position.y=Math.sin(time*3+1)*.045;characterB.rotation.y=-Math.sin(time*1.3)*.12}
 props.forEach(p=>{p.rotation.y=time*.8;p.position.y=.55+Math.sin(time*2)*.12});
 renderer.render(scene,camera);
}
animate();
function splitStory(value){
 return value.replace(/\n+/g,' ').split(/(?<=[।.!?])\s+/).map(s=>s.trim()).filter(Boolean);
}
function generate(){
 const lines=splitStory($('story').value);
 if(!lines.length){$('status').textContent='Please write a short story first.';return}
 scenes=lines.map((text,i)=>({text,title:`Scene ${i+1}`}));current=0;
 $('sceneList').innerHTML='';$('timeline').innerHTML='';
 scenes.forEach((s,i)=>{
  const item=document.createElement('button');item.className='scene-item';item.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span>${escapeHTML(s.text.slice(0,62))}`;item.onclick=()=>showScene(i);$('sceneList').append(item);
  const card=document.createElement('button');card.className='timeline-card';card.innerHTML=`<b>SCENE ${String(i+1).padStart(2,'0')}</b><span>${escapeHTML(s.text)}</span>`;card.onclick=()=>showScene(i);$('timeline').append(card);
 });
 $('duration').textContent=`Estimated duration: ${Math.max(5,scenes.length*4)} seconds`;
 $('download').disabled=false;$('projectTitle').textContent='My cartoon story';showScene(0);
 $('status').textContent=`Created ${scenes.length} scenes. Press Play all or export your video.`;
}
function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function speak(text){
 if(!$('narration').checked||!('speechSynthesis'in window))return;
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=$('voice').value;u.rate=.92;
 const voices=speechSynthesis.getVoices();const v=voices.find(v=>v.lang.toLowerCase().startsWith(u.lang.toLowerCase()));if(v)u.voice=v;speechSynthesis.speak(u);
}
async function playAll(){
 if(!scenes.length){$('status').textContent='Generate scenes first.';return}
 playing=true;$('status').textContent='Playing storyboard…';
 for(let i=0;i<scenes.length&&playing;i++){showScene(i);speak(scenes[i].text);await new Promise(r=>speechTimer=setTimeout(r,Math.max(3000,scenes[i].text.length*65)));}
 playing=false;speechSynthesis?.cancel?.();$('status').textContent='Playback finished.';
}
$('generate').onclick=generate;$('playAll').onclick=playAll;
$('prev').onclick=()=>showScene(current-1);$('next').onclick=()=>showScene(current+1);
$('helpBtn').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=()=>$('helpDialog').close();
$('ratio').onchange=()=>{const r=$('ratio').value;const [w,h]=r.split(':').map(Number);$('stage').style.aspectRatio=`${w}/${h}`;resize()};
$('download').onclick=()=>{
 if(!scenes.length)return;
 if(!canvas.captureStream||!window.MediaRecorder){$('status').textContent='Video recording is not supported in this browser. Try a recent desktop Chrome or Edge.';return}
 const stream=canvas.captureStream(30);let mime='video/webm;codecs=vp9';if(!MediaRecorder.isTypeSupported(mime))mime='video/webm';
 recordChunks=[];recorder=new MediaRecorder(stream,{mimeType:mime});recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data)};
 recorder.onstop=()=>{const blob=new Blob(recordChunks,{type:'video/webm'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='toonforge-cartoon.webm';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);$('status').textContent='Video exported as WebM. Audio narration may not be included; add voice-over in a video editor if needed.';$('download').disabled=false};
 recorder.start();$('download').disabled=true;$('status').textContent='Recording animation…';
 let idx=0;showScene(0);const step=()=>{if(idx>=scenes.length){recorder.stop();return}showScene(idx);idx++;setTimeout(step,3500)};step();
};
speechSynthesis?.getVoices?.();
