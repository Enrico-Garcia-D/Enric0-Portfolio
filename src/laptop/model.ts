// @ts-nocheck
/* HP ProBook 445 G10 procedural model, ported from the standalone Three.js prototype.
   Dimensions/part numbers come from the HP Maintenance and Service Guide; the internal layout is schematic.
   Kept as loosely typed code on purpose: it is dense geometry code that is not edited often. */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const ASSET = `${import.meta.env.BASE_URL}laptop/`

export const DEFAULT_CFG = {content:'boot',finish:'silver',logo:'official',sticker:false,kb:'us',cpu:'r5',ram:'16',ssd:'512',ssd2:'none',wlan:'rt',bat:'42',panel:'fhd250',cam:'hd',backlit:true,fp:true,wwan:false}

const W = 321.90/50, D = 213.90/50;          // chassis footprint, 1 scene unit = 50 mm (guide p.83)
const CPU = {
  r7:{name:'AMD Ryzen 7 7730U', spec:'8 cores · 2.0 GHz base · 16 MB cache · 15 W', pn:{base:'N38981-xx1', ir:'N38983-xx1', wwan:'N38985-xx1'}},
  r5:{name:'AMD Ryzen 5 7530U', spec:'6 cores · 2.0 GHz base · 16 MB cache · 15 W', pn:{base:'N38980-xx1', ir:'N38984-xx1', wwan:'N38982-xx1'}},
  r3:{name:'AMD Ryzen 3 7330U', spec:'4 cores · 2.3 GHz base · 8 MB cache · 15 W',  pn:{base:'N38979-xx1', ir:null, wwan:null}}
};
const BAT = {'42':{pn:'M75599-005', fan:'M21718-001', cover:'N38996-001', size:[3.9,.12,1.35], cname:'42 Whr / UMA'}, '51':{pn:'M73472-005', fan:'N00095-001', cover:'N00121-001', size:[4.2,.13,1.40], cname:'51 Whr'}};
const RAM = {'4':{n:1,gb:4,pn:'L83673-001'}, '8':{n:1,gb:8,pn:'L46598-001'}, '16':{n:2,gb:8,pn:'L46598-001'}, '32':{n:2,gb:16,pn:'L67710-001'}};
const SSD = {'256':'L85354-001','512':'N45476-001','1024':'M16560-001'};
const SSD2 = {'128':'M11040-001','256':'M11042-001'};
const WLAN = {mt:{pn:'N19618-001', name:'MediaTek RZ616 Wi-Fi 6E · Bluetooth 5.3 AIM-T'}, rt:{pn:'N22541-001', name:'Realtek 8852CE Wi-Fi 6E · Bluetooth 5.3'}};
const PANEL = {
  fhd250 :{pn:'N43565-001', fhd:true,  nits:250, t:'FHD 1920×1080 · 250 nit · 45% CG · UWVA', short:'FHD 250 nit'},
  fhd250t:{pn:'N43566-001', fhd:true,  nits:250, t:'FHD 1920×1080 · 250 nit · touch screen',  short:'FHD touch'},
  fhd400 :{pn:'N43567-001', fhd:true,  nits:400, t:'FHD 1920×1080 · 400 nit · sRGB 100 · low blue light', short:'FHD 400 nit'},
  hd250  :{pn:'N43568-001', fhd:false, nits:250, t:'HD 1366×768 · 250 nit · SVA', short:'HD 250 nit'}
};
const BEZEL = {fhd:{none:'M21386-001', hd:'M21387-001', ir:'N39007-001'}, hd:{none:'N07448-001', hd:'N07449-001', ir:'N07450-001'}};

export function createLaptop(cfg = DEFAULT_CFG) {
const root = new THREE.Group()
let parts = [], rotors = []
const pending = [] // image loads the textures wait on
/* ------------------------------------------------------------------ helpers */
const V = (x,y,z)=>new THREE.Vector3(x,y,z);
const std = (c,m=.5,r=.5,o={})=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:r,...o});
const MT = {bezel:std(0x030304,0,.92), silver:std(0xbcc1c6,.68,.46), silver2:std(0xc2c7cc,.6,.52), steel:std(0xc6cbd0,.8,.3), black:std(0x15181c,.1,.65), key:std(0x0b0b0c,0,.6,{envMapIntensity:.25}), keyTop:std(0x181c20,.02,.72),
  pcb:std(0x1d5c47,.25,.5), pcb2:std(0x12302a,.25,.55), gold:std(0xd6a93c,1,.28), chip:std(0x0b0d10,.4,.35), cu:std(0xb87333,.9,.28), ssd:std(0x1a2947,.3,.5), rub:std(0x08090a,0,.95),
  glass:std(0x0a0d11,0,.12), batt:std(0x1f252c,.35,.5), white:std(0xe9edf0,0,.6), zif:std(0x2a2d31,.3,.5), flap:std(0xcfc9b8,0,.7), ram:std(0x1b5a3a,.25,.5), imp:std(0x2a2e33,.3,.5), led:std(0xffffff,0,.4,{emissive:0xffffff,emissiveIntensity:1.2})};
const keycap = (w,d,x,z)=>{const hx=w*.49,hz=d*.49,r=Math.min(.012,hx*.5,hz*.5),s=new THREE.Shape();  s.moveTo(-hx+r,-hz);s.lineTo(hx-r,-hz);s.absarc(hx-r,-hz+r,r,-Math.PI/2,0,false);s.lineTo(hx,hz-r);s.absarc(hx-r,hz-r,r,0,Math.PI/2,false);s.lineTo(-hx+r,hz);s.absarc(-hx+r,hz-r,r,Math.PI/2,Math.PI,false);s.lineTo(-hx,-hz+r);s.absarc(-hx+r,-hz+r,r,Math.PI,Math.PI*1.5,false);  const g=new THREE.ExtrudeGeometry(s,{depth:.034,bevelEnabled:true,bevelThickness:.005,bevelSize:.004,bevelOffset:-.004,bevelSegments:2,curveSegments:4});g.rotateX(-Math.PI/2);return g.translate(x,.372,z)};
const bx = (w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x,y,z);
const box = (w,h,d,x,y,z,m)=>new THREE.Mesh(bx(w,h,d,x,y,z),m);
const merge = (a,m)=>new THREE.Mesh(mergeGeometries(a),m);
const cylG = (r,h,x,y,z,axis='y',seg=24)=>{const g=new THREE.CylinderGeometry(r,r,h,seg); if(axis==='x')g.rotateZ(Math.PI/2); if(axis==='z')g.rotateX(Math.PI/2); return g.translate(x,y,z)};
const cyl = (r,h,x,y,z,m,axis)=>new THREE.Mesh(cylG(r,h,x,y,z,axis),m);
const rcyl = (r,h,x,y,z,m)=>new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,28).rotateZ(Math.PI/2).scale(1,1/KY,1).translate(x,y,z),m);
const tube = (pts,r,m)=>new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>V(...p))),48,r,8,false),m);
const label = (o,t)=>{o.userData.label=t;return o};
function rrPath(p,cx,cz,w,d,r){const x0=cx-w/2,x1=cx+w/2,y0=-cz-d/2,y1=-cz+d/2;r=Math.min(r,w/2,d/2);
  p.moveTo(x0+r,y0);p.lineTo(x1-r,y0);p.absarc(x1-r,y0+r,r,-Math.PI/2,0,false);p.lineTo(x1,y1-r);p.absarc(x1-r,y1-r,r,0,Math.PI/2,false);
  p.lineTo(x0+r,y1);p.absarc(x0+r,y1-r,r,Math.PI/2,Math.PI,false);p.lineTo(x0,y0+r);p.absarc(x0+r,y0+r,r,Math.PI,Math.PI*1.5,false);return p}
const rrShape = (cx,cz,w,d,r)=>rrPath(new THREE.Shape(),cx,cz,w,d,r);
const rrHole  = (cx,cz,w,d,r)=>rrPath(new THREE.Path(),cx,cz,w,d,r);
function slabXZ(shape,depth,y,m,bev=0){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bev>0,bevelThickness:bev,bevelSize:bev,bevelOffset:-bev,bevelSegments:1,curveSegments:10});g.rotateX(-Math.PI/2);g.translate(0,y,0);return new THREE.Mesh(g,m)}
// lid shapes live in the XY plane; rrPath's "z" argument is -y there
const rrShapeXY = (cx,cy,w,h,r)=>rrPath(new THREE.Shape(),cx,-cy,w,h,r);
// lid outline: rounded top corners, square bottom corners (the bottom edge meets the hinge)
function rrPathTop(p,cx,cz,w,d,r){const x0=cx-w/2,x1=cx+w/2,y0=-cz-d/2,y1=-cz+d/2;r=Math.min(r,w/2,d/2);
  p.moveTo(x0,y0);p.lineTo(x1,y0);p.lineTo(x1,y1-r);p.absarc(x1-r,y1-r,r,0,Math.PI/2,false);p.lineTo(x0+r,y1);p.absarc(x0+r,y1-r,r,Math.PI/2,Math.PI,false);p.lineTo(x0,y0);return p}
const rrShapeXYTop = (cx,cy,w,h,r)=>rrPathTop(new THREE.Shape(),cx,-cy,w,h,r);
const rrHoleXY  = (cx,cy,w,h,r)=>rrPath(new THREE.Path(),cx,-cy,w,h,r);
function slabXY(shape,depth,z,m){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:10});g.translate(0,0,z);return new THREE.Mesh(g,m)}
const KY=.52;   // base is ~12 mm thick in the side photo; internals/exterior are built at 18 mm and squashed by KY
const CHZ=[0,.2,.4,1,2.2,3,3.6,4,4.2,4.28],CHY=[.17,.13,.105,.10,.125,.148,.19,.22,.24,.25];   // bevel height under the side wall vs distance from rear edge
function chU(z){const r=Math.max(0,Math.min(4.28,z+D/2));let i=1;while(i<CHZ.length-1&&r>CHZ[i])i++;const t=(r-CHZ[i-1])/(CHZ[i]-CHZ[i-1]);return CHY[i-1]+(CHY[i]-CHY[i-1])*t}
const PZ0=-1.79,PZ1=1.91,PHW=W/2-.1,PCZ=(PZ0+PZ1)/2;   // flat underside plate outline
function bU(z){return z<PZ0?.02+(PZ0-z)/.35*.17:z>PZ1?.02+(z-PZ1)/.23*.25:.02}   // underside height (for decals)
const YOUT=z=>.02+chU(z),YS=z=>Math.min(YOUT(z)+.17,.37);
const drape=g=>{const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,bU(p.getZ(i))-.0006);return g};
function skirt(sh0,f0,sh1,f1,m){const p0=sh0.getPoints(8),p1=sh1.getPoints(8),n=Math.min(p0.length,p1.length),pos=[],idx=[];
  for(let i=0;i<n;i++){const za=-p0[i].y,zb=-p1[i].y;pos.push(p0[i].x,f0(za),za,p1[i].x,f1(zb),zb)}
  for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  const mm=m.clone();mm.side=THREE.DoubleSide;return new THREE.Mesh(g,mm)}
