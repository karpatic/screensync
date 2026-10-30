// Small, low-contrast background sweets. The scene controls their opacity and size.
export function drawCandy(ctx,kind){
  const polygon=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();};
  ctx.save();
  if(kind==='candycorn'){
    ctx.beginPath();ctx.moveTo(0,-62);ctx.quadraticCurveTo(6,-64,13,-43);ctx.lineTo(43,39);ctx.quadraticCurveTo(45,50,30,52);ctx.lineTo(-30,52);ctx.quadraticCurveTo(-45,50,-43,39);ctx.lineTo(-13,-43);ctx.quadraticCurveTo(-6,-64,0,-62);ctx.closePath();ctx.clip();
    ctx.fillStyle='#f9e9cf';ctx.fillRect(-50,-70,100,140);ctx.fillStyle='#e88c43';ctx.fillRect(-50,-18,100,42);ctx.fillStyle='#e8bd55';ctx.fillRect(-50,24,100,50);
  }
  if(kind==='lollipop'){
    ctx.strokeStyle='#dfc8a5';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,27);ctx.lineTo(0,112);ctx.stroke();
    ctx.fillStyle='#d884aa';ctx.beginPath();ctx.arc(0,0,43,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f2d6b8';ctx.lineWidth=7;ctx.beginPath();
    for(let i=0;i<=50;i++){const a=i/50*Math.PI*5,r=i/50*36;i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(0,0);}ctx.stroke();
  }
  if(kind==='strawberry'){
    polygon([[-30,-17],[-77,-40],[-62,0],[-77,40],[-30,20]],'#839e68');
    polygon([[30,-17],[77,-40],[62,0],[77,40],[30,20]],'#839e68');
    ctx.fillStyle='#c65362';ctx.beginPath();ctx.moveTo(0,47);ctx.bezierCurveTo(-76,6,-33,-64,0,-30);ctx.bezierCurveTo(33,-64,76,6,0,47);ctx.fill();
    polygon([[-29,-24],[-24,-43],[-8,-33],[0,-54],[10,-34],[28,-44],[31,-24],[4,-13]],'#91a66e');
    ctx.fillStyle='#efc58c';for(const [x,y]of [[-19,-7],[12,-8],[-5,6],[22,10],[-15,21],[4,29]]){ctx.beginPath();ctx.ellipse(x,y,2.5,4,0,0,Math.PI*2);ctx.fill();}
  }
  ctx.restore();
}
