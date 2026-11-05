const $=id=>document.getElementById(id);
const L={s4:{n:'Strip 4',c:1,r:4,ar:4/3},s3:{n:'Strip 3',c:1,r:3,ar:4/3},g4:{n:'Grid 2×2',c:2,r:2,ar:1},p1:{n:'Polaroid',c:1,r:1,ar:1}};
function applyVar(k,i){const l=L[k],v=l.vars[i];l.vi=i;l.bg=v.bg;l.tpl.src=v.src;l.tpl.ink=v.ink||l.tpl.ink}
function setVar(i){applyVar(lay,i)}
const DQV=[
  {n:'Biru Duotone',bg:'#e6e8f4',ink:'#111111',c:'#3a4cc4',f:'DuotoneBiru',rx:0,sym:'spark'},
  {n:'Abu Mono',bg:'#ececec',ink:'#111111',c:'#111111',f:'HitamPutih',rx:0,sym:'spark',tilt:1},
  {n:'Krem Manis',bg:'#f3e9d4',ink:'#6b1111',c:'#6b1111',f:'Sepia',rx:36,sym:'heart'},
  {n:'Malam',bg:'#101014',ink:'#f2f2f2',c:'#f2f2f2',f:'HitamPutih',rx:0,sym:'star'},
  {n:'Flip Sage',bg:'#d3e2cc',ink:'#1d3a2a',c:'#1d3a2a',f:'Normal',rx:36,sym:'star',tilt:1,flip:1}];
L.dq={n:'Club (Duo)',c:2,r:1,ar:3/4,bg:DQV[0].bg,vars:DQV,vi:0,tpl:{w:1200,h:1800,ink:DQV[0].ink,notitle:true,nodate:true,rx:0,deco:1,quote:'Every moment is worth keeping',big:'Club',wins:[[40,518,520,693],[640,518,520,693]]}};
const HWV=[
  {n:'Oranye',bg:'#0d0710',bg2:'#2b1004',acc:'#ff7a1a',ink:'#ffd9a8',c:'#ff7a1a'},
  {n:'Ungu',bg:'#1a0b2e',bg2:'#2e0f4f',acc:'#b6ff3b',ink:'#e9d7ff',c:'#b6ff3b'},
  {n:'Hantu',bg:'#eceef4',bg2:'#cdd2e0',acc:'#2b2b3a',ink:'#2b2b3a',c:'#2b2b3a'}];
L.hw={n:'Trick or Treat',c:3,r:1,ar:4/3,bg:HWV[0].bg,vars:HWV,vi:0,tpl:{w:720,h:1945,ink:HWV[0].ink,rx:0,deco:'hw',bgdeco:1,title:'TRICK OR TREAT',wins:[[50,230,620,465],[50,725,620,465],[50,1220,620,465]]}};
L.hd={n:'Haunted Duo',c:2,r:1,ar:3/4,bg:HWV[0].bg,vars:HWV,vi:0,tpl:{w:1200,h:1800,ink:HWV[0].ink,rx:0,deco:'hw',bgdeco:1,title:'TRICK OR TREAT',wins:[[40,420,520,693],[640,420,520,693]]}};
const TK=()=>L[lay].tpl?L[lay].tpl.w/580:1; // skala stiker/doodle/teks mengikuti lebar frame
const PAD=40,GAP=24,BOT=120,CW=500;
let lay='s4',stream=null,face='user',photos=[],imgs=[],busy=false;
let frame='#ffffff',pat='Polos',shape='Kotak',filt='Normal',stks=[],sel=-1,D=[],doodling=false;
const PATS=['Polos','Titik','Hati','Bintang','Konfeti'],SHAPES=['Kotak','Rounded','Oval'];
const FILT={Normal:'none',HitamPutih:'grayscale(1)',Sepia:'sepia(.8)',Hangat:'saturate(1.3) sepia(.25) brightness(1.05)',Dingin:'saturate(1.1) hue-rotate(15deg) brightness(1.03)',Pudar:'contrast(.85) brightness(1.1) saturate(.8)',DuotoneBiru:'grayscale(1) sepia(1) hue-rotate(210deg) saturate(2.2) contrast(1.05) brightness(1.05)'};
const EMO='❤️ 💖 ✨ ⭐ 🌸 🎀 🎉 🎈 👑 🕶️ 🍓 🍒 🧋 🐱 🐶 🐰 🐻 🌈 ☁️ 🔥'.split(' ');
const STEPS=['Layout','Foto','Hias','Unduh'];

