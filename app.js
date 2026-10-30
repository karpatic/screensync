import {PeerClock} from './peer-sync.js?v=1.0.0';
import {LAYOUTS, validConfig, defaultConfig, tileRect, roomName} from './layout.js?v=1.0.0';
import {ghostPosition} from './ghost-motion.js?v=1.0.0';
import {serverDate} from './clock-http.js?v=1.0.0';
const params = new URLSearchParams(location.search);
function stored(storage,key,fallback) {try{return JSON.parse(storage.getItem(key)) ?? fallback;}catch{return fallback;}}
function save(storage,key,value) {try{storage.setItem(key,JSON.stringify(value));}catch{ /* Storage may be disabled. */ }}
function safeStorage(name) {try{return window[name];}catch{return {getItem:()=>null,setItem:()=>{}};}}
const sessionStore=safeStorage('sessionStorage'),localStore=safeStorage('localStorage');
const savedDevice = stored(sessionStore,'screensync-device',{});
let room = roomName(params.get('room') || savedDevice.room);
const raw = params.get('screen') ?? params.get('n');
let screen = raw!==null && /^[0-9]$/.test(raw) ? Number(raw) : savedDevice.room===room && Number.isInteger(savedDevice.screen) ? savedDevice.screen : null;
let preview = params.has('preview') || (raw===null && savedDevice.room===room && savedDevice.preview===true);
let config = readConfig(room), welcome;
const writer = window.crypto && typeof window.crypto.randomUUID==='function' ? window.crypto.randomUUID() : `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
function readConfig(key) {const value=stored(localStore,`screensync-room:${key}`,null);return validConfig(value)&&value.revision>0?value:defaultConfig();}
const canvas = document.querySelector('#art'), ctx = canvas.getContext('2d');
const syncLabel = document.querySelector('#sync'), setup = document.querySelector('#setup');
let offset = 0, anchor = Date.now() - performance.now(), clockQuality = 'Device clock';
const manual = Number(params.get('offset')) || 0;
const baseNow = () => anchor + performance.now();
const now = () => baseNow() + offset + manual;
let peerClock, peerStatus, generation=0;
const count = () => config.columns*config.rows;
function updateStatus() {
  syncLabel.textContent = peerStatus?.following ? peerStatus.text : `${peerStatus?.text || 'Starting P2P'} · ${clockQuality}`;
  document.querySelector('#room-status').textContent = peerClock ? peerStatus?.text || 'Finding screens…' : `${peerStatus?.text || 'Server clock'} · ${clockQuality}`;
}
function rememberDevice() {
  save(sessionStore,'screensync-device',{room,screen,preview});
  const query=new URLSearchParams(location.search);
  for(const key of ['screen','n','preview','release'])query.delete(key);
  query.set('room',room);history.replaceState(null,'',`?${query}`);
}
function setDevice(number, full=false) {
  screen=number;preview=full;rememberDevice();refreshUI();connectPeers();
}
function refreshUI() {
  const valid=screen===0 || tileRect(screen,config)!==null;
  welcome=!preview && (screen===0 || !valid);
  document.body.className=welcome?'welcome':'wall';
  document.querySelector('#room-title').textContent=room;
  document.querySelector('#tools a').href=`?room=${encodeURIComponent(room)}&screen=0`;
  document.querySelector('#layout-summary').textContent=`${config.columns} across × ${config.rows} down · ${count()} wall screens${config.columns===1&&config.rows===5?' · The wandering ghost':''}`;
  document.querySelector('#identity').textContent=preview?`FULL WALL / ${config.columns} × ${config.rows}`:screen===0?'WELCOME / SCREEN 0':`SCREEN ${screen} / ${Math.floor((screen-1)/config.columns)+1}:${(screen-1)%config.columns+1}`;
  const nav=document.querySelector('#screens');nav.style.gridTemplateColumns=`repeat(${config.columns},42px)`;if(window.screenSyncLegacy)nav.style.width=`${config.columns*48}px`;nav.replaceChildren();
  for(let n=1;n<=count();n++){const button=document.createElement('button');button.textContent=n;button.setAttribute('aria-label',`Use screen ${n}`);button.onclick=()=>setDevice(n);nav.append(button);}
  fillSetup();
  if(!valid && screen!==null){document.querySelector('#setup-note').textContent=`Screen ${screen} is outside this room's new layout. Choose a new position.`;openSetup();}
}
function formationOptions(total, selected) {
  const select=document.querySelector('#formation');select.replaceChildren();
  for(const item of LAYOUTS.filter(l=>l.columns*l.rows===total)){const option=document.createElement('option');option.value=`${item.columns}x${item.rows}`;option.textContent=item.label;select.append(option);}
  if(selected)select.value=selected;
  drawLayoutMap();
}
function drawLayoutMap() {
  const [columns,rows]=document.querySelector('#formation').value.split('x').map(Number);
  const map=document.querySelector('#layout-map');map.style.gridTemplateColumns=`repeat(${columns},1fr)`;map.setAttribute('data-columns',columns);map.replaceChildren();
  for(let n=1;n<=columns*rows;n++){const tile=document.createElement('span');tile.textContent=n;map.append(tile);}
}
function fillSetup() {
  document.querySelector('#room-key').value=room;
  document.querySelector('#device-count').value=String(count());
  formationOptions(count(),`${config.columns}x${config.rows}`);
  const select=document.querySelector('#screen-number');select.replaceChildren();
  for(const [value,label] of [['setup','Choose a position…'],['0','0 — Welcome display'],...Array.from({length:count()},(_,i)=>[String(i+1),`${i+1} — row ${Math.floor(i/config.columns)+1}, column ${i%config.columns+1}`]),['preview','Preview the entire wall']]){
    const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);
  }
  select.value=preview?'preview':screen===null||screen>count()?'setup':String(screen);
}
function openSetup(){if(!setup.open)setup.showModal();}
document.querySelector('#configure').onclick=()=>{fillSetup();openSetup();};
document.querySelector('#configure-welcome').onclick=()=>{fillSetup();openSetup();};
document.querySelector('#preview-wall').onclick=()=>setDevice(null,true);
document.querySelector('#tools a').onclick=event=>{event.preventDefault();setDevice(0);};
document.querySelector('#device-count').onchange=event=>formationOptions(Number(event.target.value));
document.querySelector('#formation').onchange=drawLayoutMap;
document.querySelector('#join-room').onsubmit=event=>{
  event.preventDefault();const next=roomName(document.querySelector('#room-key').value);
  if(next!==room){room=next;config=readConfig(room);screen=null;preview=false;offset=0;rememberDevice();refreshUI();connectPeers();}
  document.querySelector('#setup-note').textContent=peerClock?`Joined ${room}. Connected devices share the room's layout. Choose this device's position below.`:`Joined ${room}. Choose the same arrangement on each tablet, then pick this device's number.`;
};
document.querySelector('#layout-form').onsubmit=event=>{
  event.preventDefault();
  if(roomName(document.querySelector('#room-key').value)!==room){document.querySelector('#setup-note').textContent='Join the new room before saving its layout.';return;}
  const [columns,rows]=document.querySelector('#formation').value.split('x').map(Number);
  const next={columns,rows,revision:config.revision+1,writer};
  if(!validConfig(next))return;
  if(peerClock)peerClock.acceptConfig(next);else applyConfig(next);
  document.querySelector('#setup-note').textContent=peerClock?`Saved ${columns} across × ${rows} down for ${room}. This device and connected peers now use that layout.`:`Saved ${columns} across × ${rows} down on this device. Select the same arrangement on each tablet; clocks align automatically.`;
};
document.querySelector('#device-form').onsubmit=event=>{
  event.preventDefault();
  if(roomName(document.querySelector('#room-key').value)!==room){document.querySelector('#setup-note').textContent='Join the new room before choosing this device’s position.';return;}
  const value=document.querySelector('#screen-number').value;
  if(value==='setup'){document.querySelector('#setup-note').textContent='Choose a numbered screen, welcome display, or preview.';return;}
  setDevice(value==='preview'?null:Number(value),value==='preview');setup.close();
};
function applyConfig(next) {config={...next};save(localStore,`screensync-room:${room}`,config);refreshUI();}
function connectPeers() {
  const current=++generation;peerClock?.stop();peerStatus=null;
  if(!window.screenSyncLegacy && window.Peer && window.RTCPeerConnection){
    peerClock=new PeerClock({Peer:window.Peer,room,slot:preview||screen===null?10:screen,config,
      baseNow,logicalNow:()=>baseNow()+offset,onOffset:value=>{if(current===generation)offset=value;},
      onConfig:value=>{if(current===generation)applyConfig(value);},
      onStatus:value=>{if(current===generation){peerStatus=value;updateStatus();}}});
    peerClock.start().catch(()=>{if(current===generation){peerStatus={text:'P2P unavailable · using UTC'};updateStatus();}});
  }else{peerClock=null;peerStatus={text:window.screenSyncLegacy?'Tablet mode · server clock':'WebRTC unavailable · server clock'};updateStatus();
    document.querySelector('#setup-note').textContent='Select the same layout on each tablet. Server-clock timing is automatic; peer connections are unavailable in this browser.';}
}
refreshUI();connectPeers();if(screen===null&&!preview)openSetup();
addEventListener('pagehide',event=>{if(!event.persisted)peerClock?.stop();});
// The server Date header is UTC, at whole-second precision. Midpoint correction
// bounds typical phase uncertainty to about half a second plus network latency.
async function syncClock() {
  const samples = [];
  for (let i = 0; i < 3; i++) {
    try {
      const start = performance.now();
      const date = await serverDate(`./?clock=${Date.now()}-${i}-${Math.random()}`);
      const end = performance.now();
      if (Number.isFinite(date)) samples.push({rtt:end-start, offset:date+500-(anchor+(start+end)/2)});
    } catch { /* Continue on the monotonic device clock when offline. */ }
  }
  if (samples.length) {
    const best = samples.sort((a,b) => a.rtt-b.rtt)[0];
    if (!peerClock?.following && !(peerStatus?.count > 1)) offset = best.offset;
    clockQuality = `UTC aligned · ±${Math.ceil(500+best.rtt/2)} ms`;
  } else clockQuality = 'Device clock · network sync unavailable';
  updateStatus();
}
syncClock(); setInterval(syncClock, 120000);
document.addEventListener('visibilitychange', () => {if (!document.hidden) syncClock();});
document.querySelector('#calibrate').onclick = syncClock;
document.querySelector('#fullscreen').onclick = () => {
  const element=document.documentElement,request=element.requestFullscreen||element.webkitRequestFullscreen;
  if(!request){syncLabel.textContent='On iPad: Share → Add to Home Screen, then open the saved icon for fullscreen.';return;}
  try{const result=request.call(element);if(result&&result.catch)result.catch(()=>{syncLabel.textContent='Use the browser fullscreen command';});}catch{syncLabel.textContent='Use the browser fullscreen command';}
};
let hideTimer;
function showTools() {document.querySelector('#tools').classList.remove('hidden');clearTimeout(hideTimer);hideTimer=setTimeout(hideTools,6000);}
function hideTools(){document.querySelector('#tools').classList.add('hidden');}
document.querySelector('#hide').onclick=hideTools;
document.addEventListener('pointermove',showTools);document.addEventListener('pointerdown',showTools);document.addEventListener('touchstart',showTools);
document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;const key=(e.key||String.fromCharCode(e.which||e.keyCode||0)).toLowerCase();if(key==='h')showTools();if(key==='f')document.querySelector('#fullscreen').click();});showTools();
let W,H;function resize(){const d=Math.min(devicePixelRatio||1,window.screenSyncLegacy?1:1.5);W=canvas.width=Math.round(innerWidth*d);H=canvas.height=Math.round(innerHeight*d);}addEventListener('resize',resize);resize();
const TAU=Math.PI*2, fract=x=>x-Math.floor(x), random=i=>fract(Math.sin(i*127.1+311.7)*43758.5453);
function ellipse(x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,Math.max(.001,ry),0,0,TAU);ctx.fill();}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function background(t){ctx.fillStyle='#08060e';ctx.fillRect(0,0,3000,1800);glow(1500+Math.sin(t*.13)*500,900,1500,'#241134');for(let i=0;i<120;i++){const x=random(i)*3000,y=fract(random(i+500)-t*(.002+random(i)*.003))*1800;ellipse(x,y,1+random(i+77)*3,1+random(i+77)*3,`rgba(235,167,108,${.12+.22*Math.sin(t*.6+i)**2})`);}for(let i=0;i<9;i++){const x=1500+Math.sin(t*.09+i*1.8)*1700,y=1300+Math.sin(t*.14+i)*450;glow(x,y,700,'rgba(48,29,53,0.1451)');}}
function eye(t){glow(1500,900,1250,'rgba(97,45,36,0.2667)');const blink=Math.max(.025,1-Math.pow(Math.max(0,Math.cos(t*.35)),40));ctx.save();ctx.translate(1500,900);ctx.scale(1,blink);ctx.beginPath();ctx.moveTo(-1150,0);ctx.bezierCurveTo(-600,-700,600,-700,1150,0);ctx.bezierCurveTo(600,700,-600,700,-1150,0);ctx.fillStyle='#e4bfa2';ctx.shadowColor='#e6793c';ctx.shadowBlur=80;ctx.fill();ctx.shadowBlur=0;ctx.clip();const x=Math.sin(t*.34)*320,y=Math.sin(t*.27)*90;ellipse(x,y,435,435,'#6e351c');for(let i=0;i<160;i++){const a=i/160*TAU;ctx.strokeStyle=i%3?'#c47b32':'#f4ba61';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*190,y+Math.sin(a)*190);ctx.lineTo(x+Math.cos(a+.025)*420,y+Math.sin(a+.025)*420);ctx.stroke();}ellipse(x,y,145+Math.sin(t*.9)*12,310,'#09070e');ellipse(x-120,y-150,60,60,'rgba(255,232,206,0.6667)');ctx.restore();}
function ghost(x,y,s,t){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.shadowColor='#b3e4d3';ctx.shadowBlur=65;ctx.fillStyle='rgba(197,227,214,0.8667)';ctx.beginPath();ctx.moveTo(-100,80);ctx.lineTo(-100,-20);ctx.bezierCurveTo(-100,-160,100,-160,100,-20);ctx.lineTo(100,80);for(let j=0;j<=8;j++)ctx.lineTo(100-j*25,80+Math.sin(j*1.3+t*2)*20);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ellipse(-35,-25,14,23,'#142330');ellipse(35,-25,14,23,'#142330');ellipse(0,30,13,20+Math.sin(t)*5,'#142330');ctx.restore();}
function ghosts(t){for(let i=0;i<13;i++){const s=.8+random(i+20)*1.9;const x=fract(random(i+9)+t*(.012+random(i)*.006))*3900-450,y=200+random(i+38)*1400+Math.sin(t*.8+i)*110;ghost(x,y,s,t+i);}}
function pumpkin(t){ctx.save();ctx.translate(1500,960);ctx.rotate(Math.sin(t*.25)*.035);glow(0,0,1150,'rgba(179,67,23,0.2667)');ctx.fillStyle='#4e5129';ctx.beginPath();ctx.moveTo(-85,-490);ctx.quadraticCurveTo(-140,-790,120,-720);ctx.lineTo(100,-640);ctx.quadraticCurveTo(-30,-680,30,-490);ctx.fill();for(let i=-2;i<=2;i++)ellipse(i*205,0,390-Math.abs(i)*35,540-Math.abs(i)*25,['#a64019','#c4511d','#db6123','#bd4819','#9a3519'][i+2]);const light=ctx.createRadialGradient(0,-50,0,0,-50,800);light.addColorStop(0,'#fff4b5');light.addColorStop(1,'#ff9d2c');ctx.fillStyle=light;ctx.shadowColor='#ffb54f';ctx.shadowBlur=35+Math.sin(t*2)*10;ctx.beginPath();ctx.moveTo(-510,-80);ctx.lineTo(-170,-130);ctx.lineTo(-360,-330);ctx.closePath();ctx.moveTo(510,-80);ctx.lineTo(170,-130);ctx.lineTo(360,-330);ctx.closePath();ctx.moveTo(-70,65);ctx.lineTo(0,-65);ctx.lineTo(70,65);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-510,130);for(let i=0;i<=12;i++)ctx.lineTo(-510+i*85,190+Math.sin(i*2.3)*50);ctx.quadraticCurveTo(0,660,-510,130);ctx.fill();ctx.restore();}
function portal(t){ctx.save();ctx.translate(1500,900);glow(0,0,1400,'rgba(105,35,160,0.2667)');for(let i=24;i>=0;i--){const r=90+i*43+Math.sin(t*.9-i*.3)*20;ctx.save();ctx.rotate(t*.05+i*.15);ctx.strokeStyle=`hsla(${265+i*2},75%,${35+i},${.2+i*.02})`;ctx.lineWidth=3+i*.3;ctx.beginPath();for(let j=0;j<=180;j++){const a=j/180*TAU,rr=r+Math.sin(a*7+t*.9+i*.4)*20;const x=Math.cos(a)*rr,y=Math.sin(a)*rr*.72;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.restore();}ellipse(0,0,100,70,'#050409');ctx.restore();for(let i=0;i<24;i++){const x=fract(random(i+75)+t*.027)*3600-300,y=100+random(i+45)*1600+Math.sin(t+i)*90,s=20+random(i)*40;ctx.fillStyle='#050409';ctx.beginPath();ctx.moveTo(x,y+10);ctx.quadraticCurveTo(x-s,y-s*Math.sin(t*5+i),x-s*2,y);ctx.lineTo(x-s*.7,y+20);ctx.lineTo(x,y+12);ctx.lineTo(x+s*.7,y+20);ctx.lineTo(x+s*2,y);ctx.quadraticCurveTo(x+s,y-s*Math.sin(t*5+i),x,y+10);ctx.fill();}}
// The tower uses screen-proportional coordinates so the ghost stays round,
// rather than being stretched across the five-screen installation.
function ghostTower(t){
  ctx.save();ctx.scale(3,.6);
  ctx.fillStyle='#050a12';ctx.fillRect(0,0,1000,3000);
  for(let row=0;row<5;row++){
    glow(500,300+row*600,620,'rgba(16,43,51,0.2667)');
    ctx.strokeStyle='rgba(139,199,198,0.0863)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(125,600*row+520);ctx.lineTo(125,600*row+240);
    ctx.bezierCurveTo(125,600*row-20,875,600*row-20,875,600*row+240);
    ctx.lineTo(875,600*row+520);ctx.stroke();
  }
  for(let i=0;i<(window.screenSyncLegacy?80:190);i++){
    const x=random(i+1200)*1000,y=fract(random(i+1600)-t*(.001+random(i)*.0005))*3000;
    ellipse(x,y,1+random(i)*2,1+random(i)*2,`rgba(173,220,211,${.08+.18*Math.sin(t*.5+i)**2})`);
  }
  for(let i=window.screenSyncLegacy?8:16;i>0;i--){const past=ghostPosition(t-i*.14);glow(past.x,past.y,100+i*3,`rgba(123,218,207,${.012*(1-i/18)})`);}
  const position=ghostPosition(t);
  glow(position.x,position.y,360,'rgba(128,213,207,0.1412)');
  ctx.save();ctx.translate(position.x,position.y);ctx.rotate(Math.sin(t*.7)*.055);
  // A soft living silhouette, with a little face and fluttering scalloped hem.
  ghost(0,0,1.6,t);ctx.restore();
  for(let i=0;i<5;i++){
    const a=t*.8+i*TAU/5;
    ellipse(position.x+Math.cos(a)*190,position.y+Math.sin(a)*165,2.5,2.5,'rgba(216,238,228,0.6667)');
  }
  ctx.restore();
}
const scenes=[eye,ghosts,pumpkin,portal];
let lastFrame=-100;
function render(){
  if(window.screenSyncLegacy){const stamp=performance.now();if(stamp-lastFrame<32){requestAnimationFrame(render);return;}lastFrame=stamp;}
  const t=now()/1000,phase=((t%120)+120)%120,index=Math.floor(phase/30),local=phase%30;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);
  const full=welcome||preview,rect=full?{x:0,y:0,width:3000,height:1800}:tileRect(screen,config);
  if(rect){
    const tower=!welcome&&config.columns===1&&config.rows===5;
    let drawW=W,drawH=H;
    if(preview&&tower){drawW=Math.min(W,H/3);drawH=drawW*3;ctx.translate((W-drawW)/2,(H-drawH)/2);}
    ctx.scale(drawW/rect.width,drawH/rect.height);ctx.translate(-rect.x,-rect.y);
    if(tower)ghostTower(t);
    else{background(t);ctx.globalAlpha=Math.min(1,local/2,(30-local)/2);scenes[index](t);ctx.globalAlpha=1;}
    if(preview){ctx.strokeStyle='rgba(255,200,144,0.3333)';ctx.lineWidth=2;ctx.font='20px monospace';for(let n=1;n<=count();n++){const tile=tileRect(n,config);ctx.strokeRect(tile.x,tile.y,tile.width,tile.height);ctx.fillStyle='#ffdfb6';if(tower){ctx.save();ctx.translate(tile.x+60,tile.y+40);ctx.scale(3,.6);ctx.font='40px monospace';ctx.fillText(String(n),0,0);ctx.restore();}else ctx.fillText(String(n),tile.x+24,tile.y+38);}}
  }
  requestAnimationFrame(render);
}render();
window.screenSync={get screen(){return screen},get preview(){return preview},get room(){return room},get layout(){return {...config}},get legacy(){return !!window.screenSyncLegacy},get experience(){return config.columns===1&&config.rows===5?'wandering-ghost':'midnight-assembly'},ghostPosition,now,get peers(){return peerStatus},get offset(){return offset},get status(){return clockQuality},sceneAt:ms=>Math.floor((((ms/1000)%120)+120)%120/30)};
