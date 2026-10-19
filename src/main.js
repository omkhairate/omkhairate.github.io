import './style.css';
import './record-models.js';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createIcons, ArrowUpRight, ArrowDown, Plus, X, Pause, Play } from 'lucide';

const icons = { ArrowUpRight, ArrowDown, Plus, X, Pause, Play };
createIcons({ icons });
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let paused = reduceMotion;
const chapters = [...document.querySelectorAll('.chapter')];
const navLinks = [...document.querySelectorAll('.chapter-nav a')];
let currentChapter = 0;
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    currentChapter = Number(entry.target.dataset.chapter);
    navLinks.forEach((link, i) => { link.classList.toggle('active', i === currentChapter); if (i === currentChapter) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }
}, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });
chapters.forEach(chapter => observer.observe(chapter));

const details = {
  cleo: { label: '01 / CLEO', title: 'The system around the model.', body: 'A shared Python core connects a native macOS interface, CLI and API. Context assembly, retrieval, model routing and tool execution have separate responsibilities.', points: ['Graph-style memory and opt-in SQLite FTS5/BM25 file search.', 'Bounded excerpts and source paths keep retrieval grounded.', 'Regression tests cover negated requests, questions mistaken for commands and repeated side effects.'], link: 'https://github.com/omkhairate/Cleo' },
  argus: { label: '02 / ARGUS', title: 'A memory you can query.', body: 'Argus separates capturing an event from processing, storing and retrieving it. Python and FastAPI expose a visual-memory service backed by SQLite metadata and image files.', points: ['Semantic and time-filtered retrieval of captured events.', 'Buffered uploads and retries handle interrupted processing.', 'Bounded queries keep the retrieval layer predictable.'], link: 'https://github.com/omkhairate/argus' },
  vision: { label: '03 / NEXTLEAP AERONAUTICS', title: 'Vision-based landing.', body: 'At NextLeap Aeronautics I worked on a vision-based drone landing system, with a Jetson Nano mounted on the drone, a Pixhawk flight controller and pymavlink.', points: ['Deep-learning helipad detection and Euler-angle estimation.', 'Closed-loop control and validation on a physical drone.', 'The interesting challenge: connecting visual perception to a working flight system.'], link: 'https://github.com/omkhairate' },
  thrustbench: { label: 'FIELD NOTES / NEXTLEAP AERONAUTICS', title: 'Out of the lab.', body: 'I also worked on a thrust bench used for testing in a high-altitude, low-temperature area. This is the actual field setup, rather than an illustrative render.', points: [], gallery: [{src:'/images/nextleap-thrust-bench.jpg',alt:'NextLeap thrust-test rig with a large propeller, aluminum frame and instrumentation outdoors in a mountain landscape',caption:'Thrust bench during field testing. NextLeap Aeronautics.'}] },
  collector: { label: 'FIELD NOTES / BACHELOR\'S MAJOR PROJECT', title: 'Built for the water.', body: 'My bachelor\'s major project was a trash collector for water bodies. These photos show the physical prototype, including its conveyor-style collection mechanism and mounted camera.', points: [], gallery: [{src:'/images/water-collector-front.jpg',alt:'Front view of the water-trash collector prototype showing its conveyor belt, rollers, electronics and camera',caption:'The collection mechanism, viewed from the front.'},{src:'/images/water-collector-side.jpg',alt:'Side view of the plywood-framed water-trash collector prototype with a paddle wheel and raised camera',caption:'Side view of the collection prototype.'}] },
  nomad: { label: '04 / NOMAD', title: 'A renderer. A research question.', body: 'Nomad is my research-oriented Metal path tracer for macOS. It explores which geometry should stay resident on the GPU when the scene competes for a limited memory budget.', points: ['C++, Metal Shading Language and Python.', 'Dynamic geometry residency and GPU memory-budget experiments.', 'Repeatable benchmarks, frame capture and tooling for learned residency policies.'], link:'https://github.com/omkhairate/Nomad' }
};
const dialog = document.querySelector('#project-dialog');
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const data = details[button.dataset.project];
  dialog.classList.toggle('photo-dialog',Boolean(data.gallery));
  const photos=(data.gallery||[]).map(photo=>`<figure><img src="${photo.src}" alt="${photo.alt}" loading="lazy" decoding="async"><figcaption>${photo.caption}</figcaption></figure>`).join('');
  document.querySelector('#dialog-content').innerHTML = `<div class="kicker">${data.label}</div><h2>${data.title}</h2><p>${data.body}</p>${data.points.length?`<ul>${data.points.map(p => `<li>${p}</li>`).join('')}</ul>`:''}${photos}${data.link?`<a class="project-link" href="${data.link}" target="_blank" rel="noopener noreferrer">View on GitHub <i data-lucide="arrow-up-right"></i></a>`:''}`;
  createIcons({ icons }); dialog.showModal();
}));
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
const toggle = document.querySelector('#motion-toggle');
function updateMotionButton() { toggle.setAttribute('aria-pressed', String(paused)); toggle.setAttribute('aria-label', paused ? 'Resume animation' : 'Pause animation'); toggle.title = paused ? 'Resume animation' : 'Pause animation'; toggle.innerHTML = `<i data-lucide="${paused ? 'play' : 'pause'}"></i>`; createIcons({ icons }); }
toggle.addEventListener('click', () => { paused = !paused; updateMotionButton(); });
updateMotionButton();