function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2200)}
function tema(){const d=document.documentElement,l=d.dataset.theme==='dark';d.dataset.theme=l?'light':'dark';$('tb').textContent=l?'☀️':'🌙'}
function go(p){
  if(p==='edit'&&!photos.some(Boolean))return toast('Ambil foto dulu');
  if(p!=='foto')stopCam();autoClock=-1;cancelAnimationFrame(autoRaf);
  document.querySelectorAll('.pg').forEach(e=>e.classList.remove('on'));$(p).classList.add('on');
  const i={layout:0,foto:1,edit:2}[p];
  $('steps').innerHTML=i===undefined?'':STEPS.map((s,k)=>`<span class="step ${k===i?'on':''}">${k+1}. ${s}</span>`).join('');
  if(p==='foto')buildSlots();if(p==='edit'){$('edit').classList.toggle('tpl',!!L[lay].tpl);$('lhint').hidden=$('vdl').hidden=!live.some(Boolean);draw();autoLive();renderEvar()}
}
/* ---------- layout: kartu pilihan + panel pratinjau ---------- */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DESC={s4:'Strip klasik ala photobooth, 4 pose.',s3:'3 pose — pas untuk berdua atau bertiga.',g4:'Kotak 2×2, enak untuk feed.',p1:'1 foto besar bergaya polaroid.',rc:'Frame desain Reality Club, 3 pose.',dq:'2 potret berdampingan, kutipan tulisan tangan & kata besar. Teks bisa diganti.',fr:'Roll film analog dengan lubang sprocket, 4 pose.'};
Object.assign(DESC,{dq:'2 potret berdampingan, kutipan tulisan tangan & kata besar. Teks bisa diganti.',hw:'Strip 3 foto bertema Halloween: labu, kelelawar, jaring laba-laba.',hd:'2 potret berdampingan bertema Halloween.'});
function addDesign(k,d){ // ubah entri DESIGNS (designs.js) menjadi layout
  const v=d.vars[d.vi||0],w=d.wins;
  L[k]={n:d.n,c:w.length,r:1,ar:w[0][2]/w[0][3],bg:v.bg,vars:d.vars,vi:d.vi||0,
    tpl:{src:v.src,w:d.w,h:d.h,ink:v.ink||d.ink||'#f5f5f5',notitle:d.notitle??!d.text,nodate:d.nodate??!d.text,wins:w}};
  if(d.desc)DESC[k]=d.desc;
}
for(const [k,d] of Object.entries(DESIGNS))addDesign(k,d);
const extraColls={}; // koleksi tambahan dari frame admin
const allColls=()=>COLLECTIONS.map(c=>({...c,designs:c.designs.filter(k=>L[k])})).concat(Object.values(extraColls)).filter(c=>c.designs.length);
let coll=null; // koleksi yang sedang dibuka (null = daftar koleksi)
function lsvg(k,h){ // pratinjau akurat: posisi & rasio foto sama persis dengan hasil akhir
  const o=lay;lay=k;const d=dims(),v=L[k];let r='';
  for(let i=0;i<v.c*v.r;i++){const[x,y,w,hh]=winRect(i);r+=`<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${v.tpl?(v.tpl.rx??40):w*.08}" fill="#d9d9d9"/>`}
  lay=o;
  const top=v.tpl?(v.tpl.src?`<image href="${v.tpl.src}" width="${d.W}" height="${d.H}"/>`:decoPrev(d,v)):`<rect x="${d.W*.32}" y="${d.H-BOT*.6}" width="${d.W*.36}" height="9" rx="4.5" fill="#999" opacity=".6"/>`;
  return `<svg viewBox="0 0 ${d.W} ${d.H}" style="height:${h}px;width:auto;border-radius:6px"><rect width="${d.W}" height="${d.H}" fill="${v.bg||'#fff'}"/>${r}${top}</svg>`;
}
function renderPanel(){
  const v=L[lay],o=lay,d=dims();
  $('lprev').innerHTML=lsvg(lay,300);$('lvar').innerHTML=v.vars&&v.vars.length>1?varsHtml(v):'';
  $('linfo').innerHTML=`<b>${esc(v.n)}</b><span>${DESC[lay]||''}</span><small>${v.c*v.r} foto · hasil ${v.tpl?d.W+' × '+d.H:d.W*2+' × '+d.H*2} px</small>`;
}
const varsHtml=v=>`<div class="lab" style="margin-top:4px">Variasi warna</div><div class="sw" style="justify-content:center">${v.vars.map((x,i)=>`<i class="${i===v.vi?'sel':''}" title="${x.n}" data-v="${i}" style="background:linear-gradient(135deg,${x.bg} 50%,${x.c} 50%)"></i>`).join('')}</div>`;
function renderEvar(){const v=L[lay],h=v.vars&&v.vars.length>1?v.vars.map((x,i)=>`<i class="${i===v.vi?'sel':''}" title="${x.n}" data-v="${i}" style="background:linear-gradient(135deg,${x.bg} 50%,${x.c} 50%)"></i>`).join(''):'';$('evar').innerHTML=$('pvar').innerHTML=h}
function chooseVar(e){const i=e.target.dataset.v;if(i===undefined)return;setVar(+i);
  const c=document.querySelector('#lg [data-k='+lay+'] .pv');if(c)c.innerHTML=lsvg(lay,140);
  renderPanel();renderEvar();drawPreview();if($('edit').classList.contains('on'))draw()}
