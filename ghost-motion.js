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
