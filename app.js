import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const $=id=>document.getElementById(id), canvas=$('sceneCanvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;
const scene=new THREE.Scene();scene.background=new THREE.Color('#b9e2ed');
const camera=new THREE.PerspectiveCamera(34,16/9,.1,100);camera.position.set(0,3.4,10.8);
scene.add(new THREE.HemisphereLight(0xffffff,0x73936c,2.1));const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-4,8,5);sun.castShadow=true;scene.add(sun);
const world=new THREE.Group();scene.add(world);let scenes=[],current=0,playing=false,recordChunks=[],recorder=null,characterA,characterB,props=[],action='talk',sceneStart=0;
const mat=(c,r=.85)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
const C={skin:mat('#f4bd91'),hair:mat('#3b2631'),shirt:mat('#ef6680'),pants:mat('#344d8a'),skin2:mat('#d99b70'),shirt2:mat('#4e9be8'),ground:mat('#74b87d'),trunk:mat('#855a3c'),leaf:mat('#4b9d69'),stone:mat('#b8a6ed'),gold:mat('#ffd45e'),white:mat('#fff8e9'),dark:mat('#24202b')};
function mesh(g,m,x,y,z,p=world){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function makeCharacter(x,second=false){
 const root=new THREE.Group();world.add(root);root.position.x=x;const skin=second?C.skin2:C.skin,shirt=second?C.shirt2:C.shirt;
 mesh(new THREE.CylinderGeometry(.28,.34,.8,16),shirt,0,1.15,0,root);
 const head=new THREE.Group();head.position.set(0,1.82,0);root.add(head);
 mesh(new THREE.SphereGeometry(.36,24,18),skin,0,0,0,head);mesh(new THREE.SphereGeometry(.37,20,14,0,Math.PI*2,0,Math.PI*.55),C.hair,0,.17,-.02,head);
 for(const xEye of [-.12,.12]){mesh(new THREE.SphereGeometry(.047,12,10),C.dark,xEye,.03,.32,head);mesh(new THREE.SphereGeometry(.018,8,8),C.white,xEye-.012,.045,.36,head);}
 const smile=mesh(new THREE.TorusGeometry(.09,.016,8,16,Math.PI),mat('#8b3947'),0,-.13,.32,head);smile.rotation.z=Math.PI;
 const arms=[],legs=[];
 for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.34,1.43,0);root.add(arm);mesh(new THREE.CapsuleGeometry(.085,.42,4,8),shirt,0,-.23,0,arm);mesh(new THREE.SphereGeometry(.105,10,8),skin,0,-.48,.02,arm);arms.push(arm);
 const leg=new THREE.Group();leg.position.set(side*.14,.62,0);root.add(leg);mesh(new THREE.CapsuleGeometry(.105,.43,4,8),C.pants,0,-.22,0,leg);mesh(new THREE.SphereGeometry(.14,12,10),C.pants,0,-.47,.08,leg);legs.push(leg);}
 return {root,head,arms,legs};
}
function clearWorld(){for(const o of [...world.children]){world.remove(o);o.traverse(v=>{v.geometry?.dispose();});}props=[];}
function tree(x,z,s=1){mesh(new THREE.CylinderGeometry(.12*s,.18*s,1.2*s,8),C.trunk,x,.6*s,z);mesh(new THREE.SphereGeometry(.75*s,16,12),C.leaf,x,1.55*s,z);}
function environment(i,text){const forest=/जंगल|पेड़|वन|forest|tree/i.test(text),night=/रात|अँधेरा|अंधेरा|चाँद|night/i.test(text);scene.background=new THREE.Color(night?'#182449':forest?'#a8d5e6':'#b9e2ed');
 mesh(new THREE.PlaneGeometry(200,200),C.ground,0,-.06,-20).rotation.x=-Math.PI/2;
 for(let j=0;j<5;j++){const h=mesh(new THREE.SphereGeometry(2.7,20,12),mat(j%2?'#8fc8a0':'#9bcf9b'),-6+j*3,1.1,-12);h.scale.set(1,.48,1)}
 tree(-4,-1,1.1);tree(4.3,-2,.9);tree(5.8,-8,1.4);if(forest){tree(-2.8,1,1.3);tree(2.8,-4,1.2)}
 for(let j=0;j<3;j++){const cl=new THREE.Group();world.add(cl);cl.position.set(-4+j*4,4.4-(j%2)*.6,-8);for(let k=0;k<3;k++)mesh(new THREE.SphereGeometry(.38,12,10),C.white,(k-1)*.35,k===1?.12:0,0,cl)}
}
function magicStone(){const g=new THREE.Group();world.add(g);g.position.set(0,.55,1);const a=mesh(new THREE.OctahedronGeometry(.55),C.stone,0,.5,0,g);a.rotation.y=.4;mesh(new THREE.TorusGeometry(.85,.035,8,40),C.gold,0,.5,0,g).rotation.x=Math.PI/2;return g;}
function detectAction(t){if(/दौड़|भाग|पीछा|भागा|दौड़े|run|chase/i.test(t))return'run';if(/चल|आगे बढ़|जंगल में गया|घर गया|walk|went/i.test(t))return'walk';if(/नाच|खुशी से|जश्न|dance/i.test(t))return'dance';if(/हाथ मिल|नमस्ते|अभिवादन|hello/i.test(t))return'greet';if(/डर|चौंक|हैरान|भूत|अचानक|surprise|scared/i.test(t))return'surprise';if(/लड़|मार|धक्का|fight/i.test(t))return'argue';return'talk';}
function showScene(i){if(!scenes.length)return;current=Math.max(0,Math.min(i,scenes.length-1));const t=scenes[current].text;clearWorld();environment(current,t);characterA=makeCharacter(-1.35,false);characterB=makeCharacter(1.35,true);action=scenes[current].action;sceneStart=performance.now()/1000;
 if(/पत्थर|जादू|चमक|खजाना|magic|stone|treasure/i.test(t))props.push(magicStone());camera.position.set(/जंगल|forest/i.test(t)?-.5:0,3.2,10.8);camera.lookAt(0,1.4,0);
 $('caption').textContent=t;$('sceneLabel').textContent=`Scene ${current+1} / ${scenes.length}`;$('sceneCount').textContent=scenes.length;
 $('sceneList').querySelectorAll('.scene-item').forEach((e,n)=>e.classList.toggle('active',n===current));$('timeline').querySelectorAll('.timeline-card').forEach((e,n)=>e.classList.toggle('active',n===current));$('prev').disabled=current===0;$('next').disabled=current===scenes.length-1;$('stageLoading').style.display='none';}