$('lvar').onclick=$('evar').onclick=$('pvar').onclick=chooseVar;
function renderCards(){
  const box=$('lg'),cs=allColls();
  $('lback').hidden=$('lpanel').hidden=!coll;
  $('lh').textContent=coll?((cs.find(c=>c.id===coll)||{}).n||''):'Pilih Koleksi';
  $('ls').textContent=coll?'Pilih desainnya, lalu tekan Lanjut.':'Klik sebuah koleksi untuk melihat desain di dalamnya.';
  if(!coll){
    box.innerHTML=cs.map(c=>`<button class="card coll" onclick="openColl('${c.id}')"><div class="pv">${c.designs.slice(0,3).map(k=>lsvg(k,100)).join('')}</div>${esc(c.n)}<small>${c.designs.length} desain${c.desc?' · '+esc(c.desc):''}</small></button>`).join('');
    return;
  }
  const c=cs.find(x=>x.id===coll);
  box.innerHTML=c.designs.map(k=>{const v=L[k];return `<button class="card ${k===lay?'sel':''}" data-k="${k}" onclick="pick('${k}')" ondblclick="startLayout()"><div class="pv">${lsvg(k,140)}</div>${esc(v.n)}<small>${v.c*v.r} foto</small></button>`}).join('');
}
function openColl(id){coll=id;if(id){const c=allColls().find(x=>x.id===id);if(c&&!c.designs.includes(lay))lay=c.designs[0]}renderCards();if(id)renderPanel()}
renderCards();renderPanel();
function pick(k){lay=k;document.querySelectorAll('#lg .card').forEach(c=>c.classList.toggle('sel',c.dataset.k===k));renderPanel()}
function startLayout(){photos=[];imgs=[];stks=[];D=[];live.length=0;{const V=L[lay].vars&&L[lay].vars[L[lay].vi];filt=(V&&V.f)||L[lay].filt||'Normal'}refreshChips();go('foto')}
async function loadFrames(){ // frame tambahan dari admin (butuh server.js; di server statis biasa diabaikan)
  try{
    try{const cr=await fetch('/api/collections');if(cr.ok)(await cr.json()).forEach(c=>{
      const id=c.n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'lainnya';
      if(COLLECTIONS.some(x=>x.id===id||x.n.toLowerCase()===c.n.toLowerCase()))return;
      extraColls[id]=extraColls[id]||{id,n:c.n,desc:c.desc||'dibuat admin',designs:[]}})}catch(e){}
    const r=await fetch('/api/frames');if(!r.ok)return;const list=await r.json();if(!Array.isArray(list))return;
    list.forEach(f=>{const k='u_'+f.id;if(L[k])return;
      L[k]={n:f.name,c:f.wins.length,r:1,ar:f.wins[0][2]/f.wins[0][3],bg:f.bg,tpl:{src:f.src,w:f.w,h:f.h,ink:f.ink,notitle:!f.text,nodate:!f.text,wins:f.wins}};
      DESC[k]='Frame tambahan, '+f.wins.length+' pose.';
      const nm=(f.coll||'').trim(),slug=nm.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); // masuk koleksi bernama sama, atau buat baru
      const c=COLLECTIONS.find(x=>x.id===slug||x.n.toLowerCase()===nm.toLowerCase());
      if(c)c.designs.push(k);else{const id=slug||'lainnya';(extraColls[id]=extraColls[id]||{id,n:nm||'Lainnya',desc:'ditambahkan admin',designs:[]}).designs.push(k)}});
    if(list.length){renderCards();renderPanel()}
  }catch(e){}
}
loadFrames();
/* ---------- kamera ---------- */
const N=()=>L[lay].c*L[lay].r;
function buildSlots(){
  $('box').style.aspectRatio=L[lay].ar;
  const has=photos.some(Boolean);$('nx').disabled=!has;$('rvbtn').hidden=!has;
  renderEvar();drawPreview();
}
/* ---------- pratinjau setelah sesi: lihat hasil jadi, ulangi foto yang kurang bagus ---------- */
const PV=$('pvc'),PVX=PV.getContext('2d');
function drawPreview(){
  if($('rv').hidden)return;
  const{W,H}=dims(),dpr=Math.min(2,window.devicePixelRatio||1),k=Math.min(420/W,Math.max(260,(window.innerHeight||800)-330)/H);
  PV.style.width=Math.round(W*k)+'px';PV.style.height=Math.round(H*k)+'px';PV.width=Math.round(W*k*dpr);PV.height=Math.round(H*k*dpr);
  paint(PVX,k*dpr);
  const hot=$('rvhot');hot.replaceChildren(); // tombol "ulangi" di atas tiap foto
  for(let i=0;i<N();i++){
    const[px,py,pw,ph]=winRect(i),b=document.createElement('button');
    b.type='button';b.className='hot';b.textContent='↻ Ulangi';b.style.left=((px+pw/2)*k)+'px';b.style.top=((py+ph/2)*k)+'px';
    b.onclick=()=>{closeReview();retake(i)};hot.append(b);
  }
}
function openReview(){if(!photos.some(Boolean))return;$('rv').hidden=false;renderEvar();drawPreview()}
function closeReview(){$('rv').hidden=true}
function redraw(){draw();drawPreview()}
/* ---------- atur kamera: pilih kamera, zoom, kecerahan, kontras, cermin (tersimpan di browser) ---------- */
const CAM=Object.assign({dev:'',zoom:1,bri:1,con:1,mir:null},(()=>{try{return JSON.parse(localStorage.getItem('ks_cam')||'{}')}catch(e){return{}}})());
const mirrored=()=>CAM.mir===null?face==='user':CAM.mir; // otomatis: kamera depan dicermin, kamera belakang tidak
function applyCam(){
  const v=$('v');v.style.transform=`scaleX(${mirrored()?-1:1}) scale(${CAM.zoom})`;v.style.filter=`brightness(${CAM.bri}) contrast(${CAM.con})`;
  $('zv').textContent=CAM.zoom.toFixed(1)+'×';$('bv').textContent=Math.round(CAM.bri*100)+'%';$('cv').textContent=Math.round(CAM.con*100)+'%';$('mir').checked=mirrored();
  try{localStorage.setItem('ks_cam',JSON.stringify(CAM))}catch(e){}
}
async function listCams(){ // daftar kamera (nama baru terbaca setelah izin kamera diberikan)
  try{
    const d=(await navigator.mediaDevices.enumerateDevices()).filter(x=>x.kind==='videoinput'),sel=$('camsel');
    sel.innerHTML=d.map((x,i)=>`<option value="${esc(x.deviceId)}">${esc(x.label||'Kamera '+(i+1))}</option>`).join('');
    const cur=stream&&stream.getVideoTracks()[0]&&stream.getVideoTracks()[0].getSettings().deviceId;if(cur)sel.value=cur;
  }catch(e){}
}
function drawCam(x,W,H){ // gambar frame kamera ke kanvas W×H: potong sesuai rasio, zoom, cermin, kecerahan & kontras
  const v=$('v'),vw=v.videoWidth,vh=v.videoHeight,ar=W/H;
  let sw=vw,sh=vw/ar;if(sh>vh){sh=vh;sw=vh*ar}
  sw/=CAM.zoom;sh/=CAM.zoom;
  x.save();if(mirrored()){x.translate(W,0);x.scale(-1,1)}
  x.filter=`brightness(${CAM.bri}) contrast(${CAM.con})`;
  x.drawImage(v,(vw-sw)/2,(vh-sh)/2,sw,sh,0,0,W,H);x.restore();
}
async function cam(){
  try{
    stopCam();
    const pick=CAM.dev?{deviceId:{exact:CAM.dev}}:{facingMode:face};
    stream=await navigator.mediaDevices.getUserMedia({video:{...pick,width:{ideal:1280},height:{ideal:960}},audio:false});
    $('v').srcObject=stream;await $('v').play();startBuf();applyCam();listCams();$('go').disabled=false;$('st').textContent='Kamera siap!';
  }catch(e){
    if(CAM.dev&&(e.name==='OverconstrainedError'||e.name==='NotFoundError')){CAM.dev='';return cam()} // kamera tersimpan sudah tidak ada
    $('st').textContent='❌ '+e.message;
  }
}
/* ---------- flash: 'kilat' = layar putih sekejap, 'layar' = cahaya layar menyala, 'mati' ---------- */
const FM=()=>$('fm').value;
function glow(on,quick){const s=$('sflash');s.classList.toggle('quick',!!quick);s.classList.toggle('on',on)}
function stopCam(){glow(false);stopBuf();if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;$('go').disabled=true}}
function flip(){face=face==='user'?'environment':'user';CAM.dev='';CAM.mir=null;cam()}
function shot(){ // potong tengah sesuai rasio layout, lalu terapkan zoom / cermin / kecerahan
  const v=$('v'),vw=v.videoWidth,vh=v.videoHeight,ar=L[lay].ar;
  let sw=vw,sh=vw/ar;if(sh>vh){sh=vh;sw=vh*ar}
  const W=Math.round(sw/CAM.zoom),H=Math.round(sh/CAM.zoom),c=document.createElement('canvas');c.width=W;c.height=H;
  drawCam(c.getContext('2d'),W,H);
  if(FM()!=='mati'){$('fl').classList.remove('go');void $('fl').offsetWidth;$('fl').classList.add('go')}
  return c.toDataURL('image/jpeg',.92);
}
async function count(n){for(let i=n;i>0;i--){$('cd').innerHTML='<b>'+i+'</b>';if(FM()==='layar'&&i===Math.min(2,n))glow(true);await new Promise(r=>setTimeout(r,1000))}$('cd').textContent=''}
async function take(i){$('box').classList.add('live');await count(+$('tm').value);if(FM()==='kilat'){glow(true,true);await new Promise(r=>setTimeout(r,200))} // kilat: layar putih sesaat sebelum jepret
  photos[i]=shot();if(FM()==='kilat')setTimeout(()=>glow(false,true),120);else if(FM()==='layar')setTimeout(()=>glow(false),300);imgs[i]=null;live[i]=null;const pre=buf.slice();setTimeout(()=>{live[i]=pre.concat(buf.slice(-14));buildSlots()},1250);buildSlots();$('box').classList.remove('live')}
