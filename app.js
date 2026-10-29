const params = new URLSearchParams(location.search);
const raw = params.get('screen') ?? params.get('n') ?? '0';
const screen = /^[0-9]$/.test(raw) ? Number(raw) : 0;
const preview = params.has('preview');
const welcome = screen === 0 && !preview;
document.body.className = welcome ? 'welcome' : 'wall';
const canvas = document.querySelector('#art'), ctx = canvas.getContext('2d');
const syncLabel = document.querySelector('#sync');
let offset = 0, anchor = Date.now() - performance.now(), clockQuality = 'Device clock';
const manual = Number(params.get('offset')) || 0;
const now = () => anchor + performance.now() + offset + manual;
// The server Date header is UTC, at whole-second precision. Midpoint correction
// bounds typical phase uncertainty to about half a second plus network latency.
async function syncClock() {
  const samples = [];
  for (let i = 0; i < 3; i++) {
    try {
      const start = performance.now();
      const response = await fetch(`./?clock=${Date.now()}-${i}`, {method:'HEAD', cache:'no-store', signal:AbortSignal.timeout(4000)});
      const end = performance.now(), date = Date.parse(response.headers.get('Date'));
      if (response.ok && Number.isFinite(date)) samples.push({rtt:end-start, offset:date+500-(anchor+(start+end)/2)});
    } catch { /* Continue on the monotonic device clock when offline. */ }
  }
  if (samples.length) {
    const best = samples.sort((a,b) => a.rtt-b.rtt)[0];
    offset = best.offset;
    clockQuality = `UTC aligned · ±${Math.ceil(500+best.rtt/2)} ms`;
  } else clockQuality = 'Device clock · network sync unavailable';
  syncLabel.textContent = clockQuality;
}
syncClock(); setInterval(syncClock, 120000);
document.addEventListener('visibilitychange', () => {if (!document.hidden) syncClock();});
document.querySelector('#calibrate').onclick = syncClock;
document.querySelector('#identity').textContent = preview ? 'FULL WALL / 3 × 3' : `SCREEN ${screen} / ${Math.floor((screen-1)/3)+1}:${(screen-1)%3+1}`;
document.querySelector('#screens').innerHTML = Array.from({length:9},(_,i)=>`<a href="?screen=${i+1}" target="_blank" rel="noopener" aria-label="Open screen ${i+1}">${i+1}</a>`).join('');
document.querySelector('#fullscreen').onclick = async () => {try {await document.documentElement.requestFullscreen();} catch {syncLabel.textContent='Use your browser’s fullscreen command';}};
let hideTimer;
function showTools() {document.querySelector('#tools').classList.remove('hidden');clearTimeout(hideTimer);hideTimer=setTimeout(hideTools,6000);}
function hideTools(){document.querySelector('#tools').classList.add('hidden');}
document.querySelector('#hide').onclick=hideTools;
document.addEventListener('pointermove',showTools);document.addEventListener('pointerdown',showTools);
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h')showTools();if(e.key.toLowerCase()==='f')document.querySelector('#fullscreen').click();});showTools();
let W,H;function resize(){const d=Math.min(devicePixelRatio||1,1.5);W=canvas.width=Math.round(innerWidth*d);H=canvas.height=Math.round(innerHeight*d);}addEventListener('resize',resize);resize();
const TAU=Math.PI*2, fract=x=>x-Math.floor(x), random=i=>fract(Math.sin(i*127.1+311.7)*43758.5453);
function ellipse(x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,Math.max(.001,ry),0,0,TAU);ctx.fill();}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function background(t){ctx.fillStyle='#08060e';ctx.fillRect(0,0,3000,1800);glow(1500+Math.sin(t*.13)*500,900,1500,'#241134');for(let i=0;i<120;i++){const x=random(i)*3000,y=fract(random(i+500)-t*(.002+random(i)*.003))*1800;ellipse(x,y,1+random(i+77)*3,1+random(i+77)*3,`rgba(235,167,108,${.12+.22*Math.sin(t*.6+i)**2})`);}for(let i=0;i<9;i++){const x=1500+Math.sin(t*.09+i*1.8)*1700,y=1300+Math.sin(t*.14+i)*450;glow(x,y,700,'#301d3525');}}
function eye(t){glow(1500,900,1250,'#612d2444');const blink=Math.max(.025,1-Math.pow(Math.max(0,Math.cos(t*.35)),40));ctx.save();ctx.translate(1500,900);ctx.scale(1,blink);ctx.beginPath();ctx.moveTo(-1150,0);ctx.bezierCurveTo(-600,-700,600,-700,1150,0);ctx.bezierCurveTo(600,700,-600,700,-1150,0);ctx.fillStyle='#e4bfa2';ctx.shadowColor='#e6793c';ctx.shadowBlur=80;ctx.fill();ctx.shadowBlur=0;ctx.clip();const x=Math.sin(t*.34)*320,y=Math.sin(t*.27)*90;ellipse(x,y,435,435,'#6e351c');for(let i=0;i<160;i++){const a=i/160*TAU;ctx.strokeStyle=i%3?'#c47b32':'#f4ba61';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*190,y+Math.sin(a)*190);ctx.lineTo(x+Math.cos(a+.025)*420,y+Math.sin(a+.025)*420);ctx.stroke();}ellipse(x,y,145+Math.sin(t*.9)*12,310,'#09070e');ellipse(x-120,y-150,60,60,'#ffe8ceaa');ctx.restore();}
function ghost(x,y,s,t){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.shadowColor='#b3e4d3';ctx.shadowBlur=65;ctx.fillStyle='#c5e3d6dd';ctx.beginPath();ctx.moveTo(-100,80);ctx.lineTo(-100,-20);ctx.bezierCurveTo(-100,-160,100,-160,100,-20);ctx.lineTo(100,80);for(let j=0;j<=8;j++)ctx.lineTo(100-j*25,80+Math.sin(j*1.3+t*2)*20);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ellipse(-35,-25,14,23,'#142330');ellipse(35,-25,14,23,'#142330');ellipse(0,30,13,20+Math.sin(t)*5,'#142330');ctx.restore();}
function ghosts(t){for(let i=0;i<13;i++){const s=.8+random(i+20)*1.9;const x=fract(random(i+9)+t*(.012+random(i)*.006))*3900-450,y=200+random(i+38)*1400+Math.sin(t*.8+i)*110;ghost(x,y,s,t+i);}}
function pumpkin(t){ctx.save();ctx.translate(1500,960);ctx.rotate(Math.sin(t*.25)*.035);glow(0,0,1150,'#b3431744');ctx.fillStyle='#4e5129';ctx.beginPath();ctx.moveTo(-85,-490);ctx.quadraticCurveTo(-140,-790,120,-720);ctx.lineTo(100,-640);ctx.quadraticCurveTo(-30,-680,30,-490);ctx.fill();for(let i=-2;i<=2;i++)ellipse(i*205,0,390-Math.abs(i)*35,540-Math.abs(i)*25,['#a64019','#c4511d','#db6123','#bd4819','#9a3519'][i+2]);const light=ctx.createRadialGradient(0,-50,0,0,-50,800);light.addColorStop(0,'#fff4b5');light.addColorStop(1,'#ff9d2c');ctx.fillStyle=light;ctx.shadowColor='#ffb54f';ctx.shadowBlur=35+Math.sin(t*2)*10;ctx.beginPath();ctx.moveTo(-510,-80);ctx.lineTo(-170,-130);ctx.lineTo(-360,-330);ctx.closePath();ctx.moveTo(510,-80);ctx.lineTo(170,-130);ctx.lineTo(360,-330);ctx.closePath();ctx.moveTo(-70,65);ctx.lineTo(0,-65);ctx.lineTo(70,65);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-510,130);for(let i=0;i<=12;i++)ctx.lineTo(-510+i*85,190+Math.sin(i*2.3)*50);ctx.quadraticCurveTo(0,660,-510,130);ctx.fill();ctx.restore();}
function portal(t){ctx.save();ctx.translate(1500,900);glow(0,0,1400,'#6923a044');for(let i=24;i>=0;i--){const r=90+i*43+Math.sin(t*.9-i*.3)*20;ctx.save();ctx.rotate(t*.05+i*.15);ctx.strokeStyle=`hsla(${265+i*2},75%,${35+i},${.2+i*.02})`;ctx.lineWidth=3+i*.3;ctx.beginPath();for(let j=0;j<=180;j++){const a=j/180*TAU,rr=r+Math.sin(a*7+t*.9+i*.4)*20;const x=Math.cos(a)*rr,y=Math.sin(a)*rr*.72;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.restore();}ellipse(0,0,100,70,'#050409');ctx.restore();for(let i=0;i<24;i++){const x=fract(random(i+75)+t*.027)*3600-300,y=100+random(i+45)*1600+Math.sin(t+i)*90,s=20+random(i)*40;ctx.fillStyle='#050409';ctx.beginPath();ctx.moveTo(x,y+10);ctx.quadraticCurveTo(x-s,y-s*Math.sin(t*5+i),x-s*2,y);ctx.lineTo(x-s*.7,y+20);ctx.lineTo(x,y+12);ctx.lineTo(x+s*.7,y+20);ctx.lineTo(x+s*2,y);ctx.quadraticCurveTo(x+s,y-s*Math.sin(t*5+i),x,y+10);ctx.fill();}}
const scenes=[eye,ghosts,pumpkin,portal];
function render(){const t=now()/1000,phase=((t%120)+120)%120,index=Math.floor(phase/30),local=phase%30;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);const full=welcome||preview;const col=full?0:(screen-1)%3,row=full?0:Math.floor((screen-1)/3);ctx.scale(W/(full?3000:1000),H/(full?1800:600));ctx.translate(-col*1000,-row*600);background(t);ctx.globalAlpha=Math.min(1,local/2,(30-local)/2);scenes[index](t);ctx.globalAlpha=1;if(preview){ctx.strokeStyle='#ffc89055';ctx.lineWidth=2;ctx.font='20px monospace';for(let i=0;i<9;i++){const x=i%3*1000,y=Math.floor(i/3)*600;ctx.strokeRect(x,y,1000,600);ctx.fillStyle='#ffdfb6';ctx.fillText(String(i+1),x+24,y+38);}}requestAnimationFrame(render);}render();
// A small read-only diagnostic surface for installation checks.
window.screenSync={screen,preview,now,get offset(){return offset},get status(){return clockQuality},sceneAt:ms=>Math.floor((((ms/1000)%120)+120)%120/30)};