function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);new ResizeObserver(resize).observe($('stage'));resize();
function animate(ms=0){requestAnimationFrame(animate);const t=ms*.001,elapsed=t-sceneStart;[characterA,characterB].forEach((c,n)=>{if(!c)return;const phase=t*5+n*Math.PI;const swing=action==='run'?1.05:action==='walk'?.48:action==='dance'?.8:0;
 c.legs[0].rotation.x=Math.sin(phase)*swing;c.legs[1].rotation.x=-Math.sin(phase)*swing;
 c.arms[0].rotation.z=action==='greet'?-1.35:action==='surprise'?-1.15:action==='talk'?Math.sin(t*3+n)*.22:Math.sin(phase+Math.PI)*swing*.65;
 c.arms[1].rotation.z=action==='greet'?1.35:action==='surprise'?1.15:action==='talk'?Math.sin(t*3+n+1)*.22:-Math.sin(phase+Math.PI)*swing*.65;
 c.root.position.y=(action==='run'?.12:action==='dance'?.13:.025)*Math.abs(Math.sin(phase));c.root.position.x=(n?1.35:-1.35)+(action==='walk'?Math.sin(elapsed*1.5+n)*.45:action==='run'?Math.sin(elapsed*2+n)*.8:0);
 c.root.rotation.y=action==='argue'?(n?-.3:.3):Math.sin(t*1.1+n)*.08;c.head.rotation.z=action==='surprise'?Math.sin(t*4)*.08:Math.sin(t*2+n)*.035;});
 props.forEach(p=>{p.rotation.y=t*.8;p.position.y=.55+Math.sin(t*2)*.12});renderer.render(scene,camera);}