async function session(){
  if(!stream&&!busy)await cam(); // kamera belum menyala? nyalakan dulu
  if(busy||!stream)return;busy=true;$('go').disabled=true;photos=[];imgs=[];live.length=0;buildSlots();
  for(let i=0;i<N();i++){$('st').textContent=`Foto ${i+1} dari ${N()} — bersiap…`;await take(i);await new Promise(r=>setTimeout(r,700))}
  $('st').textContent='🎉 Selesai! Lihat pratinjau, ulangi foto yang kurang bagus, atau lanjut.';$('go').disabled=false;busy=false;openReview();
}
async function retake(i){
  if(busy)return;if(!stream)await cam();if(!stream)return toast('Nyalakan kamera dulu');
  busy=true;$('st').textContent=`Mengulang foto ${i+1}…`;await take(i);$('st').textContent='✅ Foto diganti';busy=false;openReview();
}
/* ---------- render strip ---------- */
const C=$('c'),X=C.getContext('2d'),OV=$('ov'),OX=OV.getContext('2d');
function dims(){if(L[lay].tpl)return{l:L[lay],cw:0,ch:0,W:L[lay].tpl.w,H:L[lay].tpl.h};const l=L[lay],cw=l.c===1&&l.r===1?600:CW,ch=cw/l.ar;
  return{l,cw,ch,W:PAD*2+l.c*cw+(l.c-1)*GAP,H:PAD*2+l.r*ch+(l.r-1)*GAP+BOT+(lay==='p1'?60:0)}}
const rnd=s=>()=>(s=(s*16807)%2147483647)/2147483647;
const lum=h=>{const n=parseInt(h.slice(1),16);return(.299*(n>>16)+.587*((n>>8)&255)+.114*(n&255))/255};
function pattern(x,W,H,ink){
  if(pat==='Polos')return;const R=rnd(7),g={Titik:'●',Hati:'♥',Bintang:'★',Konfeti:'■'}[pat];
  x.fillStyle=ink;x.globalAlpha=.22;x.textAlign='center';x.textBaseline='middle';
  for(let i=0;i<(W*H)/9000;i++){x.font=(14+R()*22)+'px sans-serif';
    if(pat==='Konfeti')x.fillStyle=`hsl(${R()*360},80%,60%)`;
    x.save();x.translate(R()*W,R()*H);x.rotate(R()*6);x.fillText(g,0,0);x.restore()}
  x.globalAlpha=1;
}
function wpath(x,px,py,w,h,sh){x.beginPath();
  if(sh==='Oval')x.ellipse(px+w/2,py+h/2,w/2,h/2,0,0,7);
  else x.roundRect(px,py,w,h,sh==='Rounded'?w*.08:0)}
