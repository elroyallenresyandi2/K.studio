const $=id=>document.getElementById(id);
const L={s4:{n:'Strip 4',c:1,r:4,ar:4/3},s3:{n:'Strip 3',c:1,r:3,ar:4/3},g4:{n:'Grid 2×2',c:2,r:2,ar:1},p1:{n:'Polaroid',c:1,r:1,ar:1}};
L.rc={n:'Reality Club',c:1,r:3,ar:4/3,bg:'#070101',tpl:{src:'frames/reality-club.png',w:862,h:2518,wins:[[62,551,738,554],[62,1160,738,554],[62,1768,738,554]]}}; // template desain sendiri: jendela foto = posisi kotak abu-abu di PNG
const RCV=[{n:'Merah',src:'frames/reality-club.png',bg:'#070101',ink:'#f5f5f5',c:'#ff0000'},{n:'Biru',src:'frames/reality-club-biru.png',bg:'#070101',ink:'#f5f5f5',c:'#0066ff'},{n:'Pink',src:'frames/reality-club-pink.png',bg:'#070101',ink:'#f5f5f5',c:'#ff2d96'},{n:'Hijau',src:'frames/reality-club-hijau.png',bg:'#070101',ink:'#f5f5f5',c:'#18c860'},{n:'Ungu',src:'frames/reality-club-ungu.png',bg:'#070101',ink:'#f5f5f5',c:'#8c3cff'},{n:'Putih',src:'frames/reality-club-putih.png',bg:'#f8f4ee',ink:'#0f0808',c:'#ff2828'}];
L.rc.vars=RCV;L.rc.vi=0; // varian warna template
function applyVar(k,i){const l=L[k],v=l.vars[i];l.vi=i;l.bg=v.bg;l.tpl.src=v.src;l.tpl.ink=v.ink}
function setVar(i){applyVar(lay,i)}
applyVar('rc',1); // Reality Club default: biru
const FRV=[{n:'Amber',src:'frames/film-roll.png',bg:'#14100d',ink:'#f2a516',c:'#f2a516'},{n:'Biru',src:'frames/film-roll-biru.png',bg:'#0a1020',ink:'#6aa7ff',c:'#6aa7ff'}];
L.fr={n:'Film Roll',c:1,r:4,ar:4/3,bg:'#14100d',vars:FRV,vi:0,tpl:{src:'frames/film-roll.png',w:720,h:2102,ink:'#f2a516',notitle:true,wins:[[79,119,562,422],[79,583,562,422],[79,1047,562,422],[79,1511,562,422]]}};
const TK=()=>L[lay].tpl?L[lay].tpl.w/580:1; // skala stiker/doodle/teks mengikuti lebar frame
const PAD=40,GAP=24,BOT=120,CW=500;
let lay='s4',stream=null,face='user',photos=[],imgs=[],busy=false;
let frame='#ffffff',pat='Polos',shape='Kotak',filt='Normal',stks=[],sel=-1,D=[],doodling=false;
const PATS=['Polos','Titik','Hati','Bintang','Konfeti'],SHAPES=['Kotak','Rounded','Oval'];
const FILT={Normal:'none',HitamPutih:'grayscale(1)',Sepia:'sepia(.8)',Hangat:'saturate(1.3) sepia(.25) brightness(1.05)',Dingin:'saturate(1.1) hue-rotate(15deg) brightness(1.03)',Pudar:'contrast(.85) brightness(1.1) saturate(.8)'};
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
const DESC={s4:'Strip klasik ala photobooth, 4 pose.',s3:'3 pose — pas untuk berdua atau bertiga.',g4:'Kotak 2×2, enak untuk feed.',p1:'1 foto besar bergaya polaroid.',rc:'Frame desain Reality Club, 3 pose.',fr:'Roll film analog dengan lubang sprocket, 4 pose.'};
function lsvg(k,h){ // pratinjau akurat: posisi & rasio foto sama persis dengan hasil akhir
  const o=lay;lay=k;const d=dims(),v=L[k];let r='';
  for(let i=0;i<v.c*v.r;i++){const[x,y,w,hh]=winRect(i);r+=`<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${v.tpl?40:w*.08}" fill="#d9d9d9"/>`}
  lay=o;
  const top=v.tpl?`<image href="${v.tpl.src}" width="${d.W}" height="${d.H}"/>`:`<rect x="${d.W*.32}" y="${d.H-BOT*.6}" width="${d.W*.36}" height="9" rx="4.5" fill="#999" opacity=".6"/>`;
  return `<svg viewBox="0 0 ${d.W} ${d.H}" style="height:${h}px;width:auto;border-radius:6px"><rect width="${d.W}" height="${d.H}" fill="${v.bg||'#fff'}"/>${r}${top}</svg>`;
}
function renderPanel(){
  const v=L[lay],o=lay,d=dims();
  $('lprev').innerHTML=lsvg(lay,300);$('lvar').innerHTML=v.vars?varsHtml(v):'';
  $('linfo').innerHTML=`<b>${v.n}</b><span>${DESC[lay]||''}</span><small>${v.c*v.r} foto · hasil ${v.tpl?d.W+' × '+d.H:d.W*2+' × '+d.H*2} px</small>`;
}
const varsHtml=v=>`<div class="lab" style="margin-top:4px">Variasi warna</div><div class="sw" style="justify-content:center">${v.vars.map((x,i)=>`<i class="${i===v.vi?'sel':''}" title="${x.n}" data-v="${i}" style="background:linear-gradient(135deg,${x.bg} 50%,${x.c} 50%)"></i>`).join('')}</div>`;
function renderEvar(){const v=L[lay];$('evar').innerHTML=v.vars?v.vars.map((x,i)=>`<i class="${i===v.vi?'sel':''}" title="${x.n}" data-v="${i}" style="background:linear-gradient(135deg,${x.bg} 50%,${x.c} 50%)"></i>`).join(''):''}
function chooseVar(e){const i=e.target.dataset.v;if(i===undefined)return;setVar(+i);
  const c=document.querySelector('#lg [data-k='+lay+'] .pv');if(c)c.innerHTML=lsvg(lay,140);
  renderPanel();if($('edit').classList.contains('on')){renderEvar();draw()}}