animate();
function splitStory(v){return v.replace(/\n+/g,' ').split(/(?<=[।.!?])\s+/).map(x=>x.trim()).filter(Boolean);}
function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function speak(t){if(!$('narration').checked||!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang=$('voice').value;u.rate=.92;const v=speechSynthesis.getVoices().find(x=>x.lang.toLowerCase().startsWith(u.lang.toLowerCase()));if(v)u.voice=v;speechSynthesis.speak(u);}
function generate(){const lines=splitStory($('story').value);if(!lines.length){$('status').textContent='पहले अपनी कहानी लिखें।';return;}playing=false;speechSynthesis?.cancel?.();scenes=lines.map((text,i)=>({text,title:`Scene ${i+1}`,action:detectAction(text)}));$('sceneList').innerHTML='';$('timeline').innerHTML='';scenes.forEach((s,i)=>{const b=document.createElement('button');b.className='scene-item';b.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span>${escapeHTML(s.text.slice(0,62))}`;b.onclick=()=>showScene(i);$('sceneList').append(b);const c=document.createElement('button');c.className='timeline-card';c.innerHTML=`<b>SCENE ${String(i+1).padStart(2,'0')} · ${s.action.toUpperCase()}</b><span>${escapeHTML(s.text)}</span>`;c.onclick=()=>showScene(i);$('timeline').append(c);});
 $('duration').textContent=`अनुमानित समय: लगभग ${Math.max(5,scenes.length*4)} सेकंड`;$('download').disabled=false;$('projectTitle').textContent='मेरी कार्टून कहानी';showScene(0);$('status').textContent=`${scenes.length} दृश्य तैयार। अब कहानी अपने आप चल रही है…`;playAll();}
async function playAll(){if(!scenes.length)return;playing=true;for(let i=0;i<scenes.length&&playing;i++){showScene(i);speak(scenes[i].text);await new Promise(r=>setTimeout(r,Math.max(3200,Math.min(7000,scenes[i].text.length*75))));}playing=false;speechSynthesis?.cancel?.();$('status').textContent='एनिमेशन पूरा हुआ। वीडियो डाउनलोड करने के लिए बटन दबाएँ।';}
$('generate').onclick=generate;$('playAll').onclick=()=>{if(playing){playing=false;speechSynthesis?.cancel?.();$('status').textContent='प्लेबैक रोक दिया गया।'}else playAll()};$('prev').onclick=()=>showScene(current-1);$('next').onclick=()=>showScene(current+1);$('helpBtn').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=()=>$('helpDialog').close();
$('ratio').onchange=()=>{const [w,h]=$('ratio').value.split(':').map(Number);$('stage').style.aspectRatio=`${w}/${h}`;resize()};
$('download').onclick=()=>{if(!scenes.length)return;if(!canvas.captureStream||!window.MediaRecorder){$('status').textContent='इस ब्राउज़र में वीडियो रिकॉर्डिंग उपलब्ध नहीं है।';return;}const stream=canvas.captureStream(30);let mime='video/webm;codecs=vp9';if(!MediaRecorder.isTypeSupported(mime))mime='video/webm';recordChunks=[];recorder=new MediaRecorder(stream,{mimeType:mime});recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data)};recorder.onstop=()=>{const blob=new Blob(recordChunks,{type:'video/webm'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='toonforge-cartoon.webm';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);$('status').textContent='वीडियो WebM फॉर्मेट में डाउनलोड हुई। ब्राउज़र के अनुसार आवाज़ रिकॉर्डिंग में शामिल न भी हो सकती है।';$('download').disabled=false;};recorder.start();$('download').disabled=true;$('status').textContent='वीडियो रिकॉर्ड हो रही है…';let i=0;const step=()=>{if(i>=scenes.length){recorder.stop();return;}showScene(i++);setTimeout(step,3500)};step();};speechSynthesis?.getVoices?.();