function clip(x,px,py,w,h){wpath(x,px,py,w,h,shape);x.clip()}
const TPLI={};
function tplImg(s){ // muat PNG frame; kalau tidak ada di frames/, coba folder yang sama, lalu beri tahu
  if(TPLI[s])return TPLI[s];
  const im=TPLI[s]=new Image();let retry=false;
  im.onload=redraw;
  im.onerror=()=>{if(!retry&&s.includes('/')){retry=true;im.src=s.split('/').pop()}else toast('⚠️ Frame tidak ditemukan: '+s)};
  im.src=s;return im;
}
function getImg(i){return imgs[i]||(imgs[i]=Object.assign(new Image(),{src:photos[i],onload:redraw}))}
function paint(x,s){ // gambar seluruh strip pada skala s
  const{l,cw,ch,W,H}=dims(),ink=l.tpl?(l.tpl.ink||'#f5f5f5'):(lum(frame)>.55?'#222':'#f5f5f5');
  x.save();x.scale(s,s);x.fillStyle=l.tpl?l.bg:frame;x.fillRect(0,0,W,H);if(!l.tpl)pattern(x,W,H,ink);if(l.tpl&&l.tpl.bgdeco)bgHW(x,l,W,H);
  for(let i=0;i<l.c*l.r;i++){
    const T=l.tpl,w=T&&T.wins[i],px=T?w[0]:PAD+(i%l.c)*(cw+GAP),py=T?w[1]:PAD+Math.floor(i/l.c)*(ch+GAP),pw=T?w[2]:cw,ph=T?w[3]:ch;
    if(frameOnly){x.save();x.globalCompositeOperation='destination-out';wpath(x,px,py,pw,ph,T?'Kotak':shape);x.fill();x.restore();continue} // mode frame saja: jendela foto dilubangi
    x.save();if(!T)clip(x,px,py,pw,ph);else if(!T.src&&l.vars&&l.vars[l.vi].rx){x.beginPath();x.roundRect(px,py,pw,ph,l.vars[l.vi].rx);x.clip()}x.fillStyle=T?'#d9d9d9':'rgba(128,128,128,.25)';x.fillRect(px,py,pw,ph);
    if(photos[i]){const lf=pickLive(i),im=lf||getImg(i);if(lf||(im.complete&&im.naturalWidth)){x.filter=FILT[filt];x.drawImage(im,px,py,pw,ph);x.filter='none'}}
    x.restore();
  }
  if(l.tpl&&l.tpl.src){const t=tplImg(l.tpl.src);if(t.complete&&t.naturalWidth)x.drawImage(t,0,0,W,H)} // frame desainmu menutupi foto, hanya jendela yang terlihat
  const tk=TK(),by=l.tpl?(l.tpl.wins.at(-1)[1]+l.tpl.wins.at(-1)[3]+H)/2:H-BOT/2-8;x.fillStyle=ink;x.textAlign='center';x.textBaseline='middle';
  const cap=$('cap').value.trim();
  if(l.tpl&&l.tpl.deco)deco(x,l,W,H,ink,cap);
  const nt=l.tpl&&l.tpl.notitle&&(!cap||l.tpl.deco); // template yang sudah punya judul sendiri tidak diberi judul ganda
  if(!nt){x.font=`900 ${34*tk}px 'Playfair Display',serif`;x.fillText(cap||'Kotak Studio',W/2,by-(cap?0:12*tk))}
  if($('dt').checked&&!(l.tpl&&l.tpl.nodate)){x.font=`500 ${20*tk}px 'Space Grotesk',sans-serif`;x.globalAlpha=.7;
    x.fillText(new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}),W/2,by+(nt?0:28*tk));x.globalAlpha=1}
  (frameOnly?[]:stks).forEach(k=>{x.save();x.translate(k.x*W,k.y*H);x.rotate(k.a);x.scale(k.f*k.z*tk,k.z*tk);x.font='80px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(k.e,0,0);x.restore()});
  (frameOnly?[]:D).forEach(p=>{x.strokeStyle=p.c;x.lineWidth=p.w*tk;x.lineCap=x.lineJoin='round';x.beginPath();p.p.forEach(([a,b],j)=>j?x.lineTo(a*W,b*H):x.moveTo(a*W,b*H));if(p.p.length===1)x.lineTo(p.p[0][0]*W+.1,p.p[0][1]*H);x.stroke()});
  x.restore();
}
function draw(){
  const{W,H}=dims(),s=Math.min(1,900/H);C.width=OV.width=W*s;C.height=OV.height=H*s;
  paint(X,s);OX.clearRect(0,0,OV.width,OV.height);badges(s);
  if(sel>=0&&stks[sel]){const k=stks[sel],z=88*k.z*s*TK();OX.strokeStyle='#e8c96b';OX.setLineDash([6,4]);OX.lineWidth=2;
    OX.save();OX.translate(k.x*OV.width,k.y*OV.height);OX.rotate(k.a);OX.strokeRect(-z/2,-z/2,z,z);OX.restore()}
}
/* ---------- kontrol ---------- */
const chips=(id,arr,get,set)=>{$(id).innerHTML=arr.map(a=>`<span class="chip ${get()===a?'sel':''}">${a}</span>`).join('');
  $(id).onclick=e=>{if(e.target.classList.contains('chip')){set(e.target.textContent);chips(id,arr,get,set);draw()}}};
function refreshChips(){chips('pt',PATS,()=>pat,v=>pat=v);chips('sh',SHAPES,()=>shape,v=>shape=v);chips('fi',Object.keys(FILT),()=>filt,v=>filt=v)}
refreshChips();
const THEMES={Klasik:{c:'#ffffff',p:'Polos',s:'Kotak',f:'Normal'},Vintage:{c:'#efe0c0',p:'Titik',s:'Rounded',f:'Sepia'},Party:{c:'#6a2cff',p:'Konfeti',s:'Rounded',f:'Normal'},Minimal:{c:'#f2f0ec',p:'Polos',s:'Rounded',f:'Normal'},Floral:{c:'#fde1ea',p:'Hati',s:'Oval',f:'Normal'},Noir:{c:'#111111',p:'Bintang',s:'Kotak',f:'HitamPutih'}};
$('th').innerHTML=Object.keys(THEMES).map(k=>`<span class="chip">${k}</span>`).join('');
$('th').onclick=e=>{const t=e.target.classList.contains('chip')&&THEMES[e.target.textContent];if(!t)return;frame=t.c;pat=t.p;shape=t.s;filt=t.f;$('cc').value=frame;refreshChips();draw()};
const COLORS=['#ffffff','#f2f0ec','#cfcfcf','#555555','#111111',...[0,30,50,90,150,190,220,260,300,330].flatMap(h=>[[90,88],[80,72],[75,55],[65,38],[55,22]].map(([s,l])=>`hsl(${h},${s}%,${l}%)`))];
const hex=c=>{const t=document.createElement('canvas').getContext('2d');t.fillStyle=c;return t.fillStyle};
$('sw').innerHTML=COLORS.map(c=>`<i style="background:${c}" data-c="${c}"></i>`).join('');
$('sw').onclick=e=>{const c=e.target.dataset.c;if(!c)return;frame=hex(c);$('cc').value=frame;draw()};
$('cc').oninput=e=>{frame=e.target.value;draw()};
$('em').innerHTML=EMO.map(e=>`<span class="emo">${e}</span>`).join('');
$('em').onclick=e=>{if(e.target.className!=='emo')return;stks.push({e:e.target.textContent,x:.5,y:.4,z:1,a:0,f:1});sel=stks.length-1;draw()};
function stk(a,v){const k=stks[sel];if(!k)return toast('Pilih stiker dulu');
  if(a==='s')k.z=Math.max(.3,Math.min(5,k.z*v));if(a==='r')k.a+=v;if(a==='f')k.f*=-1;if(a==='d'){stks.splice(sel,1);sel=-1}draw()}
function doodleMode(){doodling=!doodling;$('dm').textContent='✏️ Gambar: '+(doodling?'nyala':'mati');OV.style.cursor=doodling?'crosshair':'grab'}
let drag=null;
const pt=e=>{const r=OV.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
OV.onpointerdown=e=>{OV.setPointerCapture(e.pointerId);const[x,y]=pt(e),{W,H}=dims();
  if(doodling){D.push({c:$('dc').value,w:6,p:[[x,y]]});drag='d';return draw()}
  sel=-1;for(let i=stks.length-1;i>=0;i--){const k=stks[i],h=44*k.z*TK();if(Math.abs(x*W-k.x*W)<h&&Math.abs(y*H-k.y*H)<h){sel=i;drag=[x-k.x,y-k.y];break}}if(sel<0){const w=winAt(x,y);if(w>=0&&live[w])startLive(w)}draw()};
OV.onpointermove=e=>{if(!drag)return;const[x,y]=pt(e);
  if(drag==='d')D[D.length-1].p.push([x,y]);else{stks[sel].x=x-drag[0];stks[sel].y=y-drag[1]}draw()};
OV.onpointerup=OV.onpointercancel=()=>{drag=null;stopLive()};
addEventListener('keydown',e=>{if(e.key==='Delete'&&$('edit').classList.contains('on'))stk('d')});
/* ---------- Live Photo (gerakan ±1 detik sebelum & sesudah jepretan, seperti di Apple) ---------- */
const live=[];let liveIdx=-1,liveT=0,liveLast=-1,buf=[],bufT=0;
const BC=document.createElement('canvas'),BX=BC.getContext('2d');
function startBuf(){ // simpan ±14 frame terakhir (12 fps) sebagai buffer bergulir selama kamera menyala
  stopBuf();
  bufT=setInterval(async()=>{
    const v=$('v');if(!v.videoWidth)return;
    const ar=L[lay].ar,h=Math.round(400/ar);if(BC.width!==400||BC.height!==h){BC.width=400;BC.height=h}
    drawCam(BX,400,h);
    buf.push(await createImageBitmap(BC));if(buf.length>14)buf.shift();
  },83);
}
function stopBuf(){clearInterval(bufT);buf=[]}
function winRect(i){const{l,cw,ch}=dims(),T=l.tpl;return T?T.wins[i]:[PAD+(i%l.c)*(cw+GAP),PAD+Math.floor(i/l.c)*(ch+GAP),cw,ch]}
function winAt(nx,ny){const{l,W,H}=dims(),X=nx*W,Y=ny*H;
  for(let i=0;i<l.c*l.r;i++){const[px,py,pw,ph]=winRect(i);if(X>=px&&X<=px+pw&&Y>=py&&Y<=py+ph)return i}return -1}
function startLive(i){ // tekan & tahan: putar gerakan foto di dalam strip
  liveIdx=i;liveT=performance.now();liveLast=-1;
  (function f(){if(liveIdx<0)return;const k=Math.floor((performance.now()-liveT)/83);if(k!==liveLast){liveLast=k;draw()}requestAnimationFrame(f)})();
}
function stopLive(){if(liveIdx>=0){liveIdx=-1;draw()}}
function badges(s){ // lencana "◉ LIVE" hanya di layar, tidak ikut terunduh
  const n=dims(),f=s*TK();
  for(let i=0;i<n.l.c*n.l.r;i++){if(!live[i]||liveIdx===i)continue;const[px,py]=winRect(i);
    OX.fillStyle='rgba(0,0,0,.55)';OX.beginPath();OX.roundRect(px*s+12*f,py*s+12*f,100*f,34*f,17*f);OX.fill();
    OX.fillStyle='#fff';OX.font=`700 ${19*f}px 'Space Grotesk',sans-serif`;OX.textAlign='left';OX.textBaseline='middle';OX.fillText('◉ LIVE',px*s+24*f,py*s+29*f)}
}
/* ---------- Video Live Strip: strip jadi video, foto bergerak bergantian tiap 0,5 detik ---------- */
let vidClock=-1; // >=0 hanya saat video dirender
function pickLive(i){ // frame Live Photo yang harus tampil untuk foto ke-i (null = tampilkan foto diam)
  const c=live[i];if(!c)return null;
  if(vidClock>=0){const k=Math.floor((vidClock-i*500)/83);return k>=0&&k<c.length?c[k]:null}
  if(liveIdx===i)return c[Math.floor((performance.now()-liveT)/83)%c.length]; // sedang ditekan & ditahan
  if(liveIdx<0&&autoClock>=0){const k=Math.floor((autoClock-i*500)/83);return k>=0&&k<c.length?c[k]:null} // putar otomatis
  return null;
}
/* ---------- Live otomatis di halaman Hias: foto bergerak sendiri bergantian (tiap 0,5 dtk), berulang ---------- */
let autoClock=-1,autoOn=true,autoRaf=0,autoT0=0,autoLast=-1;
function autoLive(){
  cancelAnimationFrame(autoRaf);autoClock=-1;
  if(!autoOn||!$('edit').classList.contains('on')||!live.some(Boolean))return;
  const one=(N()-1)*500+Math.max(0,...live.map(c=>c?c.length:0))*83+800;
  autoT0=performance.now();autoLast=-1;
  (function f(){
    if(!autoOn||!$('edit').classList.contains('on')){autoClock=-1;return}
    autoClock=(performance.now()-autoT0)%one;
    const k=Math.floor(autoClock/83);if(k!==autoLast&&liveIdx<0){autoLast=k;draw()}
    autoRaf=requestAnimationFrame(f);
  })();
}
function toggleAuto(){autoOn=!autoOn;$('lauto').textContent=autoOn?'⏸ Jeda Live':'▶ Putar Live';autoLive();draw()}
async function dlVid(){
  if(dlVid.busy)return;
  if(!live.some(Boolean))return toast('Belum ada Live Photo — ambil foto dulu');
  if(typeof MediaRecorder==='undefined')return toast('Browser ini belum mendukung perekaman video');
  dlVid.busy=true;toast('Membuat video…');
  try{
    const{W,H}=dims(),s=Math.min(1,1280/H),VC=document.createElement('canvas');
    VC.width=Math.round(W*s/2)*2;VC.height=Math.round(H*s/2)*2;
    const VX=VC.getContext('2d'),sc=VC.width/W,n=N();
    const one=(n-1)*500+Math.max(...live.map(c=>c?c.length:0))*83+800; // satu putaran: tiap foto mulai +0,5 dtk, lalu jeda
    const mt=['video/mp4','video/webm;codecs=vp9','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
    const rec=new MediaRecorder(VC.captureStream(30),mt?{mimeType:mt,videoBitsPerSecond:6e6}:{}),parts=[];
    rec.ondataavailable=e=>{if(e.data.size)parts.push(e.data)};
    const done=new Promise(r=>rec.onstop=r),t0=performance.now();
    rec.start(200);
    await new Promise(res=>{(function f(){const t=performance.now()-t0;vidClock=t%one;paint(VX,sc);if(t<one*2)requestAnimationFrame(f);else res()})()}); // 2 putaran
    vidClock=-1;rec.stop();await done;
    const blob=new Blob(parts,{type:rec.mimeType||'video/webm'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='kotak-studio-live-strip.'+(blob.type.includes('mp4')?'mp4':'webm');a.click();
    setTimeout(()=>URL.revokeObjectURL(url),4000);toast('Video Live Strip diunduh ✦');
  }catch(e){vidClock=-1;toast('Gagal membuat video')}
  dlVid.busy=false;
}
/* ---------- dekorasi template "Duo Quote" (digambar kode, bukan PNG) ---------- */
function spark(x,cx,cy,r){x.beginPath();for(let k=0;k<8;k++){const a=k*Math.PI/4,rr=k%2?r*.28:r;x.lineTo(cx+rr*Math.sin(a),cy-rr*Math.cos(a))}x.closePath();x.fill()}
function quoteLines(q){const w=q.toUpperCase().trim().split(/\s+/),per=Math.ceil(w.length/Math.min(3,w.length)),o=[];for(let i=0;i<w.length;i+=per)o.push(w.slice(i,i+per).join(' '));return o}
function sym(x,t,cx,cy,r){
  if(t==='heart'){x.beginPath();x.moveTo(cx,cy+r*.9);x.bezierCurveTo(cx-r*1.4,cy-r*.2,cx-r*.6,cy-r*1.1,cx,cy-r*.35);x.bezierCurveTo(cx+r*.6,cy-r*1.1,cx+r*1.4,cy-r*.2,cx,cy+r*.9);x.fill()}
  else if(t==='star'){x.beginPath();for(let k=0;k<10;k++){const a=k*Math.PI/5,rr=k%2?r*.45:r;x.lineTo(cx+rr*Math.sin(a),cy-rr*Math.cos(a))}x.closePath();x.fill()}
  else spark(x,cx,cy,r);
}
function deco(x,l,W,H,ink,cap){
  const T=l.tpl;if(T.deco==='hw')return decoHW(x,l,W,H);
  const V=l.vars[l.vi],rx=V.rx||0;x.save();x.fillStyle=x.strokeStyle=ink;
  T.wins.forEach(([wx,wy,ww,wh],i)=>{
    const cx=wx+ww/2,flip=V.flip;
    x.lineWidth=5;x.beginPath();x.roundRect(wx,wy,ww,wh,rx);x.stroke(); // garis tepi foto
    const ly=flip?wy+wh+90:96,qy=flip?wy+wh+215:262; // logo & kutipan di atas (normal) atau di bawah (flip)
    x.textAlign='center';x.textBaseline='middle';x.font="46px 'Kaushan Script',cursive";x.fillText('Kotak Studio',cx,ly);
    [[-175,0,16],[175,0,16],[-200,-28,8],[200,28,8]].forEach(([dx,dy,r])=>sym(x,V.sym||'spark',cx+dx,ly+dy,r));
    x.save();if(V.tilt){x.translate(wx,qy);x.rotate(-.04);x.translate(-wx,-qy)}
    x.textAlign='left';x.textBaseline='alphabetic';x.font="58px 'Permanent Marker',cursive"; // kutipan 3 baris bergaya spidol
    quoteLines(cap||T.quote).forEach((t,k)=>x.fillText(t,wx+[0,70,20][k%3],qy+k*84));x.restore();
    x.save();x.beginPath();if(flip)x.rect(i*W/2,0,W/2,wy-8);else x.rect(i*W/2,wy+wh+10,W/2,H);x.clip(); // kata besar, terpotong di tepi kolom
    x.font="100px 'Knewave',cursive";const fs=100*(W/2*1.3)/x.measureText(T.big).width,by=flip?wy-70:H-110;
    x.font=`${fs}px 'Knewave',cursive`;if(V.tilt){x.translate(i*W/2,by);x.rotate(.03);x.translate(-i*W/2,-by)}
    x.fillText(T.big,i*W/2-20,by);x.restore();
  });
  x.restore();
}
function web(x,cx,cy,sx,sy,r){
  x.beginPath();
  for(let k=0;k<=4;k++){const a=k*Math.PI/8;x.moveTo(cx,cy);x.lineTo(cx+sx*r*Math.cos(a),cy+sy*r*Math.sin(a))}
  for(let j=1;j<=4;j++){const rr=r*j/4;for(let k=0;k<4;k++){const a=k*Math.PI/8,b=(k+1)*Math.PI/8,m=(a+b)/2;
    x.moveTo(cx+sx*rr*Math.cos(a),cy+sy*rr*Math.sin(a));x.quadraticCurveTo(cx+sx*rr*.84*Math.cos(m),cy+sy*rr*.84*Math.sin(m),cx+sx*rr*Math.cos(b),cy+sy*rr*Math.sin(b))}}
  x.stroke();
}
function bgHW(x,l,W,H){ // lapisan latar Halloween: gradasi, jaring laba-laba, kilau acak (di bawah foto)
  const V=l.vars[l.vi],g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,V.bg);g.addColorStop(1,V.bg2);
  x.fillStyle=g;x.fillRect(0,0,W,H);
  x.strokeStyle=V.acc;x.lineWidth=Math.max(1.5,W/380);x.globalAlpha=.35;
  web(x,0,0,1,1,W*.3);web(x,W,0,-1,1,W*.3);web(x,0,H,1,-1,W*.22);web(x,W,H,-1,-1,W*.22);
  x.globalAlpha=.55;x.fillStyle=V.acc;const R=rnd(11);
  for(let i=0;i<46;i++)spark(x,R()*W,R()*H,W*.005+R()*W*.01);
  x.globalAlpha=1;
}
function decoHW(x,l,W,H){ // di atas foto: bingkai, judul, emoji
  const V=l.vars[l.vi],T=l.tpl,top=T.wins[0][1],last=T.wins[T.wins.length-1],bot=last[1]+last[3];
  const E='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  x.save();x.lineJoin='round';
  T.wins.forEach(([wx,wy,ww,wh])=>{
    x.strokeStyle=V.acc;x.lineWidth=W*.012;x.strokeRect(wx,wy,ww,wh);
    x.globalAlpha=.5;x.strokeStyle=V.ink;x.lineWidth=W*.003;x.strokeRect(wx+W*.012,wy+W*.012,ww-W*.024,wh-W*.024);x.globalAlpha=1;
  });
  x.textAlign='center';x.textBaseline='middle';
  const fs=Math.min(W*.13,top*.42);x.font=`${fs}px 'Creepster',cursive`;
  x.fillStyle=V.acc;x.shadowColor=V.acc;x.shadowBlur=fs*.25;x.fillText(T.title,W/2,top*.42);x.shadowBlur=0;
  x.font=`${fs*.3}px 'Space Grotesk',sans-serif`;x.fillStyle=V.ink;x.fillText('· HAPPY HALLOWEEN ·',W/2,top*.42+fs*.62);
  x.strokeStyle=V.ink;x.lineWidth=2;x.beginPath();x.moveTo(W*.94,0);x.lineTo(W*.94,top*.5);x.stroke(); // laba-laba menggantung
  x.font=`${W*.06}px ${E}`;x.fillText('🕷️',W*.94,top*.58);
  x.font=`${W*.085}px ${E}`;['🎃','🦇','👻','💀','🎃'].forEach((e,i)=>x.fillText(e,W*(.12+.19*i),bot+(H-bot)*.2));
  x.font=`${W*.075}px ${E}`;T.wins.forEach(([wx,wy,ww],i)=>x.fillText(i%2?'🦇':'🎃',i%2?wx+ww*.96:wx+ww*.04,wy+W*.012)); // emoji menempel di sudut foto
  x.restore();
}
function decoPrev(d,v){ // pratinjau sederhana untuk kartu layout
  let s=`<g fill="${v.tpl.ink}">`;
  v.tpl.wins.forEach(([x,y,w])=>{s+=`<rect x="${x+w*.2}" y="${d.H*.04}" width="${w*.6}" height="${d.H*.012}" rx="8" opacity=".5"/><rect x="${x}" y="${d.H*.12}" width="${w*.75}" height="${d.H*.02}" rx="9"/><rect x="${x}" y="${d.H*.16}" width="${w*.55}" height="${d.H*.02}" rx="9"/><rect x="${x}" y="${d.H*.76}" width="${w*.98}" height="${d.H*.15}" rx="${d.H*.07}"/>`});
  return s+'</g>';
}
['46px "Kaushan Script"','58px "Permanent Marker"','100px Knewave','60px Creepster'].forEach(f=>document.fonts.load(f).then(()=>{if($('edit').classList.contains('on'))draw()}));
/* ---------- unduh frame saja (PNG transparan, tanpa foto/stiker/doodle) ---------- */
let frameOnly=false;
function dlFrame(){
  const{W,H}=dims(),s=L[lay].tpl?1:2,o=document.createElement('canvas');o.width=W*s;o.height=H*s;
  const old=sel,ac=autoClock,li=liveIdx;sel=-1;autoClock=-1;liveIdx=-1;frameOnly=true;
  try{paint(o.getContext('2d'),s)}finally{frameOnly=false;sel=old;autoClock=ac;liveIdx=li}
  o.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='kotak-studio-frame.png';a.click();toast('Frame (PNG transparan) diunduh ✦')},'image/png');
}
/* ---------- unduh ---------- */
function dl(){
  const{W,H}=dims(),s=L[lay].tpl?1:2,o=document.createElement('canvas');o.width=W*s;o.height=H*s;
  const old=sel,ac=autoClock,li=liveIdx;sel=-1;autoClock=-1;liveIdx=-1;paint(o.getContext('2d'),s);sel=old;autoClock=ac;liveIdx=li; // hasil unduhan selalu foto diam
  o.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='kotak-studio-strip.png';a.click();toast('Strip HD diunduh ✦')},'image/png');
}
$('rvbtn').onclick=openReview;$('rvclose').onclick=closeReview;
$('rvgo').onclick=()=>{closeReview();go('edit')};
$('rvall').onclick=()=>{closeReview();session()};
$('rv').onclick=e=>{if(e.target===$('rv'))closeReview()};
addEventListener('keydown',e=>{if(e.key==='Escape')closeReview()});
function syncCamUI(){$('zoom').value=CAM.zoom;$('bri').value=CAM.bri;$('con').value=CAM.con;applyCam()}
$('csbtn').onclick=()=>{$('camset').hidden=!$('camset').hidden};
$('zoom').oninput=()=>{CAM.zoom=+$('zoom').value;applyCam()};
$('bri').oninput=()=>{CAM.bri=+$('bri').value;applyCam()};
$('con').oninput=()=>{CAM.con=+$('con').value;applyCam()};
$('mir').onchange=()=>{CAM.mir=$('mir').checked;applyCam()};
$('camsel').onchange=()=>{CAM.dev=$('camsel').value;CAM.mir=null;cam()};
$('csreset').onclick=()=>{Object.assign(CAM,{zoom:1,bri:1,con:1,mir:null});syncCamUI()};
syncCamUI();
if(sessionStorage.getItem('ks_wip'))$('wip').hidden=true;
$('wipx').onclick=()=>{$('wip').hidden=true;sessionStorage.setItem('ks_wip','1')};
go('home');