function plateMesh(m){const hw=PHW,hd=(PZ1-PZ0)/2,zc=PCZ,r=.15,N=60,pos=[],idx=[];
  for(let i=0;i<=N;i++){const z=zc-hd+2*hd*i/N,dz=Math.abs(z-zc),xh=dz<=hd-r?hw:hw-r+Math.sqrt(Math.max(0,r*r-(dz-(hd-r))**2));pos.push(-xh,.02,z,xh,.02,z)}
  for(let i=0;i<N;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  const mm=m.clone();mm.side=THREE.DoubleSide;return new THREE.Mesh(g,mm)}
function grp(...c){const g=new THREE.Group();c.forEach(x=>g.add(x));return g}
function chipsOn(zones,avoid,y,n,seed,top){const a=[];let s=seed;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let i=0;i<n*6&&a.length<n;i++){const x=-2.7+rnd()*5.4,z=-1.85+rnd()*2.35,w=.07+rnd()*.16,d=.07+rnd()*.14;
    if(!top&&avoid.some(r=>x+w/2>r[0]&&x-w/2<r[1]&&z+d/2>r[2]&&z-d/2<r[3]))continue;a.push(bx(w,.012,d,x,y,z))}return a}
const tex = c=>{const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t};
const canvas = (w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
// bead-blasted anodised aluminium: a fine, even sand grain (bump only, so it catches the light without changing the colour){const c=canvas(256,256),x=c.getContext('2d'),d=x.createImageData(256,256);let s=11;  for(let i=0;i<256*256;i++){s=(s*1664525+1013904223)>>>0;const v=128+((s>>>24)-128)*.55;d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=v;d.data[i*4+3]=255}  x.putImageData(d,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(5,5);t.anisotropy=8;  for(const m of[MT.silver,MT.silver2]){m.bumpMap=t;m.bumpScale=.5;m.needsUpdate=true}}

/* ------------------------------------------------------------------ realism helpers: printed labels, PCB artwork, SMD detail */
const rndFrom=s=>()=>(s=(s*16807)%2147483647)/2147483647;
const labelTex=(w,h,draw)=>{const c=canvas(w,h),x=c.getContext('2d');draw(x,w,h);return tex(c)};
/** flat, upward-facing textured plane at (cx,y,cz) */
const flat=(w,d,cx,y,cz,map,o={})=>new THREE.Mesh(new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2).translate(cx,y,cz),new THREE.MeshStandardMaterial({map,roughness:.5,metalness:.05,...o}));
function chipFace(a,b){return labelTex(256,256,(x,w,h)=>{x.fillStyle='#15171a';x.fillRect(0,0,w,h);const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(255,255,255,.09)');g.addColorStop(1,'rgba(0,0,0,.25)');x.fillStyle=g;x.fillRect(0,0,w,h);x.fillStyle='#a3aab1';x.textAlign='center';x.font='600 34px system-ui,sans-serif';x.fillText(a,w/2,104);x.font='500 24px system-ui,sans-serif';x.fillText(b,w/2,146);x.beginPath();x.arc(36,222,9,0,7);x.fill()})}
/** one merged mesh of marked chip tops: list of [cx,y,cz,w,d] */
function chipFaces(list,tx){const g=list.map(([cx,y,cz,w,d])=>new THREE.PlaneGeometry(w*.96,d*.96).rotateX(-Math.PI/2).translate(cx,y,cz));return new THREE.Mesh(mergeGeometries(g),new THREE.MeshStandardMaterial({map:tx,roughness:.45,metalness:.1}))}
function pcbTexture(){const W=2048,H=934,c=canvas(W,H),x=c.getContext('2d'),r=rndFrom(97);
  x.fillStyle='#1c5a46';x.fillRect(0,0,W,H);
  for(let i=0;i<260;i++){x.fillStyle='rgba('+(20+r()*30|0)+','+(90+r()*50|0)+','+(70+r()*40|0)+',.10)';x.fillRect(r()*W,r()*H,40+r()*160,10+r()*50)}
  x.lineCap='round';x.lineJoin='round';
  for(let i=0;i<170;i++){let px=r()*W,py=r()*H;x.strokeStyle='rgba('+(70+r()*30|0)+','+(150+r()*40|0)+','+(120+r()*30|0)+',.5)';x.lineWidth=2+r()*3;x.beginPath();x.moveTo(px,py);const n=2+(r()*4|0);
    for(let k=0;k<n;k++){const len=40+r()*180,dir=r()<.5;px+=dir?(r()<.5?len:-len):0;py+=dir?0:(r()<.5?len:-len);if(r()<.3){px+=len*.4;py+=len*.4}x.lineTo(px,py)}
    x.stroke();x.fillStyle='rgba(205,175,90,.8)';x.beginPath();x.arc(px,py,5,0,7);x.fill()}
  for(let i=0;i<420;i++){const vx=r()*W,vy=r()*H;x.fillStyle='rgba(205,175,90,.85)';x.beginPath();x.arc(vx,vy,4.5,0,7);x.fill();x.fillStyle='#0f2f26';x.beginPath();x.arc(vx,vy,1.8,0,7);x.fill()}
  x.fillStyle='rgba(235,240,235,.8)';x.font='600 17px Consolas,monospace';
  for(let i=0;i<90;i++)x.fillText(['C','R','L','U','Q','D','J'][r()*7|0]+(100+(r()*890|0)),r()*(W-60),20+r()*(H-30));
  x.font='600 26px Consolas,monospace';x.fillText('HP PROBOOK 445 G10   6050A3xxxxxx-MB-A01   REV:A',60,H-30);
  for(const[hx,hy]of[[90,90],[W-90,90],[90,H-90],[W-90,H-90],[W/2,H/2+60],[W*.75,H*.35]]){x.strokeStyle='rgba(205,175,90,.9)';x.lineWidth=7;x.beginPath();x.arc(hx,hy,22,0,7);x.stroke();x.fillStyle='#0c1512';x.beginPath();x.arc(hx,hy,12,0,7);x.fill()}
  return tex(c)}
function batteryTex(wh){return labelTex(1536,310,(x,w,h)=>{x.fillStyle='#232830';x.fillRect(0,0,w,h);for(let i=1;i<3;i++){x.fillStyle='rgba(0,0,0,.4)';x.fillRect(i*w/3-2,0,4,h)}
  x.fillStyle='#e9edf1';x.font='700 56px system-ui,sans-serif';x.fillText('hp',40,80);x.font='600 32px system-ui,sans-serif';x.fillText('Long Life Notebook Battery',130,76);
  x.font='500 24px system-ui,sans-serif';x.fillText('Li-ion polymer  11.55 V  3-cell  '+wh+' Wh  Rechargeable',40,130);x.fillText('Model HSN-Q36C · Made in China · Do not disassemble, crush or dispose of in fire',40,166);
  for(let i=0;i<64;i++)x.fillRect(780+i*10+((i*7)%5),190,2+(i%3),80);x.font='500 22px Consolas,monospace';x.fillText('SN 4K7P2201A   M73472-005',780,296);
  x.strokeStyle='#e9edf1';x.lineWidth=3;x.strokeRect(40,196,230,84);x.font='600 28px system-ui,sans-serif';x.fillText('CE   UL   FC   RoHS',54,248)})}
function fanBlade(){const s=new THREE.Shape(),N=8,r0=.13,r1=.4,sw=.55,da=.1,P=[],Q=[];
  for(let i=0;i<=N;i++){const t=i/N,r=r0+(r1-r0)*t,a=sw*t;P.push([Math.cos(a)*r,Math.sin(a)*r]);Q.push([Math.cos(a+da)*(r+.012),Math.sin(a+da)*(r+.012)])}
  s.moveTo(P[0][0],P[0][1]);for(let i=1;i<=N;i++)s.lineTo(P[i][0],P[i][1]);for(let i=N;i>=0;i--)s.lineTo(Q[i][0],Q[i][1]);s.closePath();
  return new THREE.ExtrudeGeometry(s,{depth:.075,bevelEnabled:false}).rotateX(-Math.PI/2).translate(0,-.0375,0)}

/* ------------------------------------------------------------------ textures */
function bootTexture(){const cv=canvas(1280,720),x=cv.getContext('2d');x.fillStyle='#030303';x.fillRect(0,0,1280,720);
  const sk=.36,bar=(cx,y0,y1,w)=>{x.beginPath();x.moveTo(cx-sk*y0-w/2,y0);x.lineTo(cx-sk*y0+w/2,y0);x.lineTo(cx-sk*y1+w/2,y1);x.lineTo(cx-sk*y1-w/2,y1);x.closePath();x.fill()};
  x.fillStyle='#f2f2f2';x.save();x.translate(640,222);
  bar(-34,-46,40,15);bar(-6,-6,40,15);x.beginPath();x.moveTo(-34-sk*(-6)+7.5-1,-6);x.lineTo(-6-sk*-6-7.5,-6);x.lineTo(-6-sk*-6-7.5+6,-20);x.lineTo(-34-sk*(-20)+7.5,-20);x.closePath();x.fill();
  bar(26,-6,66,15);bar(58,-6,22,15);x.beginPath();x.moveTo(26+sk*6+7.5,-6);x.lineTo(58+sk*6-7.5,-6);x.lineTo(58+sk*20-7.5,-20);x.lineTo(26+sk*20+7.5,-20);x.closePath();x.fill();
  x.restore();
  x.fillStyle='#e8e8e8';x.font='600 11px system-ui,sans-serif';x.textAlign='center';x.letterSpacing='2px';x.fillText('PROTECTED BY',640,412);
  x.save();x.translate(640,468);x.strokeStyle='#eee';x.lineWidth=3;x.beginPath();x.moveTo(0,-34);x.lineTo(30,-17);x.lineTo(30,17);x.lineTo(0,34);x.lineTo(-30,17);x.lineTo(-30,-17);x.closePath();x.stroke();
  x.fillStyle='#eee';x.beginPath();x.moveTo(-19,-17);x.lineTo(-8,-10);x.lineTo(8,-10);x.lineTo(19,-17);x.lineTo(16,2);x.lineTo(7,16);x.lineTo(0,20);x.lineTo(-7,16);x.lineTo(-16,2);x.closePath();x.fill();
  x.fillStyle='#030303';x.beginPath();x.moveTo(-11,-2);x.lineTo(-4,0);x.lineTo(-7,4);x.closePath();x.fill();x.beginPath();x.moveTo(11,-2);x.lineTo(4,0);x.lineTo(7,4);x.closePath();x.fill();x.beginPath();x.moveTo(-3,12);x.lineTo(3,12);x.lineTo(0,16);x.closePath();x.fill();
  x.restore();
  x.fillStyle='#e8e8e8';x.font='600 10px system-ui,sans-serif';x.letterSpacing='1.5px';x.fillText('HP WOLF SECURITY',640,522);
  const T=tex(cv),im=new Image();im.onload=()=>{x.setTransform(1,0,0,1,0,0);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.fillStyle='#000';x.fillRect(0,0,1280,720);const h=720*.56;x.drawImage(im,640-h/2,(720-h)/2,h,h);T.needsUpdate=true};im.src=ASSET+'hp-wolf-security-splash-screen-v0-tj7bmxk3ev7h1.webp';return T}
function screenTexture(){return bootTexture()}
function usbcTex(){const cv=canvas(256,128),x=cv.getContext('2d');
  const st=(px,py,w,h,col)=>{x.fillStyle=col;x.beginPath();x.roundRect(px,py,w,h,h/2);x.fill()};
  st(4,10,248,108,'#cfd3d7');st(14,20,228,88,'#0a0b0c');st(46,56,164,16,'#3a3d41');return tex(cv)}


function logoOfficial(){const cv=canvas(512,512),x=cv.getContext('2d');const T=tex(cv);
  const g=x.createLinearGradient(0,0,512,512);g.addColorStop(0,'#fafbfc');g.addColorStop(.4,'#9aa3ab');g.addColorStop(.7,'#eef1f3');g.addColorStop(1,'#858e96');
  x.fillStyle=g;x.beginPath();x.arc(256,256,248,0,7);x.fill();
  const im=new Image();im.onload=()=>{const t=document.createElement('canvas');t.width=t.height=512;const c=t.getContext('2d');c.drawImage(im,0,0,512,512);
    const d=c.getImageData(0,0,512,512),p=d.data;
    for(let i=0;i<p.length;i+=4){const px=(i/4)%512,py=((i/4)/512)|0;const a=Math.max(0,Math.min(1,(p[i+2]-p[i])/170));
      const k=.5+.5*Math.sin((px+py)/512*Math.PI*1.4+.5),v=Math.round(150+95*k);p[i]=v;p[i+1]=v+3;p[i+2]=v+6;p[i+3]=Math.round(a*255)}
    x.clearRect(0,0,512,512);x.putImageData(d,0,0);T.needsUpdate=true};im.src=ASSET+'hp-logo.png';pending.push(new Promise(r=>{im.addEventListener('load',r);im.addEventListener('error',r)}));return T}

/** The lid's HP mark as a pure shape mask (white, alpha = logo) so it can take a mirror-chrome material. */
function logoMirror(){const cv=canvas(512,512),x=cv.getContext('2d');const T=tex(cv);
  const im=new Image();im.onload=()=>{const t=document.createElement('canvas');t.width=t.height=512;const c=t.getContext('2d');c.drawImage(im,0,0,512,512);
    const d=c.getImageData(0,0,512,512),p=d.data;
    for(let i=0;i<p.length;i+=4){const q=Math.max(0,Math.min(1,((p[i+2]-p[i])/170-.2)/.5)),a=q*q*(3-2*q);const n=i>>2,u=((n%512)+((n/512)|0))/1024,b=62+150*Math.exp(-(((u-.55)/.11)**2))+25*(1-u);p[i]=Math.min(255,b*(1-.14*(1-u)));p[i+1]=Math.min(255,b*(1-.06*(1-u)));p[i+2]=Math.min(255,b);p[i+3]=Math.round(a*255)}
    x.clearRect(0,0,512,512);x.putImageData(d,0,0);T.needsUpdate=true};im.src=ASSET+'hp-logo.png';pending.push(new Promise(r=>{im.addEventListener('load',r);im.addEventListener('error',r)}));return T}

function logoTexture(){const cv=canvas(256,256),x=cv.getContext('2d');x.strokeStyle='rgba(235,240,245,.9)';x.lineWidth=10;x.beginPath();x.arc(128,128,100,0,Math.PI*2);x.stroke();
  x.fillStyle='rgba(235,240,245,.9)';x.font='italic 700 108px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('hp',128,136);return tex(cv)}

/* keyboard: 15u main block, ANSI-style, with HP power key and inverted-T arrows */
const KW=5.71,KD=2.0,KZC=-.4475,KU=.347;
/* 14" HP keyboard, measured from the reference photo: a 14.8u main block + 0.1u gap + 1u right-hand column (delete/home/pg up/pg dn/end/right-arrow) */
function keyLayout(lay){
  const u=KU,gap=.018,keys=[],x0=-7.95*u,de=lay==='de';
  const L=t=>t.split('').map(c=>[c,1]);
  const F=['esc','f1','f2','f3','f4','f5','f6','f7','f8','f9',de?'einfg':'insert','f11','f12',de?'druck':'prt scr','pwr'].map(l=>[l,14.8/15]);
  const rows=[
    {z:-1.3287,h:.205,k:[...F,['skip',.1],[de?'entf':'delete',1]]},
    {z:-1.0547,h:.315,k:[...L(de?'^1234567890ß´':'`1234567890-='),['backspace',1.8],['skip',.1],[de?'pos1':'home',1]]},
    {z:-.7097,h:.315,k:de?[['tab',1.45],...L('qwertzuiopü+'),['skip',1.35],['skip',.1],['bild ↑',1]]:[['tab',1.45],...L('qwertyuiop[]'),['\\',1.35],['skip',.1],['pg up',1]]},
    {z:-.3695,h:.315,k:de?[['caps lock',1.7],...L('asdfghjklöä#'),['skip',1.1],['skip',.1],['bild ↓',1]]:[['caps lock',1.7],...L("asdfghjkl;'"),['enter',2.1],['skip',.1],['pg dn',1]]},
    {z:-.0199,h:.315,k:de?[['shift',1.2],...L('<yxcvbnm,.-'),['shift',2.6],['skip',.1],['ende',1]]:[['shift',2.15],...L('zxcvbnm,./'),['shift',2.65],['skip',.1],['end',1]]},
    {z:.3298,h:.315,k:[['ctrl',1.15],['fn',1.1],['win',1.05],['alt',1],['',5],['alt gr',1.05],['menu',.95],['ctrl',1],['left',1.05],['updown',1.45],['skip',.1],['right',1]]}];
  for(const r of rows){let x=x0;for(const [l,w] of r.k){const cx=x+w*u/2,kw=w*u-gap;if(l==='skip'){x+=w*u;continue}
    if(l==='updown'){keys.push({x:cx,z:r.z-.077,w:kw,h:.152,l:'up'},{x:cx,z:r.z+.077,w:kw,h:.152,l:'down'})}
    else keys.push({x:cx,z:r.z,w:kw,h:r.h,l});x+=w*u}}
  if(de)keys.push({x:x0+(13.7+.55)*u,z:-.5397,w:1.1*u-gap,h:.66,l:'enter'});
  return keys}
function keyboardTexture(keys,lit){
  const S0=400,S=480,cv=canvas(KW*S,KD*S),x=cv.getContext('2d'),FONT='system-ui,"Segoe UI Symbol","Segoe UI",sans-serif';
  const de=keys.some(k=>k.l==='ß'),col=lit?'#7fc6ff':'#e3e6e9';
  x.scale(S/S0,S/S0);x.textBaseline='middle';x.fillStyle=x.strokeStyle=col;x.lineWidth=5;x.lineCap='round';x.lineJoin='round';
  const SH=de?{'^':'°','1':'!','2':'"','3':'§','4':'$','5':'%','6':'&','7':'/','8':'(','9':')','0':'=','ß':'?','´':'`','+':'*','#':"'",',':';','.':':','-':'_','<':'>'}
    :{'`':'~','1':'!','2':'@','3':'#','4':'$','5':'%','6':'^','7':'&','8':'*','9':'(','0':')','-':'_','=':'+',';':':',"'":'"',',':'<','.':'>','/':'?','[':'{',']':'}','\\':'|'};
  const WORD={'esc':'esc','tab':'tab','caps lock':de?'feststell':'caps lock','ctrl':de?'strg':'ctrl','fn':'fn','alt':'alt','alt gr':'alt gr','prt scr':'prt scr','druck':'druck','delete':'delete','entf':'entf','home':'home','end':'end','pos1':'pos1','ende':'ende','pg up':'pg up','pg dn':'pg dn','bild ↑':'bild ↑','bild ↓':'bild ↓','backspace':'backspace','enter':'enter'};
  const icon=(id,cx,cy)=>{x.save();x.lineWidth=4;
    const sun=(r,n,len)=>{x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();for(let i=0;i<n;i++){const a=i*Math.PI*2/n;x.beginPath();x.moveTo(cx+Math.cos(a)*(r+5),cy+Math.sin(a)*(r+5));x.lineTo(cx+Math.cos(a)*(r+5+len),cy+Math.sin(a)*(r+5+len));x.stroke()}};
    const spk=()=>{x.beginPath();x.moveTo(cx-18,cy-6);x.lineTo(cx-10,cy-6);x.lineTo(cx-2,cy-14);x.lineTo(cx-2,cy+14);x.lineTo(cx-10,cy+6);x.lineTo(cx-18,cy+6);x.closePath();x.stroke()};
    const arc=(r)=>{x.beginPath();x.arc(cx-2,cy,r,-.9,.9);x.stroke()};
    const mic=(ox)=>{x.beginPath();x.arc(cx+ox,cy-6,5,Math.PI,0);x.lineTo(cx+ox+5,cy+3);x.arc(cx+ox,cy+3,5,0,Math.PI);x.closePath();x.stroke();x.beginPath();x.arc(cx+ox,cy+3,10,0,Math.PI);x.stroke();x.beginPath();x.moveTo(cx+ox,cy+13);x.lineTo(cx+ox,cy+18);x.stroke()};
    if(id==='f1'){x.strokeRect(cx-17,cy-9,34,18);x.strokeRect(cx-10,cy-4,20,8)}
    else if(id==='f2')sun(4,8,3);else if(id==='f3')sun(7,8,5);
    else if(id==='f4'){for(let i=0;i<4;i++){const a=i*Math.PI/4;x.beginPath();x.moveTo(cx-Math.cos(a)*13,cy-Math.sin(a)*13);x.lineTo(cx+Math.cos(a)*13,cy+Math.sin(a)*13);x.stroke()}}
    else if(id==='f5'){mic(0);x.beginPath();x.moveTo(cx-14,cy+14);x.lineTo(cx+14,cy-14);x.stroke()}
    else if(id==='f6'){spk();arc(8)}
    else if(id==='f7'){spk();arc(8);arc(15)}
    else if(id==='f8')mic(0);
    else if(id==='f9'){x.strokeRect(cx-17,cy-3,34,16);for(let i=-1;i<=1;i++){x.beginPath();x.moveTo(cx+i*10,cy-12);x.lineTo(cx+i*10,cy-7);x.stroke()}}
    else if(id==='f11'){x.font='500 34px '+FONT;x.textAlign='center';x.fillText('✈',cx,cy+1)}
    else if(id==='f12'){x.beginPath();x.arc(cx,cy,5,0,7);x.stroke();for(const r of[11,17]){x.beginPath();x.arc(cx,cy,r,-.9,.9);x.stroke();x.beginPath();x.arc(cx,cy,r,Math.PI-.9,Math.PI+.9);x.stroke()}}
    x.restore()};
  for(const k of keys){const px=(k.x+KW/2)*S0,py=(k.z-(KZC-KD/2))*S0,l=k.l,hw=k.w*S0/2,hh=k.h*S0/2,tl=px-hw+14,tt=py-hh+22;if(!l)continue;
    x.textAlign='left';
    if(l==='pwr'){x.beginPath();x.arc(px,py+2,13,-Math.PI*.35,Math.PI*1.35);x.stroke();x.beginPath();x.moveTo(px,py-14);x.lineTo(px,py);x.stroke();continue}
    if(['left','right','up','down'].includes(l)){x.beginPath();
      if(l==='left'){x.moveTo(px+7,py-14);x.lineTo(px-7,py);x.lineTo(px+7,py+14)}
      else if(l==='right'){x.moveTo(px-7,py-14);x.lineTo(px+7,py);x.lineTo(px-7,py+14)}
      else if(l==='up'){x.moveTo(px-14,py+5);x.lineTo(px,py-6);x.lineTo(px+14,py+5)}
      else{x.moveTo(px-14,py-5);x.lineTo(px,py+6);x.lineTo(px+14,py-5)}
      x.stroke();continue}
    if(l==='win'){for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]])x.fillRect(px+(a>0?2:-14),py+(b>0?2:-14),12,12);continue}
    if(l==='menu'){x.strokeRect(px-14,py-14,28,28);for(const o of[-6,0,6]){x.beginPath();x.moveTo(px-8,py+o);x.lineTo(px+8,py+o);x.stroke()}continue}
    if(/^f\d+$/.test(l)){x.font='500 18px '+FONT;x.fillText(l,tl,tt-2);icon(l,px,py+4);continue}
    if(l==='insert'||l==='einfg'){x.font='500 18px '+FONT;x.fillText('f10',tl,tt-2);x.font='500 20px '+FONT;x.textAlign='center';x.fillText(l,px,py+4);continue}
    if(l==='shift'){x.font='500 22px '+FONT;x.fillText(k.x<0?'shift ⇧':'⇧ shift',tl,tt);continue}
    if(l==='enter'){x.font='500 22px '+FONT;x.fillText('enter',tl,tt);x.font='500 30px '+FONT;x.fillText('↵',px+hw-52,py+hh*.45);continue}
    if(l==='backspace'){x.font='500 22px '+FONT;x.fillText('backspace',tl,tt);x.font='500 30px '+FONT;x.fillText('←',tl,py+hh*.45);continue}
    if(WORD[l]){x.font=(k.h<.3?'500 20px ':'500 22px ')+FONT;x.fillText(WORD[l],tl,k.h<.3?py:tt);continue}
    if(SH[l]){x.font='500 31px '+FONT;x.fillText(SH[l],tl,tt+2);x.font='500 38px '+FONT;x.fillText(l,tl,py+hh*.38);continue}
    x.font='500 50px '+FONT;x.textAlign='center';x.fillText(l.toUpperCase(),px,py+3)}
  return tex(cv)}
/* ------------------------------------------------------------------ part registry */
function reg(o){(o.parent||root).add(o.g);o.off=o.off||[0,0,0];if(!o.parent)o.g.scale.set(6.4/W,KY,4.13/D);parts.push(o);return o}
function finalize(){
  for(const p of parts){p.g.traverse(o=>{if(!o.isMesh)return;o.material=o.material.clone();const m=o.material;
    m.userData={tr0:m.transparent,op0:m.opacity,dw0:m.depthWrite};o.castShadow=!m.transparent;o.receiveShadow=true;o.userData.part=p})}
}

/* ------------------------------------------------------------------ builders */
function buildBottom(c){
  const b=BAT[c.bat],g=new THREE.Group();
  g.add(plateMesh(MT.silver2));
  g.add(skirt(notchedDeck(0,PCZ,2*PHW,PZ1-PZ0,.15,5.0,0),()=>.02,notchedDeck(0,0,W,D,.2,5.0,.25),YOUT,MT.silver2));
  g.add(skirt(notchedDeck(0,0,W,D,.2,5.0,.25),YOUT,notchedDeck(0,0,W,D,.2,5.0,.25),YS,MT.silver2));
  
  // vent: 4.0 × 1.04 units, centred 68 mm from the rear (guide p.14)
  const vc=canvas(1024,224),vx=vc.getContext('2d');vx.fillStyle='#aeb2b7';vx.fillRect(0,0,1024,224);vx.fillStyle='#14171a';
  for(let r=0;r<19;r++)for(let k=0;k<74;k++){vx.beginPath();vx.arc(8+k*13.8+(r%2?6.9:0),8+r*11.9,3.3,0,7);vx.fill()}
  const vt=tex(vc);
  g.add(label(new THREE.Mesh(drape(new THREE.PlaneGeometry(4.36,.93,1,20).rotateX(Math.PI/2).translate(0,0,-.8)),new THREE.MeshStandardMaterial({map:vt,metalness:.3,roughness:.55})),'Bottom vent — perforated grille, airflow for internal cooling'));
  const lc=canvas(640,80),lx=lc.getContext('2d');lx.fillStyle='rgba(0,0,0,0)';lx.clearRect(0,0,640,80);lx.fillStyle='rgba(78,84,90,.75)';lx.font='500 17px system-ui,sans-serif';lx.textBaseline='middle';
  lx.fillText('CE   \u2612   FC      HP ProBook 445 G10 · Notebook PC      Made in China',10,26);lx.fillText('Regulatory model HSN-Q36C · 19 V ⎓ 3.42 A · 65 W',10,54);
  g.add(label(new THREE.Mesh(drape(new THREE.PlaneGeometry(1.5,.19,1,2).rotateX(Math.PI/2).translate(-.45,0,1.5)),new THREE.MeshBasicMaterial({map:tex(lc),transparent:true,depthWrite:false})),'Printed regulatory markings'));
  const rub=std(0x3b3c3f,.2,.65);
  const strip=(w,d,z)=>drape(new THREE.PlaneGeometry(w,d,1,8).rotateX(Math.PI/2).translate(0,0,z));
  g.add(label(new THREE.Mesh(mergeGeometries([strip(6.0,.14,-1.65),strip(5.9,.12,1.71)]),rub),'Rubber strips (front and rear)'));
  const s=[];for(const[x,z]of[[-2.78,-1.5],[0,-1.5],[2.78,-1.5],[-.83,.55],[.83,.55]])s.push(cylG(.05,.014,x,bU(z)-.006,z,'y',16));
  g.add(label(merge(s,MT.steel),'Five captive Phillips screws'));
  return reg({id:'bottom',name:'Bottom cover',cat:'Base',tag:'CSR',pn:b.cover,g,off:[0,-1.35,0],pg:'38–39',
    desc:`Aluminium lower enclosure for ${b.cname} models. 5 captive screws; the underside vent is ~200 × 52 mm.`,
    svc:'<b>Remove:</b> loosen the five captive Phillips screws, then pry the edges loose with a non-marking, non-conductive tool starting near the hinges. Reverse to install.'})}

function buildBattery(c){
  const b=BAT[c.bat],[w]=b.size,h=.1,d=.9,cx=.1,cz=.95,y=.27,g=new THREE.Group();
  g.add(slabXZ(rrShape(cx,cz,w,d,.06),h,y-h/2,MT.batt,.012));
  g.add(flat(w-.12,d-.12,cx,y+h/2+.0135,cz,batteryTex(c.bat),{roughness:.55,metalness:.05}));
  const cab=tube([[cx-1.7,y+.02,cz-.7],[cx-1.8,y+.1,cz-.9],[cx-1.9,.24,cz-1.1]],.035,MT.black);g.add(cab);g.add(box(.22,.04,.1,cx-1.9,.24,cz-1.1,MT.white));
  return reg({id:'battery',name:`Battery — 3-cell ${c.bat} Whr`,cat:'Power',tag:'ASP',pn:b.pn,g,off:[0,-.62,.25],pg:'48–50',
    desc:`HP Long Life Li-ion pack with HP fast charge. Six M2.0×4.0 screws secure it. `+(c.bat==='51'?'The 51 Whr pack pairs with fan N00095-001 and cover N00121-001.':'The 42 Whr pack pairs with fan M21718-001 and cover N38996-001.'),
    svc:'<b>Remove:</b> remove the bottom cover → disconnect the battery cable from the system board → remove 6 × Phillips M2.0×4.0 screws. Never touch the connector with metal tools. When refitting, plug in the battery cable <i>before</i> replacing screws.'})}

function buildBoard(c){
  const cpu=CPU[c.cpu],g=new THREE.Group();
  g.add(slabXZ(rrShape(0,-.675,5.6,2.55,.1),.025,.2775,MT.pcb));
  const avoid=[[-2.7,-1.1,-.4,.3],[-1.2,.3,-.4,.3],[.25,2.05,-.4,.3],[-.95,.55,-1.6,-.4],[1.05,2.45,-1.55,-.3],[-2.8,-1.9,-1.85,-1.15],[1.8,2.6,.05,.5]];
  g.add(flat(5.58,2.53,0,.3028,-.675,pcbTexture(),{roughness:.42,metalness:.15}));
  {const av=avoid.concat([[-2.6,.3,.1,.32],[.2,.4,-.3,.2],[1.8,1.95,.1,.5],[-2.1,-1.9,-1.7,-1.3],[-2.8,-2.3,.8,.9],[2.75,3.2,-2,.6]]);
   const free=(x,z,w,d)=>!av.some(a=>x+w/2>a[0]&&x-w/2<a[1]&&z+d/2>a[2]&&z-d/2<a[3]);
   const rr=rndFrom(31),dark=[],tan=[],body=[],caps=[],ind=[],yb=.3028+.006;
   for(let i=0;i<560;i++){const x=-2.7+rr()*5.4,z=-1.85+rr()*2.35,rot=rr()<.5,w=rot?.03:.05,d=rot?.05:.03;if(!free(x,z,w,d))continue;(rr()<.55?dark:tan).push(bx(w,.012,d,x,yb,z))}
   for(let i=0,n=0;i<200&&n<16;i++){const x=-2.7+rr()*5.4,z=-1.85+rr()*2.35;if(!free(x,z,.12,.12))continue;n++;body.push(cylG(.045,.05,x,.3028+.025,z,'y',20));caps.push(cylG(.04,.004,x,.3028+.052,z,'y',20))}
   for(let i=0,n=0;i<200&&n<10;i++){const x=-2.7+rr()*5.4,z=-1.85+rr()*2.35;if(!free(x,z,.16,.16))continue;n++;ind.push(bx(.14,.07,.14,x,.3028+.035,z))}
   if(dark.length)g.add(merge(dark,std(0x17191b,.1,.6)));if(tan.length)g.add(merge(tan,std(0x9a7d50,.35,.45)));
   if(body.length){g.add(merge(body,std(0x1c2024,.3,.5)));g.add(merge(caps,MT.steel))}
   if(ind.length)g.add(label(merge(ind,std(0x2c2f33,.5,.4)),'Inductors / power chokes'))}
  g.add(merge(chipsOn(0,avoid,.2715,34,7,false),MT.chip));g.add(merge(chipsOn(0,avoid,.309,46,11,true),MT.chip));
  g.add(label(box(.62,.02,.62,-.2,.2675,-1,MT.pcb2),`${cpu.name} (BGA, soldered) — ${cpu.spec}`));
  g.add(label(box(.3,.012,.3,-.2,.2525,-1,MT.steel),`${cpu.name} die — ${cpu.spec}`));
  const slots=[];for(let i=0;i<2;i++)slots.push(bx(1.4,.045,.08,-1.85+i*1.4,.255,.21));
  g.add(label(merge(slots,MT.black),'SODIMM sockets ×2 (DDR4-3200, dual-channel, up to 32 GB)'));
  g.add(label(box(.1,.04,.4,.3,.255,-.05,MT.black),'M.2 2280 socket (primary SSD)'));
  g.add(label(box(.08,.04,.4,1.86,.255,.3,MT.black),'M.2 2230 socket (second SSD)'));
  g.add(label(box(.08,.04,.4,-2.0,.255,-1.5,MT.black),'M.2 socket (WLAN)'));
  g.add(label(box(.4,.04,.08,-2.55,.255,.84,MT.black),'M.2 socket (WWAN)'));
  const zif=[],fl=[];for(const[x,z]of[[-.5,.5],[.4,.5],[1.1,.52],[-1.2,-1.85],[1.0,-1.75],[2.2,-.9],[-2.65,.1]]){zif.push(bx(.28,.03,.07,x,.262,z));fl.push(bx(.28,.012,.05,x,.246,z))}
  g.add(label(merge(zif,MT.zif),'ZIF connectors — touchpad, keyboard, display, fingerprint, USB board cables'));g.add(merge(fl,MT.flap));
  const R=[['USB SuperSpeed 5 Gbps',-.77,.23,.155,.258],['USB SuperSpeed 5 Gbps with HP Sleep and Charge',-1.08,.23,.155,.258],['USB Type-C — power in, 10 Gbps, DisplayPort out',-1.42,.2,.117,.245],['HDMI 2.1',-.45,.27,.135,.262]];
  for(const[t,z,zl,yl,y]of R){g.add(label(box(.4,yl,zl,2.99,y,z,MT.steel),t));g.add(box(.01,yl*.7,zl*.85,3.185,y,z,MT.black))}
  g.add(label(rcyl(.06,.4,2.99,.252,-.25,MT.steel),'Audio-out / audio-in combo jack'));
  g.add(label(rcyl(.013,.02,3.17,.25,-1.65,MT.led),'Battery light — white >90%, amber 0–90%'));
  return reg({id:'board',name:'System board',cat:'Main board & cooling',tag:'ASP',pn:(()=>{const p=cpu.pn,k=c.wwan?'wwan':(c.cam==='ir'?'ir':'base');return (p[k]||p.base)+' (-001 / -601 Windows)'})(),g,off:[0,.72,0],pg:'56–58',
    desc:`${cpu.name} — ${cpu.spec}. Integrated Radeon graphics; processor is soldered. Carries 2 SODIMM sockets, M.2 sockets and the right-side ports (SIM, audio, HDMI, 2× USB-A, USB-C). Kit includes replacement thermal material.`+(c.cpu==='r3'&&(c.wwan||c.cam==='ir')?' <b>Note:</b> the guide lists no Ryzen 3 board with WWAN or 5 MP IR.':''),
    svc:'<b>Remove:</b> bottom cover, battery, fan first. Disconnect antenna, power, speaker, display, USB, touchpad, keyboard, backlight and fingerprint cables — <b>never disconnect the RTC cable</b>. Remove the port bracket (3 × M2.5×4.0), then 2 × M2.0×2.5 screws, lift the side and slide out. Transfer memory, WLAN/WWAN, SSD and heat sink to the new board.'})}

function ramModule(cx,gb){const g=new THREE.Group(),y=.248,cz=-.05;
  g.add(box(1.35,.018,.42,cx,y,cz,MT.ram));
  const ch=[],faces=[];for(let i=0;i<8;i++){const x=cx-.55+i*.157;ch.push(bx(.13,.02,.1,x,y+.019,cz-.05));faces.push([x,y+.029+.0006,cz-.05,.13,.1]);if(gb>=8)ch.push(bx(.13,.02,.1,x,y-.019,cz-.05))}
  g.add(merge(ch,MT.chip));g.add(chipFaces(faces,chipFace('K4A8G085WC','DDR4  BCTD')));
  const fing=[];for(let i=0;i<60;i++)fing.push(bx(.01,.019,.05,cx-.6+i*.02,y,cz+.2));g.add(merge(fing,MT.gold));
  g.add(box(.012,.02,.06,cx+.02,y,cz+.2,std(0x1b1d20,.1,.6))); // key notch
  g.add(flat(.5,.16,cx+.2,y+.0345,cz+.07,labelTex(640,200,(x,w,h)=>{x.fillStyle='#eef1f3';x.fillRect(0,0,w,h);x.fillStyle='#1a1d21';x.font='700 36px system-ui,sans-serif';x.fillText('hp  '+gb+'GB',24,56);x.font='500 24px Consolas,monospace';x.fillText('1Rx8 PC4-3200AA-SA2-11',24,100);x.fillText('DDR4 SO-DIMM  1.2V',24,136);for(let i=0;i<40;i++)x.fillRect(380+i*6+((i*5)%4),150,2+(i%2),38)}),{roughness:.6}));
  return g}
function buildRam(c){const r=RAM[c.ram];
  for(let i=0;i<r.n;i++)reg({id:'ram'+(i+1),name:`Memory module ${i+1} — ${r.gb} GB DDR4-3200`,cat:'Memory & storage',tag:'CSR',pn:r.pn,g:ramModule(-1.85+i*1.4,r.gb),off:[0,.42-i*.05,.25],pg:'40–41',
    desc:`${r.gb} GB DDR4-3200 SODIMM. The board has two customer-accessible slots (dual-channel); max 32 GB.`,
    svc:'<b>Remove:</b> bottom cover → disconnect battery cable → lift the protective shield → spread the two retention clips until the module tilts up at 45° → pull it out by the edges. When installing, press down on <b>both sides</b> until the clips snap.'})}

function ssdModule(cx,cz,len,col){const g=new THREE.Group(),y=.25;g.add(box(len,.015,.44,cx,y,cz,col));
  const h=len/1.6;g.add(box(.26*h,.014,.26,cx-len/2+.5*h,y+.014,cz,MT.chip));g.add(merge([bx(.4*h,.016,.3,cx+.05*h,y+.015,cz),bx(.4*h,.016,.3,cx+.5*h,y+.015,cz)],MT.chip));
  g.add(chipFaces([[cx-len/2+.5*h,y+.021+.0006,cz,.26*h,.26]],chipFace('SM2267','NVMe  PCIe 4.0')));
  g.add(chipFaces([[cx+.05*h,y+.023+.0006,cz,.4*h,.3],[cx+.5*h,y+.023+.0006,cz,.4*h,.3]],chipFace('3D TLC NAND','512Gb  FBGA')));
  g.add(flat(len*.55,.34,cx+.1*h,y+.0275,cz,labelTex(520,200,(x,w,h2)=>{const gr=x.createLinearGradient(0,0,w,h2);gr.addColorStop(0,'#d9dde1');gr.addColorStop(.5,'#f1f3f5');gr.addColorStop(1,'#c9ced3');x.fillStyle=gr;x.fillRect(0,0,w,h2);x.fillStyle='#1b1e22';x.font='700 38px system-ui,sans-serif';x.fillText('NVMe SSD',24,60);x.font='500 24px Consolas,monospace';x.fillText('M.2 2280  PCIe 4.0 x4',24,100);x.fillText('P/N '+(len>1?'N45476-001':'M11042-001'),24,134);for(let i=0;i<44;i++)x.fillRect(300+i*5+((i*3)%4),140,2+(i%2),40)}),{metalness:.35,roughness:.4}));
  const f=[];for(let i=0;i<22;i++)f.push(bx(.012,.016,.1,cx-len/2+.04,y,cz-.2+i*.019));g.add(merge(f,MT.gold));return g}
function buildSsd(c){
  reg({id:'ssd',name:`Primary SSD — M.2 2280 NVMe (${c.ssd==='1024'?'1 TB':c.ssd+' GB'})`,cat:'Memory & storage',tag:'CSR',pn:SSD[c.ssd],g:ssdModule(1.15,-.05,1.6,MT.ssd),off:[0,.28,.55],pg:'45–47',
    desc:'PCIe 4×4 NVMe, M.2 2280. Spec sheet: up to 2150 MB/s sequential read, 1550 MB/s write, 50.8 × 28.9 × 1.0 mm (guide p.84).',
    svc:'<b>Remove:</b> bottom cover → disconnect battery cable → remove 1 × Phillips M2.0×2.5 screw → pull the drive straight out of the socket. The notch prevents wrong-way insertion.'});
  if(c.ssd2!=='none')reg({id:'ssd2',name:`Second SSD — M.2 2230 (${c.ssd2} GB)`,cat:'Memory & storage',tag:'CSR',pn:SSD2[c.ssd2],g:ssdModule(2.2,.3,.6,MT.ssd),off:[.3,.34,.7],pg:'45–47',
    desc:'Optional secondary M.2 2230 NVMe drive. A solid-state drive support kit (N00354-001) is available.',svc:'<b>Remove:</b> same procedure as the primary SSD — one M2.0×2.5 screw, then pull from the socket.'})}

function buildWlan(c){const w=WLAN[c.wlan],g=new THREE.Group(),y=.25,cx=-2.35,cz=-1.5;
  g.add(box(.6,.012,.44,cx,y,cz,MT.pcb));g.add(box(.4,.02,.32,cx-.05,y+.014,cz,MT.steel));
  g.add(cyl(.016,.014,cx+.22,y+.01,cz-.12,MT.gold));g.add(cyl(.016,.014,cx+.22,y+.01,cz+.12,MT.gold));
  g.add(tube([[cx+.22,y+.02,cz-.12],[cx+.4,y+.03,cz-.3],[cx+.3,y+.03,cz-.5]],.012,MT.white));g.add(tube([[cx+.22,y+.02,cz+.12],[cx+.45,y+.03,cz-.2],[cx+.4,y+.03,cz-.5]],.012,MT.black));
  reg({id:'wlan',name:'WLAN module',cat:'Wireless',tag:'CSR',pn:w.pn,g,off:[-.3,.3,-.4],pg:'42–43',
    desc:`${w.name}. Two antenna leads (white = #1 Main, black = #2 Aux). Only a module authorised in your country should be fitted.`,
    svc:'<b>Remove:</b> bottom cover → disconnect battery cable → remove antenna cover plastic → unclip both antenna cables → remove 1 × M2.0×2.5 screw → slide the module out. Fit protective sleeves on unused antenna leads.'})}
function buildWwan(c){if(!c.wwan)return;const g=new THREE.Group(),y=.25,cx=-2.55,cz=1.3;
  g.add(box(.6,.012,.84,cx,y,cz,MT.pcb));g.add(box(.46,.02,.62,cx,y+.014,cz+.04,MT.steel));g.add(cyl(.016,.014,cx-.15,y+.01,cz-.38,MT.gold));g.add(cyl(.016,.014,cx+.15,y+.01,cz-.38,MT.gold));
  reg({id:'wwan',name:'WWAN module — Intel XMM 7560 R LTE-A Pro (Cat 16)',cat:'Wireless',tag:'CSR',pn:'N00182-001',g,off:[-.5,.34,.5],pg:'44–45',
    desc:'4G LTE Cat 16 with GPS (Fibocom), eSIM support, two antennas in the display top. SIM slot on the right edge.',
    svc:'<b>Remove:</b> bottom cover → disconnect battery cable → remove antenna cover → unclip WWAN antenna cables (match numbers on cable and module) → remove 1 × M2.0×2.5 screw → pull the module out at an angle.'})}

function buildFan(c){const b=BAT[c.bat],cx=1.75,cz=-.9,g=new THREE.Group();
  const shape=rrShape(cx,cz,1.15,1.0,.12),h=new THREE.Path();h.absarc(cx,-cz,.44,0,Math.PI*2,true);shape.holes.push(h);
  g.add(slabXZ(shape,.1,.16,MT.black));g.add(box(1.15,.012,1.0,cx,.157,cz,MT.black));
  const rotor=new THREE.Group();rotor.position.set(cx,.215,cz);rotor.add(cyl(.12,.09,0,0,0,MT.silver2));
  const bg=fanBlade(),bl=[];for(let i=0;i<17;i++)bl.push(bg.clone().rotateY(i/17*Math.PI*2));rotor.add(merge(bl,MT.imp));
  rotor.add(new THREE.Mesh(new THREE.CircleGeometry(.1,32).rotateX(-Math.PI/2).translate(0,.0455,0),new THREE.MeshStandardMaterial({color:0x1b1f24,roughness:.6,metalness:.4})));
  g.add(new THREE.Mesh(new THREE.TorusGeometry(.44,.012,8,48).rotateX(Math.PI/2).translate(cx,.262,cz),MT.silver2));
  g.add(flat(.34,.12,cx+.38,.2625,cz-.4,labelTex(340,120,(x,w,h)=>{x.fillStyle='#e8ebee';x.fillRect(0,0,w,h);x.fillStyle='#1a1d21';x.font='700 30px system-ui,sans-serif';x.fillText('FAN  DC 5V',16,48);x.font='500 22px Consolas,monospace';x.fillText('0.50A  M21718-001',16,86)}),{roughness:.6}));g.add(rotor);rotors.push(rotor);
  g.add(tube([[cx-.55,.17,cz+.4],[cx-.8,.18,cz+.6],[cx-1.1,.2,cz+.62]],.014,MT.black));
  reg({id:'fan',name:'Cooling fan',cat:'Main board & cooling',tag:'ASP',pn:b.fan,g,off:[.2,-.25,-.25],pg:'52–53',
    desc:'Blower fan exhausting through the rear vent. Part number depends on battery size. It cycles on and off during normal operation.',
    svc:'<b>Remove:</b> bottom cover → disconnect battery cable → unclip display cable from the fan → remove 3 × Phillips 2.0×4.0 screws → disconnect the fan cable from the board → lift out.'})}

function buildHeatsink(c){const g=new THREE.Group(),cx=-.2,cz=-1;
  g.add(box(1.2,.022,.95,cx,.236,cz,MT.steel));g.add(box(.5,.006,.5,cx,.222,cz,MT.cu));
  const p=[[-1.1,-1.25],[-1.28,-1.38],[-1.46,-1.52]];for(const[a,b]of p)g.add(tube([[.4,.246,a],[.9,.246,b-.02],[1.4,.246,-1.55],[1.72,.246,-1.62]],.034,MT.cu));
  const f=[];for(let i=0;i<58;i++)f.push(bx(.9,.1,.004,1.75,.205,-1.81+i*.0065));g.add(label(merge(f,MT.steel),'Aluminium fin stack at the rear exhaust'));
  const s=[];for(const[x,z]of[[-.7,-1.42],[.3,-1.42],[-.7,-.58],[.3,-.58]])s.push(cylG(.03,.03,x,.25,z,'y',12));g.add(merge(s,MT.black));
  {const X=[];for(const[x,z]of[[-.7,-1.42],[.3,-1.42],[-.7,-.58],[.3,-.58]]){X.push(bx(.045,.004,.009,x,.267,z),bx(.009,.004,.045,x,.267,z))}g.add(merge(X,std(0x2a2d31,.5,.4)))}
  reg({id:'heatsink',name:'Heat sink',cat:'Main board & cooling',tag:'ASP',pn:'M47406-001',g,off:[0,.06,-.3],pg:'54–55',
    desc:'Copper heat pipes from the CPU plate to a fin stack at the rear exhaust. Kit includes replacement thermal material for both the heat sink and the board component.',
    svc:'<b>Remove:</b> bottom cover → disconnect battery cable → loosen the four captive Phillips screws in the order stamped on the heat sink. Clean old thermal material from both surfaces every time it is removed.'})}

function buildIo(){const g=new THREE.Group();
  g.add(slabXZ(rrShape(-3,-1.08,.22,.95,.02),.02,.255,MT.pcb));
  g.add(label(box(.42,.2,.305,-2.96,.283,-1.31,MT.steel),'RJ-45 (network) jack — green: link, amber: activity'));g.add(box(.01,.14,.26,-3.17,.283,-1.31,MT.black));
  g.add(label(box(.42,.15,.296,-2.96,.283,-.85,MT.steel),'USB SuperSpeed 5 Gbps powered port'));g.add(box(.01,.1,.24,-3.17,.283,-.85,MT.black));
  g.add(box(.5,.004,.12,-2.6,.275,-.9,MT.flap));
  reg({id:'io',name:'I/O board',cat:'I/O & audio',tag:'ASP',pn:'N38993-001',g,off:[-.8,.95,0],pg:'50–51',
    desc:'Carries the left-side RJ-45 jack and USB-A port; connects to the board over two ZIF cables (Cable Kit N00097-001). RJ-45 door is M21396-001.',
    svc:'<b>Remove:</b> bottom cover → disconnect battery cable → unplug the larger and smaller ZIF cables → remove 3 × Phillips M2.0×4.0 screws and the network-jack door → lift out.'})}

function buildSpeaker(){const g=new THREE.Group();
  g.add(box(5.1,.06,.16,0,.27,-1.93,MT.black));
  for(const x of[-2.45,2.45]){g.add(cyl(.13,.07,x,.275,-1.93,MT.imp));g.add(cyl(.09,.02,x,.315,-1.93,MT.silver2))}
  g.add(label(box(.2,.07,.18,2.6,.27,-1.93,MT.rub),'Rubber cap — must be on the right end when installing'));
  g.add(tube([[2.4,.27,-1.86],[2.3,.27,-1.7],[2.0,.27,-1.6]],.012,MT.black));
  reg({id:'speaker',name:'Stereo speakers',cat:'I/O & audio',tag:'ASP',pn:'M21400-001',g,off:[0,1.15,-.55],pg:'58–59',
    desc:'One bar-style assembly across the rear carrying the two stereo drivers; sound exits through the grille above the function-key row.',
    svc:'<b>Remove:</b> bottom cover, battery, fan and system board first (RTC cable stays connected) → remove 1 × Phillips M2.0×2.0 screw → lift out. Fit the rubber cap on the right end.'})}

function buildPower(){const g=new THREE.Group();
  g.add(label(rcyl(.075,.3,3.04,.256,-1.91,MT.steel),'Power connector — AC smart-pin adapter, 4.5 mm'));g.add(label(rcyl(.045,.1,3.2,.256,-1.91,MT.black),'Power connector'));
  g.add(tube([[2.95,.25,-1.88],[2.7,.26,-1.7],[2.45,.27,-1.5]],.022,MT.black));g.add(box(.2,.045,.1,2.4,.27,-1.5,MT.white));
  reg({id:'power',name:'Power connector cable',cat:'Power',tag:'ASP',pn:'M21725-001',g,off:[.9,1.15,-.4],pg:'59–60',
    desc:'DC input jack with cable harness to the system board. Right-side, rearmost port.',
    svc:'<b>Remove:</b> bottom cover → disconnect battery cable → move antenna cables aside → remove 3 × M2.5×4.0 screws on the right hinge and rotate it off → disconnect from board → lift out.'})}

function buildRtc(){const g=new THREE.Group();
  g.add(cyl(.18,.06,-2.65,.25,.45,MT.steel));g.add(cyl(.12,.062,-2.65,.25,.45,MT.silver2));
  g.add(tube([[-2.5,.27,.4],[-2.3,.27,.33],[-2.1,.27,.3]],.014,MT.white));g.add(box(.14,.04,.08,-2.05,.27,.3,MT.white));
  reg({id:'rtc',name:'RTC battery',cat:'Power',tag:'ASP',pn:'M34737-001',g,off:[-.5,.9,.3],pg:'50',
    desc:'Coin cell for the real-time clock / CMOS. Adhesive-mounted; its cable stays connected during system-board removal.',
    svc:'<b>Remove:</b> bottom cover, disconnect main battery → unplug the RTC cable → free from chassis clips → pry the cell off its adhesive.'})}

function buildTouchpad(){const g=new THREE.Group(),cz=1.3665;
  g.add(box(2.32,.02,1.345,.02,.385,cz,std(0xc4cacf,.5,.22)));g.add(box(2.42,.01,1.44,.02,.345,cz,MT.steel));
  g.add(merge([bx(.2,.03,.06,-.85,.36,cz+.62),bx(.2,.03,.06,.85,.36,cz+.62)],MT.black));
  g.add(box(.3,.004,.9,.2,.33,cz-1,MT.flap));
  reg({id:'touchpad',name:'Clickpad (touchpad)',cat:'Top cover & input',tag:'ASP',pn:'N54001-001',g,off:[0,1.55,.3],pg:'51–52',
    desc:'Microsoft Precision Touchpad (firmware PTP), no hybrid mode. Cable is in the Cable Kit N00097-001.',
    svc:'<b>Remove:</b> bottom cover and battery → unplug the system-board ZIF cable → remove 4 × M2.0×2.0 and 2 × M1.6×2.0 screws → lift out.'})}

function buildFp(c){if(!c.fp)return;const g=new THREE.Group();
  g.add(box(.35,.015,.3,2.75,.29,.74,MT.pcb));g.add(box(.19,.014,.21,2.75,.383,.74,std(0xdfe2e5,.3,.45)));g.add(box(.4,.01,.38,2.75,.325,.74,MT.steel));g.add(box(.3,.004,.6,2.75,.33,.41,MT.flap));
  reg({id:'fp',name:'Fingerprint reader board',cat:'Top cover & input',tag:'ASP',pn:'N00879-001',g,off:[.65,1.5,.7],pg:'53–54',
    desc:'Palmrest fingerprint reader (select models). Bracket N02964-001, cable in Cable Kit N00097-001; a blank insert is in Plastics Kit N38997-001.',
    svc:'<b>Remove:</b> bottom cover, battery cable, WWAN module → unplug ZIF cable → remove 1 × M2.0×2.5 screw and the bracket → lift the board out.'})}

// deck outline with a rectangular cutout in the middle of the rear edge (leaving a tab at each corner) where the hinge cover sits
function notchedDeck(cx,cz,w,d,r,nw,nd){const x0=cx-w/2,x1=cx+w/2,y0=-cz-d/2,y1=-cz+d/2,p=new THREE.Shape(),nx=nw/2;
  p.moveTo(x0+r,y0);p.lineTo(x1-r,y0);p.absarc(x1-r,y0+r,r,-Math.PI/2,0,false);const q=Math.min(r,.03);p.lineTo(x1,y1-q);p.absarc(x1-q,y1-q,q,0,Math.PI/2,false);
  p.lineTo(nx,y1);p.lineTo(nx,y1-nd);p.lineTo(-nx,y1-nd);p.lineTo(-nx,y1);
  p.lineTo(x0+q,y1);p.absarc(x0+q,y1-q,q,Math.PI/2,Math.PI,false);p.lineTo(x0,y0+r);p.absarc(x0+r,y0+r,r,Math.PI,Math.PI*1.5,false);return p}
function buildTop(c){const g=new THREE.Group(),keys=keyLayout(c.kb);
  const deck=notchedDeck(0,0,W,D,.2,5.0,.22);deck.holes.push(rrHole(0,KZC,KW,KD,.06),rrHole(.02,1.3665,2.37,1.39,.06));if(c.fp)deck.holes.push(rrHole(2.75,.74,.23,.25,.03));
  g.add(slabXZ(deck,.05,.34,MT.silver,.01));
  const ring=rrShape(0,0,W,D,.2);ring.holes.push(rrHole(0,0,W-.1,D-.1,.16));g.add(skirt(notchedDeck(0,0,W,D,.2,5.0,.22),YS,notchedDeck(0,0,W,D,.2,5.0,.22),()=>.355,MT.silver));
  g.add(slabXZ(rrShape(0,KZC,KW+.04,KD+.04,.07),.012,.348,std(0xaeb3b8,.4,.5)));
  g.add(label(merge(keys.map(k=>keycap(k.w,k.h,k.x,k.z)),MT.key),c.backlit?'Backlit, spill-resistant keyboard':'Spill-resistant keyboard (not backlit)'));
  const lg=new THREE.Mesh(new THREE.PlaneGeometry(KW,KD).rotateX(-Math.PI/2).translate(0,.4205,KZC),new THREE.MeshBasicMaterial({map:keyboardTexture(keys,c.backlit),transparent:true,depthWrite:false}));g.add(lg);
  if(c.backlit){
    const kc=canvas(KW*220,KD*220),kx=kc.getContext('2d'),S1=220,pad=.018;
    kx.filter='blur(7px)';kx.fillStyle='rgba(50,150,255,1)';
    for(const k of keys)kx.fillRect((k.x+KW/2-k.w/2-pad)*S1,(k.z-(KZC-KD/2)-k.h/2-pad)*S1,(k.w+2*pad)*S1,(k.h+2*pad)*S1);
    const add={transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false};
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(KW,KD).rotateX(-Math.PI/2).translate(0,.3625,KZC),new THREE.MeshBasicMaterial({map:tex(kc),opacity:.2,...add})));
    const src=lg.material.map.image,gc=canvas(src.width,src.height),gx=gc.getContext('2d');
    gx.filter='blur(8px) brightness(1.1) sepia(1) hue-rotate(170deg) saturate(3)';gx.drawImage(src,0,0);gx.filter='none';
    const gt=tex(gc);
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(KW,KD).rotateX(-Math.PI/2).translate(0,.4212,KZC),new THREE.MeshBasicMaterial({map:gt,opacity:.75,...add})));
  }
  {const cv=canvas(2048,96),x=cv.getContext('2d');x.fillStyle='#c3c7cb';x.fillRect(0,0,2048,96);x.fillStyle='#5f656b';
    for(let r=0;r<14;r++)for(let k=0;k<340;k++){x.beginPath();x.arc(4+k*6+(r%2?3:0),4+r*6.6,1.5,0,7);x.fill()}
    g.add(label(new THREE.Mesh(new THREE.PlaneGeometry(5.75,.21).rotateX(-Math.PI/2).translate(0,.4004,-1.665),new THREE.MeshStandardMaterial({map:tex(cv),metalness:.3,roughness:.5})),'Speaker grille'))}
  if(c.sticker){const cv=canvas(160,80),x=cv.getContext('2d');x.fillStyle='#eef3f8';x.fillRect(0,0,160,80);x.fillStyle='#2f7fd0';for(const[a,b]of[[10,10],[36,10],[10,36],[36,36]])x.fillRect(a,b,24,24);x.fillStyle='#556';x.fillRect(74,14,70,8);x.fillRect(74,32,52,8);x.fillRect(74,50,64,8);
    g.add(label(new THREE.Mesh(new THREE.PlaneGeometry(.42,.21).rotateX(-Math.PI/2).translate(-1.7,.4006,.58),new THREE.MeshBasicMaterial({map:tex(cv)})),'Windows / CPU sticker'))}
  g.add(label(merge([bx(.62,.025,.16,-2.8,.402,-2.0),bx(.62,.025,.16,2.8,.402,-2.0)],MT.silver2),'Hinge side plates'));
  const RP=[['Power connector — AC smart-pin adapter',-1.91,.105,.256,1],['Battery light',-1.65,.026,.25,1],['USB Type-C power / 10 Gbps / DisplayPort',-1.42,.2,.117,.245],['USB SuperSpeed 5 Gbps with HP Sleep and Charge',-1.08,.23,.155,.258],
    ['USB SuperSpeed 5 Gbps',-.77,.23,.155,.258],['HDMI 2.1',-.45,.27,.135,.262],['Audio-out / audio-in combo jack',-.25,.097,.252,1]];
  if(c.wwan){g.add(label(box(.012,.03,.22,W/2+.004,.256,.247,MT.black),'Right side — nano-SIM tray slot (LTE models)'));g.add(label(box(.014,.016,.2,W/2+.006,.256,.247,MT.steel),'Right side — nano-SIM tray slot (LTE models)'))}
  for(const[t,z,zl,a,b]of RP){if(b===1){g.add(label(rcyl(zl/2+.012,.012,W/2+.002,a,z,MT.steel),'Right side — '+t));g.add(label(rcyl(zl/2,.014,W/2+.004,a,z,MT.black),'Right side — '+t))}else if(t.startsWith('USB Type-C')){g.add(label(new THREE.Mesh(new THREE.PlaneGeometry(.2,.105).rotateY(Math.PI/2).translate(W/2+.006,b,z),new THREE.MeshBasicMaterial({map:usbcTex(),transparent:true,depthWrite:false})),'Right side — '+t))}else g.add(label(box(.012,a,zl,W/2+.004,b,z,MT.black),'Right side — '+t))}
  for(const[t,z,zl,yl,y]of[['Nano security-cable slot',-1.88,.113,.095,.256],['RJ-45 (network) jack',-1.31,.305,.2,.283],['USB SuperSpeed 5 Gbps powered port',-.85,.296,.15,.283]]){g.add(label(box(.012,yl,zl,-W/2-.004,y,z,MT.black),'Left side — '+t));if(zl===.305)g.add(label(box(.014,.12,.34,-W/2-.004,.12,z,MT.silver2),'RJ-45 drop-down door'))}
  
  
  {const cv=canvas(620,100),x=cv.getContext('2d');x.fillStyle='#6a7077';x.font='500 80px system-ui,sans-serif';x.textBaseline='middle';x.letterSpacing='24px';x.fillText('PROBOOK',6,52);
   g.add(new THREE.Mesh(new THREE.PlaneGeometry(.62,.1).rotateX(-Math.PI/2).translate(-2.59,.4005,.72),new THREE.MeshBasicMaterial({map:tex(cv),transparent:true,depthWrite:false})))}
  reg({id:'top',name:'Top cover with keyboard',cat:'Top cover & input',tag:'ASP',pn:(c.backlit?'N38995-001':'N38994-001')+' (+ country code, e.g. -001 US)',g,off:[0,1.95,0],pg:'69',
    desc:`Aluminium C-cover with integrated ${c.backlit?'backlit':'non-backlit'}, spill-resistant keyboard (US layout shown), power button, speaker grille and the left/right port cut-outs. It is what remains after every other part is removed.`,
    svc:'<b>Last part left</b> after removing all other components. Order by keyboard country code (Table 6-12), e.g. -031 UK, -041 DE, -051 FR, -061 IT.'})}