function initScene() {
  const pixelRatio=()=>Math.min(devicePixelRatio,innerWidth<=600?1.25:1.5);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference:'high-performance' });
  renderer.setPixelRatio(pixelRatio());
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .78;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.querySelector('#scene').appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202624);
  scene.fog = new THREE.Fog(0x202624,18,42);
  const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, .1, 80);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const dof = new BokehPass(scene,camera,{focus:13,aperture:0,maxblur:.012});
  composer.addPass(dof);
  composer.addPass(new OutputPass());
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, .04).texture;
  room.dispose();
  scene.add(new THREE.HemisphereLight(0xf5fff5, 0x45524c, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.7); key.position.set(-3, 8, 7); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 7; key.shadow.camera.bottom = -5; key.shadow.normalBias = .03; scene.add(key);
  const rim = new THREE.DirectionalLight(0xc8e0e3, 3.3); rim.position.set(4, 3, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffded0, .7); fill.position.set(-4, 0, 2); scene.add(fill);

  const porcelain = new THREE.MeshPhysicalMaterial({ color: 0xa9653c, metalness: 0, roughness: .62, clearcoat: .07 });
  const black = new THREE.MeshStandardMaterial({ color: 0x252d29, roughness: .48, metalness: .35 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xb9c7c2, metalness: .85, roughness: .27 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc3442f, metalness: .3, roughness: .4 });
  const model = new THREE.Group(); scene.add(model);
  const figure = new THREE.Group();
  function ellipsoid(parent, x, y, z, sx, sy, sz, material = porcelain, segments = 48) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, segments, 32), material);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function box(parent, x, y, z, w, h, d, material) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; }
  function repeatedBoxes(parent,positions,size,material){
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(...size),material,positions.length);
    const matrix=new THREE.Matrix4();
    positions.forEach((position,index)=>mesh.setMatrixAt(index,matrix.makeTranslation(...position)));
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function segment(parent, a, b, radius, material = porcelain, endRadius = radius) {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b); const delta = to.clone().sub(from);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(endRadius, radius, delta.length(), 32), material);
    mesh.position.copy(from.add(to).multiplyScalar(.5)); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  function line(parent, points, material, radius = .012) { const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))); const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 7, false), material); parent.add(mesh); return mesh; }

  // A continuous workshop set stays behind the character through every camera move.
  const studio=new THREE.Group();scene.add(studio);
  const wallMaterial=new THREE.MeshStandardMaterial({color:0x303b35,roughness:.94});
  const frameMaterialStudio=new THREE.MeshStandardMaterial({color:0x58645c,roughness:.7,metalness:.35});
  box(studio,0,1,-5,32,18,.15,wallMaterial);
  box(studio,0,-3.03,0,80,.12,80,new THREE.MeshStandardMaterial({color:0x272e2a,roughness:.88}));
  for(let x=-12;x<=12;x+=2)box(studio,x,1,-4.87,.025,14,.07,frameMaterialStudio);
  for(const x of [-5,5]){
    box(studio,x,-.9,-3.6,2.4,.10,1,frameMaterialStudio);
    box(studio,x,1.9,-3.6,2.4,.08,.8,frameMaterialStudio);
    for(let i=0;i<4;i++)box(studio,x-.8+i*.4,2.12,-3.6,.14,.36,.3,new THREE.MeshStandardMaterial({color:[0x8b7358,0x667f76,0x9a4e3f,0x424d49][i],roughness:.9}));
    box(studio,x,-2,-3.8,.08,2,.08,frameMaterialStudio);
  }
  const lightStrip=new THREE.MeshBasicMaterial({color:0xb5d4bf});
  box(studio,4,3.5,-4.72,3,.035,.03,lightStrip);
  box(studio,-5,3.5,-4.72,2,.035,.03,lightStrip);


  // Quadcopter: frame, four motor pods, propellers and a small forward camera.
  const drone=new THREE.Group();drone.position.set(-1.4,.68,.56);figure.add(drone);
  ellipsoid(drone,0,0,0,.19,.075,.24,black);const propellers=[];
  for(const x of [-.31,.31])for(const z of [-.31,.31]){segment(drone,[0,0,0],[x,.01,z],.033,black);ellipsoid(drone,x,.03,z,.06,.05,.06,silver);const prop=new THREE.Group();prop.position.set(x,.096,z);const blade=ellipsoid(prop,0,0,0,.24,.009,.026,black);propellers.push(prop);drone.add(prop);}
  box(drone,0,-.06,.22,.13,.09,.08,black);ellipsoid(drone,0,-.06,.267,.035,.035,.012,silver);box(drone,0,.08,0,.16,.025,.22,red);
  // Jetson Nano development board with heatsink, GPIO header and connector stack.
  const jetson=new THREE.Group();jetson.position.set(1.4,.55,.6);jetson.rotation.set(.12,-.25,0);figure.add(jetson);
  const pcb=new THREE.MeshStandardMaterial({color:0x2e7351,roughness:.7,metalness:.2});box(jetson,0,0,0,.43,.025,.34,pcb);box(jetson,0,.065,0,.22,.09,.19,black);
  repeatedBoxes(jetson,Array.from({length:10},(_,i)=>[-.103+i*.023,.137,0]),[.009,.07,.19],silver);
  box(jetson,.165,.055,.1,.1,.08,.12,silver);box(jetson,.165,.055,-.07,.1,.08,.11,silver);box(jetson,-.16,.027,-.12,.24,.03,.035,black);
  const gold=new THREE.MeshStandardMaterial({color:0xc0a859,metalness:.7,roughness:.35});repeatedBoxes(jetson,Array.from({length:16},(_,i)=>[-.17+i*.014,.052,-.12]),[.005,.025,.006],gold);
  model.add(drone,jetson);
  const floorY=-2.91;
  const base=new THREE.Mesh(new THREE.CylinderGeometry(2.25,2.25,.055,120),new THREE.MeshStandardMaterial({color:0x35423b,roughness:.7}));base.position.y=floorY;model.add(base);
  const perimeter=new THREE.Mesh(new THREE.TorusGeometry(2.21,.008,6,160),new THREE.MeshBasicMaterial({color:0x9ca698}));perimeter.rotation.x=Math.PI/2;perimeter.position.y=floorY+.032;model.add(perimeter);
  const laptop=new THREE.Group();laptop.position.set(.85,floorY+.07,1.05);laptop.rotation.y=-.4;model.add(laptop);
  box(laptop,0,0,0,.72,.035,.47,silver);
  repeatedBoxes(laptop,Array.from({length:44},(_,i)=>[-.28+(i%11)*.054,.021,-.12+Math.floor(i/11)*.048]),[.043,.004,.033],black);
  box(laptop,0,.022,.135,.22,.003,.11,new THREE.MeshStandardMaterial({color:0x97a5a0,metalness:.5,roughness:.5}));
  const lid=new THREE.Group();lid.position.set(0,.018,-.23);lid.rotation.x=-.24;laptop.add(lid);box(lid,0,.24,0,.72,.48,.025,silver);
  const screenCanvas=document.createElement('canvas');screenCanvas.width=720;screenCanvas.height=480;const sc=screenCanvas.getContext('2d');sc.fillStyle='#172620';sc.fillRect(0,0,720,480);sc.fillStyle='#dce7d7';sc.font='50px monospace';sc.fillText('cleo_',45,90);sc.font='22px monospace';sc.fillStyle='#7eb69a';['> context assembled','> memory retrieved','> ready when you are.'].forEach((t,i)=>sc.fillText(t,45,210+i*55));const screenTex=new THREE.CanvasTexture(screenCanvas);screenTex.colorSpace=THREE.SRGBColorSpace;const screen=new THREE.Mesh(new THREE.PlaneGeometry(.66,.41),new THREE.MeshBasicMaterial({map:screenTex}));screen.position.set(0,.245,.014);lid.add(screen);
  // Hardware layout described by Om: Pi Zero WH on a temple, camera on a lens.
  // Mounting side, frame shape and cable routing are illustrative, not measured.
  const memory=new THREE.Group();memory.position.set(-.95,floorY+.18,1.05);memory.rotation.set(-.22,.18,0);model.add(memory);
  const frameMaterial=new THREE.MeshStandardMaterial({color:0x171d1b,roughness:.44,metalness:.12});
  const lensMaterial=new THREE.MeshPhysicalMaterial({color:0x173c37,roughness:.12,metalness:.18,transparent:true,opacity:.87,clearcoat:1,side:THREE.DoubleSide});
  for(const side of [-1,1]){
    const cx=side*.25;
    const outline=new THREE.Shape();
    outline.moveTo(cx-.19,.11);outline.bezierCurveTo(cx-.22,.09,cx-.2,-.10,cx-.14,-.13);
    outline.bezierCurveTo(cx-.05,-.17,cx+.12,-.15,cx+.16,-.09);outline.bezierCurveTo(cx+.20,-.04,cx+.21,.09,cx+.17,.11);outline.bezierCurveTo(cx+.06,.135,cx-.08,.14,cx-.19,.11);
    const lens=new THREE.Mesh(new THREE.ShapeGeometry(outline,32),lensMaterial);lens.position.z=.11;memory.add(lens);
    const framePoints=outline.getPoints(60).map(p=>new THREE.Vector3(p.x,p.y,.12));
    const frameCurve=new THREE.CatmullRomCurve3(framePoints,true);
    const rimMesh=new THREE.Mesh(new THREE.TubeGeometry(frameCurve,90,.021,10,true),frameMaterial);rimMesh.castShadow=true;memory.add(rimMesh);
    line(memory,[[side*.45,.095,.105],[side*.49,.09,-.05],[side*.48,.05,-.34],[side*.44,-.02,-.44]],frameMaterial,.021);
    box(memory,side*.45,.08,.09,.038,.054,.06,silver);
  }
  line(memory,[[-.07,.07,.12],[0,.095,.13],[.07,.07,.12]],frameMaterial,.022);
  const piBoard=new THREE.Group();piBoard.position.set(.505,.08,-.17);memory.add(piBoard);
  box(piBoard,0,0,0,.024,.15,.36,pcb);
  box(piBoard,.018,0,0,.016,.067,.073,black);
  box(piBoard,.018,-.036,.10,.04,.035,.055,silver);
  box(piBoard,.018,-.036,.035,.04,.035,.055,silver);
  box(piBoard,.014,-.03,-.13,.025,.055,.065,silver);
  box(piBoard,.023,.058,0,.025,.026,.29,black);
  repeatedBoxes(piBoard,Array.from({length:40},(_,i)=>[.042,.047+Math.floor(i/20)*.017,-.135+(i%20)*.014]),[.022,.005,.005],gold);
  const cameraModule=new THREE.Group();cameraModule.position.set(.31,.025,.145);memory.add(cameraModule);
  box(cameraModule,0,0,0,.095,.09,.018,pcb);box(cameraModule,0,0,.022,.06,.06,.032,black);
  const cameraLens=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.02,32),silver);cameraLens.rotation.x=Math.PI/2;cameraLens.position.z=.045;cameraModule.add(cameraLens);
  ellipsoid(cameraModule,0,0,.058,.015,.015,.004,black,24);
  const cableMaterial=new THREE.MeshStandardMaterial({color:0xab8961,roughness:.65});
  line(memory,[[.35,.065,.15],[.43,.14,.12],[.50,.15,-.04],[.52,.1,-.12]],cableMaterial,.009);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x475245,opacity:.13}));ground.rotation.x=-Math.PI/2;ground.position.y=floorY-.033;ground.receiveShadow=true;scene.add(ground);

  // A classic graphics-study motif. This Three.js scene is not presented as Nomad output.
  const nomad=new THREE.Group();nomad.position.set(2.15,floorY+.51,.2);nomad.scale.setScalar(.65);nomad.userData.focusChapter=4;model.add(nomad);
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.86,.86,.10,64),new THREE.MeshStandardMaterial({color:0x435049,roughness:.65,metalness:.25}));
  plinth.position.y=-.72;plinth.receiveShadow=true;nomad.add(plinth);
  const teapotMaterial=new THREE.MeshPhysicalMaterial({color:0xc3a066,metalness:.88,roughness:.18,clearcoat:.8});
  const teapot=new THREE.Mesh(new TeapotGeometry(.32,20),teapotMaterial);teapot.position.set(-.06,-.34,.04);nomad.add(teapot);
  const studyCube=box(nomad,.52,-.46,-.25,.35,.48,.35,new THREE.MeshPhysicalMaterial({color:0xb4cbd0,metalness:.22,roughness:.1,clearcoat:1}));studyCube.rotation.y=.35;
  const wireGeometry=new THREE.EdgesGeometry(new THREE.BoxGeometry(.39,.52,.39));
  const wire=new THREE.LineSegments(wireGeometry,new THREE.LineBasicMaterial({color:0x2b615b,transparent:true,opacity:.6}));wire.position.copy(studyCube.position);wire.rotation.copy(studyCube.rotation);nomad.add(wire);
  const studyLight=new THREE.PointLight(0xffebc2,1.4,3);studyLight.position.set(0,.55,.1);nomad.add(studyLight);

  drone.userData.focusChapter=3;jetson.userData.focusChapter=3;laptop.userData.focusChapter=1;memory.userData.focusChapter=2;
  const avatarRoot=new THREE.Group();model.add(avatarRoot);
  let avatarReady=false;
  new GLTFLoader().load('/models/om-cartoon.glb',gltf=>{
    const avatar=gltf.scene;
    const bounds=new THREE.Box3().setFromObject(avatar);
    const size=bounds.getSize(new THREE.Vector3());
    const center=bounds.getCenter(new THREE.Vector3());
    const scale=5.65/size.y;
    avatar.scale.setScalar(scale);
    avatar.position.set(-center.x*scale,floorY+.04-bounds.min.y*scale,-center.z*scale);
    avatar.traverse(object=>{if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;
      const materials=Array.isArray(object.material)?object.material:[object.material];
      const copies=materials.map(material=>{const copy=material.clone();copy.roughness=Math.max(.5,copy.roughness);copy.envMapIntensity=.7;
        // Correct the generated texture's warm skin regions, leaving neutral clothing alone.
        copy.onBeforeCompile=shader=>{
          shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
            float warmTone = smoothstep(0.045, 0.13, diffuseColor.r - diffuseColor.b);
            float skinLuma = smoothstep(0.12, 0.32, diffuseColor.g);
            diffuseColor.rgb *= mix(vec3(1.0), vec3(0.48, 0.40, 0.34), warmTone * skinLuma);
          `);
        };
        copy.customProgramCacheKey=()=> 'om-skin-tone-v1';
        return copy;});
      object.material=Array.isArray(object.material)?copies:copies[0];
    });
    avatarRoot.add(avatar);avatarReady=true;
  },undefined,error=>{console.error('Character GLB could not be loaded:',error);document.querySelector('#scene').setAttribute('aria-label','Project artwork; character model unavailable.');});

  const state={ angle:-.35 };
  const cameraTarget = new THREE.Vector3(-1.45,-.15,0);
  const cameraPosition = new THREE.Vector3(-1.45,1.8,12.8);
  const focusWorld = new THREE.Vector3();
  const nextFocus=new THREE.Vector3(),look=new THREE.Vector3(),nextPosition=new THREE.Vector3(),opticalFocus=new THREE.Vector3();
  let chapterOffsets=chapters.map(chapter=>chapter.offsetTop);
  const measureChapters=()=>{chapterOffsets=chapters.map(chapter=>chapter.offsetTop);};
  new ResizeObserver(measureChapters).observe(document.querySelector('main'));
  document.fonts.ready.then(measureChapters);
  let pointerX=0,pointerY=0;
  window.addEventListener('pointermove',e=>{pointerX=e.clientX/innerWidth-.5;pointerY=e.clientY/innerHeight-.5;},{passive:true});
  function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);measureChapters();}window.addEventListener('resize',resize);
  let last=performance.now(),elapsed=0;
  let animationFrame;
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(animationFrame);else{last=performance.now();animationFrame=requestAnimationFrame(render);}});
  function render(now){
    const dt=Math.min((now-last)/1000,.05);last=now;if(!paused)elapsed+=dt;
    const mobile=innerWidth<=600;
    const scroll=scrollY;let index=0;
    for(let i=1;i<chapters.length;i++)if(scroll>=chapterOffsets[i]-innerHeight*.5)index=i;
    const start=chapterOffsets[index]-innerHeight*.5;
    const previous=Math.max(0,index-1);
    const raw=THREE.MathUtils.clamp((scroll-start)/(innerHeight*.5),0,1);
    const blend=raw*raw*(3-2*raw);
    // Each beat is a camera move to the actual object's position, not a page-scale illusion.
    const shots=[
      {angle:-.34,focus:[0,-.15,0],distance:mobile?15.4:12.8,elevation:1.95,offset:mobile?[-.55,2.7]:[-1.45,0]},
      {angle:-.22,focus:[.85,-2.63,1.05],distance:mobile?4.6:3.7,elevation:1.8,offset:mobile?[0,1.15]:[-.85,.05]},
      {angle:.28,focus:[-.95,-2.73,1.02],distance:mobile?4.3:3.4,elevation:1.1,offset:mobile?[0,1.05]:[.85,0]},
      {angle:-.42,focus:[-1.4,.68,.56],distance:mobile?4.7:4.0,elevation:1.55,offset:mobile?[0,1.2]:[-.9,0]},
      {angle:-.22,focus:[2.15,-2.62,.2],distance:mobile?4.8:3.5,elevation:.8,offset:mobile?[0,.72]:[.85,0]},
      {angle:.45,focus:[0,1.96,.1],distance:mobile?7:5.8,elevation:.3,offset:mobile?[0,2.15]:[1.2,-.1]}
    ];
    const ease=reduceMotion?1:1-Math.exp(-dt*5);
    const from=shots[previous],to={...shots[index],focus:[...shots[index].focus]};
    if(previous===3){from.focus=[1.4,.55,.6];from.angle=.35;}
    if(index===3){const hardwareProgress=THREE.MathUtils.smoothstep((scroll-chapterOffsets[3])/innerHeight,.15,.55);to.focus[0]=THREE.MathUtils.lerp(-1.4,1.4,hardwareProgress);to.focus[1]=THREE.MathUtils.lerp(.68,.55,hardwareProgress);to.focus[2]=THREE.MathUtils.lerp(.56,.6,hardwareProgress);to.angle=THREE.MathUtils.lerp(-.42,.35,hardwareProgress);}
    state.angle=THREE.MathUtils.lerp(state.angle,THREE.MathUtils.lerp(from.angle,to.angle,blend),ease);
    model.position.set(0,0,0);model.rotation.y=state.angle+(paused?0:pointerX*.04);model.rotation.z=0;model.scale.setScalar(1);model.updateMatrixWorld(true);
    focusWorld.fromArray(from.focus).lerp(nextFocus.fromArray(to.focus),blend);model.localToWorld(focusWorld);
    const ox=THREE.MathUtils.lerp(from.offset[0],to.offset[0],blend),oy=THREE.MathUtils.lerp(from.offset[1],to.offset[1],blend);
    const distance=THREE.MathUtils.lerp(from.distance,to.distance,blend),elevation=THREE.MathUtils.lerp(from.elevation,to.elevation,blend);
    look.set(focusWorld.x+ox,focusWorld.y+oy,focusWorld.z);
    cameraTarget.lerp(look,ease);cameraPosition.lerp(nextPosition.set(look.x,look.y+elevation,look.z+distance),ease);
    camera.position.copy(cameraPosition);camera.lookAt(cameraTarget);
    ground.visible=true;
    nomad.visible=true;teapot.rotation.y=elapsed*.18;wire.visible=true;
    avatarRoot.rotation.z=paused?0:Math.sin(elapsed*.35)*.004;
    propellers.forEach((p,i)=>{if(!paused)p.rotation.y=elapsed*(index===3?14:1.5)+i;});
    const projectFocus=index>0&&index<5;
    opticalFocus.copy(focusWorld).applyMatrix4(camera.matrixWorldInverse);
    dof.uniforms.focus.value=THREE.MathUtils.lerp(dof.uniforms.focus.value,-opticalFocus.z,ease);
    dof.uniforms.aperture.value=THREE.MathUtils.lerp(dof.uniforms.aperture.value,projectFocus?.008:0.00008,ease);
    if(projectFocus||dof.uniforms.aperture.value>.0002)composer.render();else renderer.render(scene,camera);
    window.__portfolioScene={chapter:index,rotation:state.angle,distance:camera.position.distanceTo(cameraTarget),focus:cameraTarget.toArray(),frame:now,objects:scene.children.length,avatarReady,webgl:true,drawCalls:renderer.info.render.calls,pixelRatio:renderer.getPixelRatio(),depthOfField:projectFocus};
    animationFrame=requestAnimationFrame(render);
  }
  animationFrame=requestAnimationFrame(render);
}
try { initScene(); } catch(error) { console.error('3D scene unavailable:',error); document.body.classList.add('webgl-fallback');document.querySelector('#scene').setAttribute('aria-label','3D artwork unavailable; all portfolio content remains accessible.'); document.querySelector('#motion-toggle').hidden=true; }
