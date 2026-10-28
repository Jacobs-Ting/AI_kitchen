import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export const modelLoader=new GLTFLoader(); // 未來由本機 assets/models/ 載入GLB。
export function createKitchen(host,onSelect,reduced=()=>false){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,100);camera.position.set(9,8,11);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0,0);host.appendChild(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.1,0);controls.enableDamping=true;controls.minDistance=7;controls.maxDistance=18;controls.minPolarAngle=.45;controls.maxPolarAngle=1.2;controls.minAzimuthAngle=.15;controls.maxAzimuthAngle=1.35;controls.enablePan=false;
 scene.add(new T.HemisphereLight(0xfffbdf,0x89927c,2.7));const sun=new T.DirectionalLight(0xffe8c0,4);sun.position.set(2,9,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7});sun.shadow.bias=-.001;scene.add(sun);
 const mats={};const mat=(c)=>mats[c]||(mats[c]=new T.MeshStandardMaterial({color:c,roughness:.76}));
 function box(parent,x,y,z,w,h,d,c,r=.06){const o=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),mat(c));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
 function ball(parent,x,y,z,r,c,s=[1,1,1]){const o=new T.Mesh(new T.SphereGeometry(r,16,12),mat(c));o.position.set(x,y,z);o.scale.set(...s);o.castShadow=true;parent.add(o);return o}
 function cyl(parent,x,y,z,r,h,c,r2=r){const o=new T.Mesh(new T.CylinderGeometry(r2,r,h,20),mat(c));o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o}
 function torus(parent,x,y,z,r,t,c,rx=0){const o=new T.Mesh(new T.TorusGeometry(r,t,8,24),mat(c));o.position.set(x,y,z);o.rotation.x=rx;parent.add(o);return o}
 const room=new T.Group();scene.add(room);box(room,0,-.13,0,7.4,.3,6.1,'#d9b187',.14);box(room,0,.03,0,7.1,.08,5.8,'#e8cba1');
 for(let i=-3;i<=3;i++)box(room,i,.08,0,.015,.012,5.7,'#cfac83',0);
 box(room,0,1.8,-2.85,7.2,3.5,.15,'#f1e8cf');box(room,-3.5,1.8,0,.15,3.5,5.8,'#e9e9d4');
 for(let x=-3;x<3.5;x+=.5)for(let y=.5;y<2;y+=.4)box(room,x,y,-2.75,.47,.37,.035,'#faf4df',.01);
 // 木框窗戶與窗外天空。
 box(room,.3,2.65,-2.73,2,1.25,.1,'#c3966d');box(room,.3,2.65,-2.65,1.8,1.08,.06,'#bad5cc');box(room,.3,2.65,-2.58,.07,1.1,.07,'#fff8e8');box(room,.3,2.65,-2.57,1.8,.07,.07,'#fff8e8');box(room,.3,2,-2.52,2.2,.12,.35,'#dfb68a');
 const targets=[];function station(id){const g=new T.Group();g.userData.station=id;room.add(g);targets.push(g);return g}
 function plant(parent,x,y,z,size=.3){cyl(parent,x,y,z,size*.65,size,'#c99b74',size*.85);for(let n=0;n<5;n++){const a=n*1.4;ball(parent,x+Math.cos(a)*size*.5,y+size*.9,z+Math.sin(a)*size*.5,size*.7,n%2?'#8da36c':'#a4ba83',[.5,1,.55])}}
 function createFridge(){const g=station('ingredients');g.position.set(-2.6,0,-1.9);box(g,0,1.35,0,1.25,2.6,1.2,'#a5cdb5',.13);box(g,0,1.45,.625,1.06,2.15,.06,'#eef2dc');for(const y of [.55,1.05,1.65,2.1])box(g,0,y,.22,1,.05,.9,'#dce4cd');for(let i=0;i<3;i++)ball(g,-.28+i*.27,1.15,.5,.11,'#fff1d4',[.8,1.2,.8]);ball(g,.2,.65,.4,.17,'#df8064');box(g,-.28,1.9,.3,.23,.45,.25,'#f9f3df');plant(g,.2,.48,.3,.15);const door=new T.Group();door.position.set(-.62,0,.67);g.add(door);box(door,.62,1.03,0,1.23,1.87,.16,'#a8d5ba',.1);box(door,.62,2.17,0,1.23,.73,.16,'#afd8c1',.1);box(door,1.02,1.45,.12,.07,.48,.08,'#fff0cb');box(door,1.02,2.15,.12,.07,.24,.08,'#fff0cb');box(door,.45,2.25,.1,.25,.17,.025,'#f5d2b6');return door}
 const door=createFridge();
 function cabinet(g,x,w=1.6){box(g,x,.65,-2.05,w,1.2,1.15,'#e5bf92');box(g,x,1.29,-2.02,w+.06,.15,1.25,'#eed4ac');for(const dx of [-w/4,w/4]){box(g,x+dx,.67,-1.45,w/2-.07,1.03,.06,'#f3e6c9');box(g,x+dx,1.02,-1.39,.25,.045,.06,'#b2966a')}}
 const sink=station('methods');cabinet(sink,-1.05,1.7);box(sink,-1.05,1.39,-2.05,1.1,.06,.75,'#faf8eb');box(sink,-1.05,1.42,-2.04,.85,.025,.54,'#b7c9bf');torus(sink,-1.05,1.66,-2.48,.21,.035,'#a3aaa0');cyl(sink,-1.25,1.55,-2.48,.035,.35,'#a3aaa0');box(sink,-.45,1.44,-1.75,.24,.12,.17,'#d9d68c');cyl(sink,-.4,1.58,-2.35,.09,.32,'#b5cc9d');plant(sink,-1.65,1.48,-2.45,.16);
 const stove=station('summary');cabinet(stove,.75,1.8);box(stove,.75,1.4,-2.02,1.5,.08,.95,'#5d665c');const flames=[];for(const x of [.32,1.13]){torus(stove,x,1.47,-2,.25,.025,'#303a34',Math.PI/2);for(let n=0;n<6;n++){const a=n*Math.PI/3;flames.push(ball(stove,x+Math.cos(a)*.18,1.51,-2+Math.sin(a)*.18,.055,'#efb15b',[.5,1.6,.5]))}}cyl(stove,.32,1.68,-2,.3,.38,'#b0c7b2');cyl(stove,.32,1.89,-2,.32,.05,'#e1e5d1');ball(stove,.32,1.95,-2,.055,'#7e9478');box(stove,-.07,1.73,-2,.2,.07,.12,'#9b835c');box(stove,.71,1.73,-2,.2,.07,.12,'#9b835c');cyl(stove,1.13,1.56,-2,.29,.12,'#676a59');box(stove,1.53,1.59,-2,.5,.06,.11,'#ae8e66');for(const x of [.35,.75,1.15])ball(stove,x,1.17,-1.38,.065,'#778275');box(stove,.75,.65,-1.43,1.3,.6,.04,'#677568');box(stove,.75,.97,-1.37,1,.05,.07,'#c6bc9d');
 const board=station('settings');cabinet(board,2.45,1.5);box(board,2.4,1.44,-2,1.1,.07,.7,'#c99561',.1);ball(board,2.25,1.59,-2,.15,'#e28b6e');ball(board,2.55,1.56,-1.85,.13,'#e8d6ad');const carrot=cyl(board,2.7,1.54,-2.12,.07,.43,'#de9a57',.025);carrot.rotation.z=Math.PI/2;box(board,2.05,1.5,-2.23,.36,.025,.13,'#c4c8b9');box(board,1.8,1.5,-2.23,.2,.05,.09,'#8a7456');
 // 吊櫃、掛牆廚具與調味罐。
 for(const x of [-1.7,2.25]){box(room,x,2.7,-2.55,1,.9,.4,'#ead4ae');box(room,x,2.7,-2.3,.91,.8,.06,'#f6ebd2');ball(room,x+.3,2.65,-2.24,.04,'#bd9f6d')}
 box(room,1.3,2.45,-2.6,.7,.05,.07,'#ae946e');for(let i=0;i<3;i++){cyl(room,1.05+i*.22,2.18,-2.55,.025,.4,'#8b927f');ball(room,1.05+i*.22,1.97,-2.55,.085,'#a5aa96',[.7,1,.3])}
 for(let i=0;i<3;i++){cyl(room,3-i*.2,1.55,-2.4,.065,.26,['#ded6b3','#b2b997','#f0d5b2'][i]);cyl(room,3-i*.2,1.7,-2.4,.07,.04,'#aa8c67')}
 const table=new T.Group();table.position.set(.1,0,.85);room.add(table);box(table,0,1,0,2.3,.18,1.4,'#d8b080',.14);for(const x of [-.85,.85])for(const z of [-.45,.45])box(table,x,.48,z,.12,.95,.12,'#ba946a');
 function chair(x,z,angle){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;room.add(g);box(g,0,.57,0,.7,.13,.7,'#d9bb8e');box(g,0,1.02,.29,.7,.8,.1,'#e6cc9f',.1);for(const a of [-.25,.25])for(const b of [-.25,.25])box(g,a,.29,b,.08,.6,.08,'#bf9c6d')}
 chair(-1.6,.8,-Math.PI/2);chair(1.75,1,Math.PI/2);plant(table,.65,1.21,-.2,.16);cyl(table,-.5,1.12,.1,.29,.04,'#fbf5df');torus(table,-.5,1.15,.1,.22,.015,'#b7c5a3',Math.PI/2);
 // 小熊廚師與廚師帽。
 const bear=new T.Group();bear.position.set(-2.5,.25,1.7);room.add(bear);ball(bear,0,.42,0,.28,'#c59f73',[.85,1.2,.8]);ball(bear,0,.88,0,.28,'#d6b58a');
 const arms=[],feet=[];for(const x of [-.21,.21]){ball(bear,x,1.08,0,.11,'#bb9468');const arm=new T.Group();arm.position.set(x,.57,0);bear.add(arm);ball(arm,0,-.15,.05,.11,'#c59f73',[1,1.35,1]);arms.push(arm);feet.push(ball(bear,x*.65,.1,.1,.12,'#bb9468'));ball(bear,x*.48,.91,.25,.025,'#4f4738')}
 ball(bear,0,.8,.25,.12,'#ead2ad',[1,.7,.4]);ball(bear,0,.85,.3,.035,'#675740');box(bear,0,.4,.23,.33,.35,.04,'#f8efd9');cyl(bear,0,1.17,0,.22,.15,'#fff8e7');for(const x of [-.13,0,.13])ball(bear,x,1.3,0,.14,'#fff8e7');
 // 手上的食材籃、托盤與餐桌成品均為真正3D物件。
 const basket=new T.Group();bear.add(basket);basket.position.set(0,.49,.4);box(basket,0,0,0,.5,.23,.32,'#d8b078');torus(basket,0,.16,0,.19,.025,'#bc9365');ball(basket,-.12,.16,0,.1,'#e28b6e');ball(basket,.11,.15,0,.1,'#b0c58b');basket.visible=false;
 function meal(parent){cyl(parent,0,0,0,.26,.045,'#fff4dd');torus(parent,0,.025,0,.22,.015,'#b8c596',Math.PI/2);ball(parent,0,.08,0,.16,'#e6b078',[1,.5,1]);for(let i=0;i<3;i++)ball(parent,-.1+i*.1,.13,.02,.045,'#92b07c')}
 const tray=new T.Group();bear.add(tray);tray.position.set(0,.57,.43);box(tray,0,-.04,0,.68,.05,.48,'#c6a170');meal(tray);tray.visible=false;
 const spoon=new T.Group();arms[0].add(spoon);box(spoon,0,-.45,.06,.035,.65,.035,'#ac8459');ball(spoon,0,-.79,.06,.08,'#bd9867',[1,1.4,.4]);spoon.visible=false;
 const restingKnife=board.children.slice(-2),choppingKnife=new T.Group();board.add(choppingKnife);choppingKnife.position.set(2.35,1.59,-1.88);box(choppingKnife,0,0,0,.32,.19,.025,'#c4c8b9');box(choppingKnife,-.24,.055,0,.18,.07,.06,'#8a7456');choppingKnife.visible=false;
 const choppedVegetables=new T.Group();board.add(choppedVegetables);for(let i=0;i<6;i++){const piece=box(choppedVegetables,2.23+(i%3)*.11,1.52,-1.83+Math.floor(i/3)*.14,.08,.07,.09,i%2?'#de9a57':'#e28b6e',.025);piece.visible=false}
 const served=new T.Group();served.position.set(-.5,1.17,.95);room.add(served);meal(served);served.visible=false;
 plant(room,3,.28,2,.32);box(room,-2, .12,1.2,1.4,.025,1.6,'#b8c5a0',.13);
 cyl(room,.3,3.65,.2,.018,.85,'#a18d69');cyl(room,.3,3.2,.2,.48,.35,'#eee1b4',.15);const bulb=new T.PointLight(0xffdba1,8,6);bulb.position.set(.3,3,.2);scene.add(bulb);
 const steam=[];for(let i=0;i<9;i++){const s=ball(room,.32,2+i*.1,-2,.065,'#fffbed');s.material=s.material.clone();s.material.transparent=true;s.visible=false;steam.push(s)}
 const resultGroup=new T.Group();room.add(resultGroup);resultGroup.visible=false;for(let i=0;i<3;i++){const c=box(resultGroup,-.65+i*.65,1.32,1.08,.52,.55,.06,'#fff5d9');c.rotation.x=-.25;ball(resultGroup,-.65+i*.65,1.38,1.13,.095,['#dc9c71','#a8bd8b','#e2b75e'][i])}
 const ray=new T.Raycaster(),pointer=new T.Vector2();let hovered=null,down=null,doorGoal=0,heating=false,move=null,disposed=false,action=null,chefBusy=false;const tooltip=host.querySelector('#tooltip');
 const hints={ingredients:'打開冰箱，看看有什麼食材！',methods:'選擇今天的烹飪方式！',settings:'準備今天的料理！',summary:'確認設定，開始創意料理！'};
 function hit(e){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(targets,true);if(!hits.length)return null;let g=hits[0].object;while(g&&!g.userData.station)g=g.parent;return g}
 const original=new Map();function highlight(g){for(const [mesh,m]of original)mesh.material=m;original.clear();if(g)g.traverse(o=>{if(o.isMesh){original.set(o,o.material);o.material=o.material.clone();o.material.emissive.set('#b6ca79');o.material.emissiveIntensity=.18}})}
 renderer.domElement.addEventListener('pointermove',e=>{const g=hit(e);if(g!==hovered){highlight(g);hovered=g}renderer.domElement.style.cursor=g?'pointer':'grab';tooltip.style.display=g?'block':'none';if(g){const r=host.getBoundingClientRect();tooltip.textContent=hints[g.userData.station];tooltip.style.left=Math.min(e.clientX-r.left+12,r.width-220)+'px';tooltip.style.top=e.clientY-r.top-35+'px'}});
 renderer.domElement.addEventListener('pointerleave',()=>{highlight(null);hovered=null;tooltip.style.display='none'});renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});renderer.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<7){const g=hit(e);if(g)onSelect(g.userData.station)}down=null});
 const positions={ingredients:[-1.2,1.3,-1.3],methods:[-.7,1.1,-1.5],settings:[1.5,1.1,-1.4],summary:[.65,1.1,-1.4],results:[0,.8,.7],home:[0,1.1,0]};
 function focus(id){if(!chefBusy)doorGoal=id==='ingredients'?-1.65:0;const target=new T.Vector3(...(positions[id]||positions.home));const pos=target.clone().add(id==='home'?new T.Vector3(9,6.9,11):new T.Vector3(7,6,8));move={target,pos};if(reduced()){camera.position.copy(pos);controls.target.copy(target);move=null}}
 // 動作由render迴圈推進，背景分頁不會漏掉關鍵動作。
 function perform(kind,duration,to=null,face=null){return new Promise(resolve=>{const from=bear.position.clone();action={kind,duration,elapsed:0,from,to:to?new T.Vector3(to[0],.25,to[1]):null,resolve};if(face!==null)bear.rotation.y=face;if(action.to){const dx=action.to.x-from.x,dz=action.to.z-from.z;if(Math.hypot(dx,dz)>.01)bear.rotation.y=Math.atan2(dx,dz)}})}
 async function cookSequence(onStage=()=>{}){
  if(chefBusy||disposed)return;chefBusy=true;resultGroup.visible=false;served.visible=false;basket.visible=false;tray.visible=false;choppedVegetables.children.forEach(p=>p.visible=false);
  try{
   if(reduced()){bear.position.set(-.55,.25,.05);bear.rotation.y=0;served.visible=true;doorGoal=0;onStage('完成！小熊把料理端上桌了。');return}
   focus('home');onStage('小熊先去冰箱，拿今天的食材……');
   // 先沿櫃台前方走道移動，避開桌椅與冰箱門的掃掠區。
   await perform('walk',.75,[-2.35,-.55]);await perform('walk',.55,[-1.65,-.65]);
   doorGoal=-1.65;await perform('reach',.8,null,-Math.PI/2);basket.visible=true;
   onStage('食材拿好了，先去砧板準備切菜！');await perform('walk',1.65,[2.35,-.65]);doorGoal=0;
   await perform('walk',.25,[2.35,-1.02]);basket.visible=false;bear.rotation.y=Math.PI;
   restingKnife.forEach(o=>o.visible=false);choppingKnife.visible=true;
   onStage('咚、咚、咚！小熊正在砧板上切菜……');await perform('chop',2.2);choppingKnife.visible=false;restingKnife.forEach(o=>o.visible=true);
   onStage('蔬菜切好了，移到爐台開始烹飪！');await perform('walk',.25,[2.35,-.65]);await perform('walk',1.1,[.35,-.65]);
   await perform('walk',.25,[.35,-1.02]);basket.visible=false;bear.rotation.y=Math.PI;heating=true;spoon.visible=true;
   onStage('小熊正在爐台前拌炒、烹煮……');await perform('cook',2.1);heating=false;spoon.visible=false;
   tray.visible=true;onStage('香噴噴的料理完成，準備上桌！');
   await perform('walk',.7,[-.55,-.65]);await perform('walk',.65,[-.55,-.05]);
   await perform('serve',.7,null,0);tray.visible=false;served.visible=true;
   onStage('開飯囉！看看小熊為你挑選的食譜。');await perform('celebrate',.45);
  }finally{chefBusy=false;heating=false;spoon.visible=false;choppingKnife.visible=false;restingKnife.forEach(o=>o.visible=true);doorGoal=0;action=null;bear.position.y=.25;arms.forEach(a=>a.rotation.set(0,0,0));feet.forEach(f=>f.position.y=.1)}
 }
 function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}const observer=new ResizeObserver(resize);observer.observe(host);resize();const clock=new T.Clock();
 function animateChef(dt){
  if(!action)return;action.elapsed+=reduced()?action.duration:dt;const p=Math.min(1,action.elapsed/action.duration),wave=Math.sin(action.elapsed*13);
  bear.position.y=.25;feet.forEach(f=>f.position.y=.1);arms.forEach(a=>a.rotation.set(0,0,0));
  if(action.to)bear.position.lerpVectors(action.from,action.to,p);
  if(!reduced()){
   if(action.kind==='walk'){bear.position.y+=Math.abs(wave)*.035;feet.forEach((f,i)=>{f.position.y=.1+Math.max(0,wave*(i?1:-1))*.09});arms.forEach((a,i)=>a.rotation.x=basket.visible||tray.visible?-1.1:wave*(i?.4:-.4))}
   if(action.kind==='reach'){arms.forEach(a=>a.rotation.x=-1.6*Math.sin(p*Math.PI));bear.rotation.z=Math.sin(p*Math.PI)*.12}
   if(action.kind==='cook'){arms[0].rotation.x=-2.1;arms[0].rotation.z=Math.sin(action.elapsed*7)*.25;arms[1].rotation.x=-1.3;bear.position.y+=Math.sin(action.elapsed*5)*.025}
   if(action.kind==='chop'){const lift=(1-Math.cos(p*Math.PI*12))/2;arms[0].rotation.x=-2.1-lift*.45;arms[1].rotation.x=-1.9;choppingKnife.position.y=1.62+lift*.18;choppingKnife.rotation.z=lift*.12;choppedVegetables.children.forEach((piece,i)=>piece.visible=p>=(i+1)/7)}
   if(action.kind==='serve'){arms.forEach(a=>a.rotation.x=-1.2);tray.position.z=.43+Math.sin(p*Math.PI)*.18}
   if(action.kind==='celebrate')arms.forEach((a,i)=>{a.rotation.z=(i?1:-1)*Math.sin(p*Math.PI)*1.8});
  }
  if(p===1){const done=action.resolve;action=null;bear.rotation.z=0;bear.position.y=.25;tray.position.z=.43;done()}
 }
 function frame(){if(disposed)return;requestAnimationFrame(frame);const elapsed=clock.getDelta(),dt=Math.min(elapsed,.05),t=clock.elapsedTime;animateChef(Math.min(elapsed,1));door.rotation.y=T.MathUtils.damp(door.rotation.y,doorGoal,reduced()?100:5,dt);if(move){camera.position.lerp(move.pos,1-Math.exp(-4*dt));controls.target.lerp(move.target,1-Math.exp(-4*dt));if(camera.position.distanceTo(move.pos)<.02)move=null}flames.forEach((f,i)=>{f.visible=heating;f.scale.y=reduced()?1.5:1.5+Math.sin(t*5+i)*.3});steam.forEach((s,i)=>{s.visible=heating;s.position.y=2+(reduced()?i/9:(t*.45+i/9)%1.1);s.position.x=.32+Math.sin(i+t)*.08;s.material.opacity=.45*(1-(s.position.y-2)/1.2)});controls.update();renderer.render(scene,camera)}frame();host.querySelector('#scene-status').remove();return {focus,cookSequence,setHeating(v){heating=v},showResults(){resultGroup.visible=true;focus('results')},dispose(){disposed=true;if(action){action.resolve();action=null}observer.disconnect();controls.dispose();renderer.dispose()}};
}