/* ---- display assembly (local coords: x width, y up from hinge line, z toward viewer is +) */
function buildLid(c){
  const lid=new THREE.Group(),P=PANEL[c.panel],Wl=6.4,Hl=3.98,cy=1.99,pcy=1.99;lid.name='lid';
  const mk=o=>reg({...o,parent:lid,cat:'Display assembly',tag:'ASP'});
  // back cover
  let g=new THREE.Group();g.add(slabXY(rrShapeXYTop(0,cy-.075,Wl,Hl+.15,.18),.02,-.125,MT.silver));
  {const hc=std(0xb4babf,.75,.3),pr=new THREE.Shape();
    // side profile (from the reference drawing): a "⊃" block fixed to the bottom of the lid, flush with the lid's back face and reaching toward the screen side, chamfered at the free end. Shape x = depth along lid z, shape y = along the lid face.
    pr.moveTo(0,-.15);pr.lineTo(.27,-.15);pr.lineTo(.3,-.12);pr.lineTo(.3,-.11);pr.lineTo(.27,-.08);pr.lineTo(0,-.08);pr.closePath();
    const eg=new THREE.ExtrudeGeometry(pr,{depth:4.96,bevelEnabled:false});eg.rotateY(-Math.PI/2);eg.translate(2.48,0,0);
    const hg=new THREE.Group();hg.position.set(0,0,-.125);g.add(hg);
    const m=new THREE.Mesh(eg,hc);hg.add(label(m,'Hinge cover'));
    hg.add(box(4.96,.008,.02,0,-.08,.2,std(0xffffff,.2,.25)));hg.add(box(4.96,.012,.02,0,-.092,.03,MT.black));
    // pivot pins at both ends of the cover, at the centre of its cross-section (lid-local y=.005, z=.17: see PIVOT_Z in layout())
    for(const s of[-1,1])hg.add(cyl(.035,.03,s*2.49,-.115,.2,MT.steel,'x'));
    // 'PROBOOK' print on the rear-facing edge (visible from behind with the lid closed)
    {const pc=canvas(1024,64),px=pc.getContext('2d');px.clearRect(0,0,1024,64);px.fillStyle='#5d636a';px.font='500 40px system-ui,sans-serif';px.textBaseline='middle';px.textAlign='center';px.letterSpacing='14px';px.fillText('PROBOOK',512,34);
      hg.add(new THREE.Mesh(new THREE.PlaneGeometry(1.0,.0625).rotateX(Math.PI/2).rotateY(Math.PI).translate(0,-.1505,.15),new THREE.MeshBasicMaterial({map:tex(pc),transparent:true,depthWrite:false})))}
    // retaining clips along the lid-side edge that snap into the back cover
    {const cl=[];for(const x of[-2.2,-1.7,-1.1,-.5,.15,.75,1.35,1.9,2.2])cl.push(bx(.1,.04,.05,x,-.06,.05));hg.add(merge(cl,hc))}}
  const ring=rrShapeXYTop(0,cy-.075,Wl,Hl+.15,.18);ring.holes.push(rrHoleXY(0,cy,Wl-.14,Hl-.14,.12));g.add(slabXY(ring,.075,-.105,MT.silver));
  const lmg=new THREE.PlaneGeometry(.85,.85,28,28);{const P=lmg.attributes.position;for(let i=0;i<P.count;i++){const r2=(P.getX(i)**2+P.getY(i)**2)/(.425*.425);P.setZ(i,.012*Math.max(0,1-r2))}lmg.computeVertexNormals()} // slightly domed, like a polished badge
  const lm=new THREE.Mesh(lmg.rotateY(Math.PI).translate(0,pcy+.02,-.1262),new THREE.MeshStandardMaterial({map:logoMirror(),color:0xffffff,metalness:1,roughness:.02,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));lm.userData.mirror=true;g.add(lm);
  g.add(new THREE.Mesh(new THREE.RingGeometry(.408,.432,72).rotateY(Math.PI).translate(0,pcy+.02,-.1259),std(0x5f656b,.95,.28))); // thin dark chamfer around the polished badge
// long shallow groove along the top edge of the lid back (a pale lip over a thin shadow line), as on the real part  g.add(label(box(4.6,.012,.003,0,3.925,-.1262,std(0xdde1e5,.6,.35)),'Top-edge groove'));g.add(box(4.6,.006,.002,0,3.911,-.1262,std(0x7d8389,.5,.5)));
  const bc=c.wwan?'N01279-001':(c.cam==='ir'?(P.nits===400?'N38998-001':'N39001-001'):(P.nits===400?'N38999-001':'N39000-001'));
  mk({id:'d-back',name:'Display back cover',g,off:[0,0,-1.0],pn:bc,pg:'62–68',desc:`Lid shell with integrated antenna bonding and bezel adhesive. Variant for ${P.nits} nit panel${c.cam==='ir'?' + 5 MP IR camera':''}${c.wwan?' + WWAN':''}.`,svc:'<b>Remains</b> after the bezel, panel, hinges, cables and antennas have been removed. (Guide p.68 text and Table 3-2 disagree on N39000/N39001; Table 3-2 is used.)'});
  // hinges
  g=new THREE.Group();for(const s of[-1,1]){g.add(box(.5,.3,.03,s*2.85,.2,-.07,MT.silver2))}
  mk({id:'d-hinge',name:'Hinges (left + right)',g,off:[0,-1.0,-.45],pn:'N39016-001',pg:'66–67',desc:'Hinge kit includes bezel trim pieces, protective shielding, and the panel and bezel adhesive.',svc:'<b>Remove:</b> two trim pieces → 2 × M2.5×2.5 screws → 1 × M2.5×4.0 screw per hinge → lift off.'});
  // display/camera cable
  g=new THREE.Group();g.add(box(3.0,.12,.004,-1.5,3.780,-.08,MT.black));g.add(box(.12,3.7,.004,-3.0,1.9,-.08,MT.black));g.add(box(.5,.12,.004,-2.75,.2,-.08,MT.zif));
  mk({id:'d-cable',name:'Display / camera cable',g,off:[0,0,-.55],pn:'N39012-001',pg:'67',desc:'Flat cable from the board ZIF connector, along the lid edge to the panel and camera.',svc:'<b>Remove:</b> peel the cable up off the inside of the display rear cover.'});
  // antennas
  g=new THREE.Group();for(const s of[-1,1]){g.add(box(1.0,.35,.006,s*2.3,3.730,-.09,MT.black));g.add(tube([[s*2.3,3.580,-.09],[s*3.0,3.480,-.09],[s*3.05,.5,-.09],[s*2.8,.15,-.09]],.012,s<0?MT.white:MT.black))}
  mk({id:'d-wlan',name:'WLAN antennas + cables',g,off:[0,0,-.7],pn:'N39003-001',pg:'68',desc:'Two antennas at the top corners of the lid. White lead = Main, black = Aux.',svc:'<b>Remove:</b> free cables from the clips at bottom-right and the lid clips, then peel the antennas off the cover.'});
  if(c.wwan){g=new THREE.Group();for(const s of[-1,1]){g.add(box(.8,.3,.006,s*1.35,3.750,-.085,std(0x2a2d33,.2,.6)));g.add(tube([[s*1.35,3.630,-.085],[s*2.55,3.380,-.085],[s*2.9,.4,-.085],[s*2.7,.18,-.085]],.012,MT.black))}
    mk({id:'d-wwan',name:'WWAN antennas + cables',g,off:[0,0,-.85],pn:'N39005-001',pg:'68',desc:'LTE antennas in the top of the lid (WWAN models only).',svc:'<b>Remove:</b> lift cables off the lid, then peel the antennas off the cover.'})}
  // microphone module
  g=new THREE.Group();for(const s of[-1,1]){g.add(box(.18,.05,.01,s*.95,3.830,-.07,MT.pcb));g.add(cyl(.012,.012,s*.95,3.830,-.062,MT.chip,'z'))}
  mk({id:'d-mic',name:'Microphone module (dual array)',g,off:[0,.5,.45],pn:'N39015-001',pg:'66',desc:'Dual-array digital microphones either side of the camera.',svc:'<b>Remove:</b> peel the module off the back cover.'});
  // camera
  if(c.cam!=='none'){g=new THREE.Group();g.add(box(.55,.08,.012,0,3.840,-.065,MT.pcb));g.add(cyl(.035,.02,0,3.840,-.05,MT.glass,'z'));g.add(label(cyl(.012,.012,.2,3.840,-.058,MT.led,'z'),'Camera light — on when a camera is in use'));
    if(c.cam==='ir'){g.add(cyl(.028,.02,-.2,3.840,-.05,MT.glass,'z'));g.add(cyl(.012,.014,.28,3.840,-.054,std(0x5a0f14,.1,.3),'z'))}
    g.add(label(box(.2,.06,.014,0,3.880,-.03,MT.steel),'Camera privacy cover'));
    mk({id:'d-cam',name:c.cam==='ir'?'Camera module — 5 MP + IR':'Camera module — HD',g,off:[0,.4,.6],pn:c.cam==='ir'?'N39014-001':'N39013-001',pg:'66',desc:c.cam==='ir'?'5 MP RGB + infrared camera for Windows facial-recognition logon, with sliding privacy cover.':'HD camera with sliding privacy cover.',svc:'<b>Remove:</b> lift the module evenly off the back cover, then unlock the reverse-ZIF connector. The cable routes <i>under</i> the module on reassembly.'})}
  // panel
  g=new THREE.Group();g.add(box(Wl-.1,3.58,.018,0,pcy,-.05,MT.black));
  g.add(label(new THREE.Mesh(new THREE.PlaneGeometry(6.2,3.48).translate(0,pcy,-.037),new THREE.MeshStandardMaterial({color:0x000000,emissive:0xffffff,emissiveMap:screenTexture(c),emissiveIntensity:.9,roughness:.15,metalness:0})),`${P.t}`));
  mk({id:'d-panel',name:'Display panel — 14″ '+P.short,g,off:[0,0,.65],pn:P.pn,pg:'62–64',desc:`${P.t}. eDP, LED backlight, antiglare. Secured with adhesive tape (spare N39006-001).`,svc:'<b>Remove:</b> pull the perimeter tape out from all four corners with tweezers, flip the panel over, lift the tape and disconnect the cable. Before refitting, fit the cable to the panel back; leave the unit inverted for 20 min, then upright for 10 min while the adhesive sets.'});
  // bezel
  g=new THREE.Group();const bs=rrShapeXYTop(0,cy,Wl,Hl,.18);bs.holes.push(rrHoleXY(0,pcy,6.18,3.48,.02));g.add(slabXY(bs,.03,-.03,MT.bezel));
  for(const s of[-1,1])g.add(cyl(.008,.006,s*.55,3.850,.001,MT.glass,'z'));
  g.add(box(1.25,.1,.03,0,pcy+1.82,-.015,MT.bezel));
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(.14,.14).translate(0,.125,.0015),new THREE.MeshBasicMaterial({map:logoOfficial(),transparent:true,depthWrite:false})));
  if(c.cam!=='none'){
    // real webcam: a dark lens sunk into the black bezel, barely visible, with a faint blue-violet coating glint
    g.add(cyl(.026,.003,0,3.850,.0015,std(0x0c0d10,.5,.4),'z'));
    g.add(cyl(.019,.005,0,3.850,.003,std(0x020308,.95,.08,{envMapIntensity:1.6}),'z'));
    g.add(cyl(.009,.006,0,3.850,.0035,std(0x161a3a,.9,.1,{envMapIntensity:2}),'z'));
    g.add(cyl(.003,.006,.14,3.850,.003,std(0x0a0c0e,.3,.5),'z'));

    if(c.cam==='ir'){g.add(cyl(.022,.006,-.13,3.850,.003,MT.glass,'z'));g.add(cyl(.009,.006,.13,3.850,.003,std(0x5a0f14,.1,.3),'z'))}
    }
  g.add(label(box(.22,.012,.006,0,3.972,.003,std(0x16171a,.1,.7)),'Webcam privacy shutter slider'));
  mk({id:'d-bezel',name:'Display bezel',g,off:[0,0,1.2],pn:BEZEL[P.fhd?'fhd':'hd'][c.cam],pg:'62',desc:`Narrow bezel for ${P.fhd?'FHD':'HD'} models ${c.cam==='none'?'without a camera':c.cam==='hd'?'with HD camera':'with 5 MP/IR camera'}.`,svc:'<b>Remove:</b> flex the top, then left and right sides, then bottom to release the clips and lift off. Refit by pressing bottom, sides, then top.'});
  lid.userData.base=V(0,.163,-2.0125);lid.userData.off=V(0,0,-2.2);lid.scale.z=.75;root.add(lid);return lid}

