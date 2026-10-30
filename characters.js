// Original Canvas cartoons: no downloads, sprites, or video decoding on the tablets.
export function drawCharacter(ctx,kind,t,{ellipse,ghost}) {
  const poly=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();};
  const line=(points,color,width=9)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();};
  const eyes=(y,color='#101323')=>{ellipse(-28,y,12,17,color);ellipse(28,y,12,17,color);};
  ctx.save();
  if(kind==='ghost'){ghost(0,0,1.6,t);}
  if(kind==='witch'){
    // A green-faced witch in a starry purple hat, riding her broom.
    line([[-240,112],[180,78]],'#b08148',13);
    poly([[160,55],[250,35],[275,105],[173,112]],'#d7ac5d');
    for(let i=0;i<5;i++)line([[180,65+i*10],[264,45+i*13]],'#8c6034',3);
    poly([[-70,0],[55,0],[115,98],[-110,98]],'#75499c');
    poly([[-68,-92],[-94,-20],[-55,26],[-35,-84]],'#c3673f');
    ellipse(0,-58,67,70,'#b6d18b');
    poly([[58,-66],[91,-46],[58,-35]],'#b6d18b');
    eyes(-62);line([[-19,-23],[4,-14],[28,-27]],'#365342',5);
    poly([[-104,-111],[105,-111],[19,-148],[-30,-151]],'#302346');
    poly([[-65,-123],[0,-290],[57,-128]],'#75499c');
    poly([[-50,-158],[45,-158],[53,-134],[-58,-134]],'#e6a75d');
    ellipse(4,-201,7,7,'#ffe5a1');
    line([[-35,48],[-110,72],[-155,120]],'#32243e',20);
    line([[32,39],[82,72],[65,129]],'#32243e',20);
    line([[60,129],[100,129]],'#b9ce91',13);
    line([[29,4],[97,42],[126,83]],'#b6d18b',13);
  }
  if(kind==='bats'){
    for(let i=0;i<5;i++){
      ctx.save();ctx.translate((i%3-1)*150,(Math.floor(i/3)-.5)*160+Math.sin(t*1.8+i)*18);
      const flap=Math.sin(t*5+i)*65;
      poly([[-9,4],[-112,-48-flap],[-100,25],[-61,9],[-32,44],[0,16],[32,44],[61,9],[100,25],[112,-48-flap],[9,4]],i%2?'#aa7bcc':'#8268b6');
      ellipse(0,0,23,43,'#211c35');poly([[-20,-22],[-20,-57],[-2,-28],[18,-57],[20,-22]],'#211c35');
      ellipse(-9,-8,4,6,'#f7d394');ellipse(9,-8,4,6,'#f7d394');ctx.restore();
    }
  }
  if(kind==='skeleton'){
    const wave=Math.sin(t*3)*32;
    line([[0,-24],[0,118]],'#dce4d8',15);
    for(let i=0;i<4;i++){const y=i*23,w=61-i*7;line([[-w,y],[-w+10,y+12],[0,y+17],[w-10,y+12],[w,y]],'#dce4d8',8);}
    line([[-45,5],[-101,46],[-140,5+wave]],'#dce4d8',12);
    line([[45,5],[105,-35],[135,-103-wave]],'#dce4d8',12);
    for(let i=0;i<3;i++){line([[-140,5+wave],[-158-i*5,-18+wave+i*12]],'#dce4d8',5);line([[135,-103-wave],[144+i*9,-124-wave-i*3]],'#dce4d8',5);}
    ellipse(0,118,48,23,'#dce4d8');
    line([[-28,126],[-61,187+wave*.2],[-89,244]],'#dce4d8',13);
    line([[28,126],[76,174-wave*.2],[39,234]],'#dce4d8',13);
    line([[-89,244],[-124,244]],'#dce4d8',16);line([[39,234],[76,234]],'#dce4d8',16);
    ellipse(0,-108,75,81,'#e5e9da');ellipse(-28,-117,20,25,'#1c2330');ellipse(28,-117,20,25,'#1c2330');
    poly([[-10,-88],[0,-105],[10,-88]],'#1c2330');
    line([[-36,-65],[36,-65]],'#47505b',5);for(let i=-2;i<=2;i++)line([[i*13,-75],[i*13,-54]],'#47505b',3);
    ellipse(-73,-99,10,17,'#e5e9da');ellipse(73,-99,10,17,'#e5e9da');
  }
  if(kind==='pumpkin'){
    // A smiling pumpkin carried by a little purple balloon.
    ctx.strokeStyle='#cbb4d6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(20,-42);ctx.bezierCurveTo(65,-98,-25,-130,12,-188);ctx.stroke();
    ellipse(10,-258,66,82,'#a77ac9');ellipse(-11,-282,13,27,'rgba(255,230,255,.35)');poly([[7,-180],[0,-168],[19,-168]],'#a77ac9');
    line([[2,-54],[-4,-104],[29,-116]],'#84a46a',15);
    for(let i=-2;i<=2;i++)ellipse(i*43,59,76-Math.abs(i)*9,105-Math.abs(i)*6,['#c75b27','#e58132','#f29b43','#dc762e','#b95026'][i+2]);
    poly([[-91,40],[-43,40],[-63,1]],'#ffe2a1');poly([[91,40],[43,40],[63,1]],'#ffe2a1');
    ctx.fillStyle='#ffe2a1';ctx.beginPath();ctx.moveTo(-77,75);ctx.quadraticCurveTo(0,166,77,75);ctx.quadraticCurveTo(0,110,-77,75);ctx.fill();
    ellipse(-91,74,12,8,'#e85e35');ellipse(91,74,12,8,'#e85e35');
  }
  if(kind==='cat'){
    ctx.fillStyle='#e6ce88';ctx.beginPath();ctx.moveTo(100,-178);ctx.bezierCurveTo(-190,-190,-232,191,25,202);ctx.bezierCurveTo(132,209,194,117,187,54);ctx.bezierCurveTo(78,176,-116,65,100,-178);ctx.fill();
    ctx.strokeStyle='#17172b';ctx.lineWidth=26;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(58,91);ctx.bezierCurveTo(167,117,178,-48,103,-12);ctx.stroke();
    ellipse(0,53,69,93,'#17172b');ellipse(0,-43,76,66,'#17172b');
    poly([[-69,-63],[-63,-133],[-22,-88],[28,-88],[65,-133],[71,-63]],'#17172b');
    poly([[-58,-80],[-55,-114],[-35,-87]],'#a37b9e');poly([[58,-80],[55,-114],[35,-87]],'#a37b9e');
    ellipse(-29,-46,19,12,'#badc94');ellipse(29,-46,19,12,'#badc94');ellipse(-29,-46,4,13,'#131323');ellipse(29,-46,4,13,'#131323');
    poly([[-7,-18],[7,-18],[0,-10]],'#e7a0a0');
    line([[-40,-15],[-98,-25]],'#bdb1c5',2);line([[-40,-7],[-102,0]],'#bdb1c5',2);line([[40,-15],[98,-25]],'#bdb1c5',2);line([[40,-7],[102,0]],'#bdb1c5',2);
    ellipse(-32,131,29,17,'#26233d');ellipse(32,131,29,17,'#26233d');
  }
  ctx.restore();
}
