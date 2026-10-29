// Native tower space: five 1000 × 600 screens stacked vertically.
export const GHOST_PERIOD = 36;
export function ghostPosition(seconds) {
  const phase = ((seconds % GHOST_PERIOD) + GHOST_PERIOD) % GHOST_PERIOD;
  return {x:500+Math.sin(phase*Math.PI*2/GHOST_PERIOD*2)*75,
    y:1500-1280*Math.cos(phase*Math.PI*2/GHOST_PERIOD)};
}
