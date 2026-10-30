// Native tower space: five 1000 × 600 screens stacked vertically.
export const GHOST_PERIOD = 36;
export function ghostPosition(seconds) {
  const phase = ((seconds % GHOST_PERIOD) + GHOST_PERIOD) % GHOST_PERIOD;
  return {x:500+Math.sin(phase*Math.PI*2/GHOST_PERIOD*2)*75,
    y:1500-1280*Math.cos(phase*Math.PI*2/GHOST_PERIOD)};
}

export const CHARACTERS=['ghost','witch','bats','skeleton','pumpkin','cat'];
export function processionState(seconds,columns,rows) {
  const panels=Math.max(columns,rows),period=panels*7.2;
  const cycle=period*CHARACTERS.length,clock=((seconds%cycle)+cycle)%cycle;
  const index=Math.floor(clock/period),local=clock-index*period,a=local/period*Math.PI*2;
  const width=columns*1000,height=rows*600;
  return {kind:CHARACTERS[index],period,local,width,height,
    x:columns===1?500+Math.sin(a*2)*75:width/2-(width/2-360)*Math.cos(a),
    y:columns===1?height/2-(height/2-360)*Math.cos(a):335+Math.sin(a*2)*15,
    alpha:Math.min(1,local/1.5,(period-local)/1.5)};
}

export const SHOW_SCENES=['ghost','eye','witch','bats','pumpkin','portal','skeleton','ghosts','cat'];
export const SHOW_SCENE_SECONDS=24;
export function showState(seconds){
  const clock=((seconds%(SHOW_SCENES.length*SHOW_SCENE_SECONDS))+SHOW_SCENES.length*SHOW_SCENE_SECONDS)%(SHOW_SCENES.length*SHOW_SCENE_SECONDS);
  const index=Math.floor(clock/SHOW_SCENE_SECONDS),local=clock-index*SHOW_SCENE_SECONDS;
  return {name:SHOW_SCENES[index],index,local,alpha:Math.min(1,local/1.5,(SHOW_SCENE_SECONDS-local)/1.5)};
}
export function ensembleState(seconds,columns,rows){
  const width=columns*1000,height=rows*600,scene=showState(seconds);
  const lead=CHARACTERS.indexOf(scene.name),number=Math.min(12,columns*rows+3);
  const actors=Array.from({length:number},(_,i)=>{
    const a=seconds*(.09+i*.004)+i*2.399;
    return {kind:i<3&&lead>=0?scene.name:CHARACTERS[(i+scene.index)%CHARACTERS.length],
      x:width/2+(width/2-230)*Math.sin(a+i*.41)*Math.cos(a*.37+i*.71),
      y:height/2+(height/2-265)*Math.sin(seconds*.071+i*2.399+.16*Math.sin(seconds*.023+i*.67)),
      rotation:Math.sin(a*1.2+i)*.14,scale:.50+.14*(Math.sin(a*.43+i)+1)/2};
  });
  return {width,height,scene,actors};
}