/* ------------------------------------------------------------------ assemble */
const c = cfg
buildBottom(c);buildBattery(c);buildBoard(c);buildRam(c);buildSsd(c);buildWlan(c);buildWwan(c);buildFan(c);buildHeatsink(c);buildIo();buildSpeaker();buildPower();buildRtc();buildTouchpad();buildFp(c);buildTop(c)
const lid = buildLid(c)
finalize()

const guides = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(parts.length*6),3)),new THREE.LineDashedMaterial({color:0x4cc9e8,dashSize:.07,gapSize:.06,transparent:true,opacity:.45}))
guides.frustumCulled = false
root.add(guides)

const _b = new THREE.Box3()
const centre = p => _b.setFromObject(p.g).getCenter(new THREE.Vector3())
let restCentres = null
/** Places every part at `t` (0 = assembled, 1 = fully exploded) and opens the lid to `lidDeg` degrees. */
const LID_LEN = .975   // trims the top of the lid (and top bezel) so the lid ends level with the base front
function layout(t, lidDeg = 100){
  lid.position.copy(lid.userData.base).addScaledVector(lid.userData.off,t)
  lid.rotation.x = -(lidDeg-90)*Math.PI/180
  // the pivot is the centre of the hinge cover, at lid-local (y -.115, z .075): offset so the lid turns about that point
  {const py=-.115*LID_LEN,pz=.075*lid.scale.z,th=lid.rotation.x,cs=Math.cos(th),sn=Math.sin(th);lid.position.y-=py*cs-pz*sn;lid.position.z-=py*sn+pz*cs}
  // as the lid comes to rest it settles onto the deck and tucks its hinge in, so closed means flush rather than hovering
  {const u=Math.min(1,Math.max(0,lidDeg/14)),cf=1-u*u*(3-2*u);lid.position.y+=.016*cf*(1-t);lid.scale.y=LID_LEN*(1+.016*cf*(1-t))}
  for(const p of parts)p.g.position.set(p.off[0]*t,p.off[1]*t,p.off[2]*t)
  root.updateMatrixWorld(true)
}
function updateGuides(t, lidDeg = 100){
  const show = t > .02
  guides.visible = show
  if(!show)return
  layout(0,lidDeg)
  restCentres = parts.map(centre)
  layout(t,lidDeg)
  const pos = guides.geometry.attributes.position
  parts.forEach((p,i)=>{const c1=centre(p);pos.setXYZ(2*i,restCentres[i].x,restCentres[i].y,restCentres[i].z);pos.setXYZ(2*i+1,c1.x,c1.y,c1.z)})
  pos.needsUpdate = true
  guides.computeLineDistances()
}

/** Highlights one part (emissive tint) and optionally ghosts the others. */
function paint(sel, ghost = false){
  for(const p of parts)p.g.traverse(o=>{if(!o.isMesh)return;const m=o.material,u=m.userData,s=p===sel
    if(m.emissive&&!m.emissiveMap){if(u.e0===undefined){u.e0=m.emissive.getHex();u.ei0=m.emissiveIntensity}
      if(s){m.emissive.setHex(0x1596b8);m.emissiveIntensity=.65}else{m.emissive.setHex(u.e0);m.emissiveIntensity=u.ei0}}
    const gh=ghost&&sel&&!s;m.transparent=gh||u.tr0;m.opacity=gh?.1:u.op0;m.depthWrite=gh?false:u.dw0})
}

function dispose(){
  root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const k of['map','emissiveMap'])if(o.material[k])o.material[k].dispose();o.material.dispose()}})
}

return { root, parts, lid, rotors, guides, ready: Promise.all(pending), layout, updateGuides, paint, centre, dispose, size:{W,D} }
}
