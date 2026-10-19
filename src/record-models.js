import * as THREE from 'three';

const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const material=(color,metalness=0)=>new THREE.MeshStandardMaterial({color,metalness,roughness:metalness?.3:.75});

function mesh(parent,geometry,mat,position=[0,0,0]){
  const object=new THREE.Mesh(geometry,mat);object.position.set(...position);parent.add(object);return object;
}

function printedPage(title,subtitle,color){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=1024;
  const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,768,1024);
  ctx.fillStyle='#f4eee0';ctx.font='24px sans-serif';ctx.fillText('OM KHAIRATE',65,90);
  ctx.font='bold 66px Georgia';title.forEach((line,i)=>ctx.fillText(line,65,300+i*85));
  ctx.font='22px sans-serif';ctx.fillText(subtitle,65,875);
  ctx.strokeStyle='#c8baa2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(65,805);ctx.lineTo(703,805);ctx.stroke();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({map:texture,roughness:.8});
}

function populate(group,type){
  const gold=material(0xd5ad66,.8),ink=material(0x303b37),paper=material(0xe9e6d9);
  if(type==='books'){
    [['Do you','See?'],['Our Time','In The Sun']].forEach((title,i)=>{
      const book=new THREE.Group();book.position.set(i? .72:-.65,i?.05:-.08,i?-.18:.15);book.rotation.set(-.06,i?-.25:.2,i?-.1:.07);group.add(book);
      const cover=material(i?0xa85c43:0x287a78);
      mesh(book,new THREE.BoxGeometry(1.13,1.68,.20),paper);
      for(const z of [-.12,.12])mesh(book,new THREE.BoxGeometry(1.19,1.74,.035),cover,[0,0,z]);
      mesh(book,new THREE.BoxGeometry(.07,1.74,.27),cover,[-.58,0,0]);
      mesh(book,new THREE.PlaneGeometry(1.16,1.71),printedPage(title,'OM KHAIRATE',i?'#963d32':'#185957'),[0,0,.14]);
    });
  }else if(type==='achievements'){
    mesh(group,new THREE.CylinderGeometry(.68,.76,.2,48),ink,[0,-.9,0]);
    mesh(group,new THREE.CylinderGeometry(.13,.23,.65,32),gold,[0,-.5,0]);
    mesh(group,new THREE.CylinderGeometry(.59,.14,.7,48,1,true),gold,[0,.14,0]);
    mesh(group,new THREE.TorusGeometry(.59,.04,12,64),gold,[0,.49,0]).rotation.x=Math.PI/2;
    for(const side of [-1,1]){
      const handle=mesh(group,new THREE.TorusGeometry(.35,.045,12,40),gold,[side*.56,.14,0]);handle.scale.x=.8;
    }
    mesh(group,new THREE.BoxGeometry(.63,.1,.015),gold,[0,-.9,.71]);
  }else{
    for(let i=0;i<3;i++){
      const sheet=mesh(group,new THREE.BoxGeometry(1.45,1.95,.025),paper,[(i-1)*.12,(i-1)*.04,-i*.10]);sheet.rotation.z=(i-1)*.12;
    }
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=1024;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#eeece2';ctx.fillRect(0,0,768,1024);ctx.fillStyle='#263c33';
    ctx.font='bold 47px Georgia';ctx.fillText('Seeing beyond',65,145);ctx.fillText('the benchmark.',65,205);
    ctx.font='22px sans-serif';ctx.fillText('COMPUTER VISION / RESEARCH',65,270);
    ctx.strokeStyle='#aeb8a9';ctx.lineWidth=9;
    for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(65,330+i*35);ctx.lineTo(i%3===0?550:700,330+i*35);ctx.stroke();}
    ctx.strokeStyle='#2c7167';ctx.lineWidth=5;ctx.strokeRect(95,650,550,240);
    for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#d39c56':'#3e8278';ctx.fillRect(150+i*90,850-i*29,45,30+i*29);}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    mesh(group,new THREE.PlaneGeometry(1.44,1.94),new THREE.MeshStandardMaterial({map:texture,roughness:.9}),[-.12,-.04,.017]).rotation.z=-.12;
  }
}

document.querySelectorAll('[data-record-model]').forEach(container=>{
  let renderer,scene,camera,group,frame,visible=false,angle=0,previous=0;
  function resize(){if(!renderer)return;const {width,height}=container.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}
  function draw(now){
    if(!visible||document.hidden)return;
    const delta=Math.min((now-previous)/1000,.05);previous=now;
    if(!reducedMotion&&document.querySelector('#motion-toggle').getAttribute('aria-pressed')!=='true')angle+=delta*.18;
    group.rotation.y=Math.sin(angle)*.2-.12;group.position.y=Math.sin(angle*.8)*.035;
    renderer.render(scene,camera);frame=requestAnimationFrame(draw);
  }
  function start(){
    if(!renderer){
      renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
      container.appendChild(renderer.domElement);scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.1,30);camera.position.set(0,.25,5.7);
      scene.add(new THREE.HemisphereLight(0xffffff,0x314f42,2.2));const key=new THREE.DirectionalLight(0xffe7c5,3);key.position.set(3,4,5);scene.add(key);
      const fill=new THREE.DirectionalLight(0xafd8d1,1.5);fill.position.set(-3,1,2);scene.add(fill);
      group=new THREE.Group();scene.add(group);populate(group,container.dataset.recordModel);resize();new ResizeObserver(resize).observe(container);
    }
    cancelAnimationFrame(frame);previous=performance.now();frame=requestAnimationFrame(draw);
  }
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else cancelAnimationFrame(frame);},{threshold:.05});observer.observe(container);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);if(!document.hidden&&visible)start();});
});