$('lvar').onclick=$('evar').onclick=chooseVar;
$('lg').innerHTML=Object.entries(L).map(([k,v])=>`<button class="card ${k===lay?'sel':''}" data-k="${k}" onclick="pick('${k}')" ondblclick="startLayout()"><div class="pv">${lsvg(k,140)}</div>${v.n}<small>${v.c*v.r} foto</small></button>`).join('');
renderPanel();
function pick(k){lay=k;document.querySelectorAll('#lg .card').forEach(c=>c.classList.toggle('sel',c.dataset.k===k));renderPanel()}
function startLayout(){photos=[];imgs=[];stks=[];D=[];live.length=0;go('foto')}
/* ---------- kamera ---------- */
const N=()=>L[lay].c*L[lay].r;
function buildSlots(){
  $('box').style.aspectRatio=L[lay].ar;$('slots').style.setProperty('--ar',L[lay].ar);
  $('slots').innerHTML=Array.from({length:N()},(_,i)=>`<div class="slot" onclick="retake(${i})">${photos[i]?`<img src="${photos[i]}">${live[i]?'<b class="lv">LIVE</b>':''}`:i+1}</div>`).join('');
  $('nx').disabled=!photos.some(Boolean);
}
async function cam(){
  try{stopCam();stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:face,width:{ideal:1280},height:{ideal:960}},audio:false});
    $('v').srcObject=stream;await $('v').play();startBuf();$('v').style.transform=face==='user'?'scaleX(-1)':'none';$('go').disabled=false;$('st').textContent='Kamera siap!'}
  catch(e){$('st').textContent='❌ '+e.message}
}
function stopCam(){stopBuf();if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;$('go').disabled=true}}
function flip(){face=face==='user'?'environment':'user';cam()}
function shot(){ // crop tengah sesuai rasio layout -> tidak ada gambar gepeng
  const v=$('v'),vw=v.videoWidth,vh=v.videoHeight,ar=L[lay].ar;
  let sw=vw,sh=vw/ar;if(sh>vh){sh=vh;sw=vh*ar}
  const c=document.createElement('canvas');c.width=sw;c.height=sh;const x=c.getContext('2d');
  if(face==='user'){x.translate(sw,0);x.scale(-1,1)}
  x.drawImage(v,(vw-sw)/2,(vh-sh)/2,sw,sh,0,0,sw,sh);
  $('fl').classList.remove('go');void $('fl').offsetWidth;$('fl').classList.add('go');
  return c.toDataURL('image/jpeg',.92);
}
async function count(n){for(let i=n;i>0;i--){$('cd').innerHTML='<b>'+i+'</b>';await new Promise(r=>setTimeout(r,1000))}$('cd').textContent=''}
async function take(i){$('box').classList.add('live');await count(+$('tm').value);photos[i]=shot();imgs[i]=null;live[i]=null;const pre=buf.slice();setTimeout(()=>{live[i]=pre.concat(buf.slice(-14));buildSlots()},1250);buildSlots();$('slots').children[i].classList.add('pop');$('box').classList.remove('live')}
async function session(){
  if(busy||!stream)return;busy=true;$('go').disabled=true;photos=[];imgs=[];live.length=0;buildSlots();
  for(let i=0;i<N();i++){$('st').textContent=`Foto ${i+1} dari ${N()} — bersiap…`;await take(i);await new Promise(r=>setTimeout(r,700))}
  $('st').textContent='🎉 Selesai! Klik foto untuk mengulang, atau lanjut.';$('go').disabled=false;busy=false;
}
async function retake(i){
  if(busy)return;if(!stream)return toast('Nyalakan kamera dulu');
  busy=true;$('st').textContent=`Mengulang foto ${i+1}…`;await take(i);$('st').textContent='✅ Foto diganti';busy=false;
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
function clip(x,px,py,w,h){x.beginPath();
  if(shape==='Oval')x.ellipse(px+w/2,py+h/2,w/2,h/2,0,0,7);
  else x.roundRect(px,py,w,h,shape==='Rounded'?w*.08:0);x.clip()}
const TPLI={};
function tplImg(s){ // muat PNG frame; kalau tidak ada di frames/, coba folder yang sama, lalu beri tahu
  if(TPLI[s])return TPLI[s];
  const im=TPLI[s]=new Image();let retry=false;
  im.onload=draw;
  im.onerror=()=>{if(!retry&&s.includes('/')){retry=true;im.src=s.split('/').pop()}else toast('⚠️ Frame tidak ditemukan. Taruh reality-club.png di folder "frames" di samping index.html')};
  im.src=s;return im;
}
function getImg(i){return imgs[i]||(imgs[i]=Object.assign(new Image(),{src:photos[i],onload:draw}))}
function paint(x,s){ // gambar seluruh strip pada skala s
  const{l,cw,ch,W,H}=dims(),ink=l.tpl?(l.tpl.ink||'#f5f5f5'):(lum(frame)>.55?'#222':'#f5f5f5');
  x.save();x.scale(s,s);x.fillStyle=l.tpl?l.bg:frame;x.fillRect(0,0,W,H);if(!l.tpl)pattern(x,W,H,ink);
  for(let i=0;i<l.c*l.r;i++){
    const T=l.tpl,w=T&&T.wins[i],px=T?w[0]:PAD+(i%l.c)*(cw+GAP),py=T?w[1]:PAD+Math.floor(i/l.c)*(ch+GAP),pw=T?w[2]:cw,ph=T?w[3]:ch;
    x.save();if(!T)clip(x,px,py,pw,ph);x.fillStyle=T?'#d9d9d9':'rgba(128,128,128,.25)';x.fillRect(px,py,pw,ph);
    if(photos[i]){const lf=pickLive(i),im=lf||getImg(i);if(lf||(im.complete&&im.naturalWidth)){x.filter=FILT[filt];x.drawImage(im,px,py,pw,ph);x.filter='none'}}
    x.restore();
  }
  if(l.tpl){const t=tplImg(l.tpl.src);if(t.complete&&t.naturalWidth)x.drawImage(t,0,0,W,H)} // frame desainmu menutupi foto, hanya jendela yang terlihat
  const tk=TK(),by=l.tpl?(l.tpl.wins.at(-1)[1]+l.tpl.wins.at(-1)[3]+H)/2:H-BOT/2-8;x.fillStyle=ink;x.textAlign='center';x.textBaseline='middle';
  const cap=$('cap').value.trim();
  const nt=l.tpl&&l.tpl.notitle&&!cap; // template yang sudah punya judul sendiri tidak diberi judul ganda
  if(!nt){x.font=`900 ${34*tk}px 'Playfair Display',serif`;x.fillText(cap||'Kotak Studio',W/2,by-(cap?0:12*tk))}
  if($('dt').checked){x.font=`500 ${20*tk}px 'Space Grotesk',sans-serif`;x.globalAlpha=.7;
    x.fillText(new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}),W/2,by+(nt?0:28*tk));x.globalAlpha=1}
  stks.forEach(k=>{x.save();x.translate(k.x*W,k.y*H);x.rotate(k.a);x.scale(k.f*k.z*tk,k.z*tk);x.font='80px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(k.e,0,0);x.restore()});
  D.forEach(p=>{x.strokeStyle=p.c;x.lineWidth=p.w*tk;x.lineCap=x.lineJoin='round';x.beginPath();p.p.forEach(([a,b],j)=>j?x.lineTo(a*W,b*H):x.moveTo(a*W,b*H));if(p.p.length===1)x.lineTo(p.p[0][0]*W+.1,p.p[0][1]*H);x.stroke()});
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
    let sw=v.videoWidth,sh=sw/ar;if(sh>v.videoHeight){sh=v.videoHeight;sw=sh*ar}
    BX.save();if(face==='user'){BX.translate(400,0);BX.scale(-1,1)}
    BX.drawImage(v,(v.videoWidth-sw)/2,(v.videoHeight-sh)/2,sw,sh,0,0,400,h);BX.restore();
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
/* ---------- unduh ---------- */
function dl(){
  const{W,H}=dims(),s=L[lay].tpl?1:2,o=document.createElement('canvas');o.width=W*s;o.height=H*s;
  const old=sel,ac=autoClock,li=liveIdx;sel=-1;autoClock=-1;liveIdx=-1;paint(o.getContext('2d'),s);sel=old;autoClock=ac;liveIdx=li; // hasil unduhan selalu foto diam
  o.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='kotak-studio-strip.png';a.click();toast('Strip HD diunduh ✦')},'image/png');
}
go('home');