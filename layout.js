export const LAYOUTS = [
  {columns:3, rows:3, label:'3 across × 3 down'},
  {columns:3, rows:2, label:'3 across × 2 down'},
  {columns:2, rows:3, label:'2 across × 3 down'},
  {columns:1, rows:6, label:'1 across × 6 down'},
  {columns:6, rows:1, label:'6 across × 1 down'},
  {columns:2, rows:2, label:'2 across × 2 down'},
  {columns:5, rows:1, label:'5 across × 1 down'},
  {columns:1, rows:5, label:'1 across × 5 down'}
];
export function validConfig(value) {
  return !!value && LAYOUTS.some(l=>l.columns===value.columns && l.rows===value.rows)
    && Number.isSafeInteger(value.revision) && value.revision>=0
    && typeof value.writer==='string' && value.writer.length<=80;
}
export const defaultConfig = () => ({columns:1, rows:5, revision:0, writer:'vertical-default-v4'});
export function compareConfig(a,b) {return a.revision-b.revision || (a.writer>b.writer?1:a.writer<b.writer?-1:0);}
export function tileRect(screen, config) {
  const width=3000/config.columns, height=1800/config.rows;
  if(!Number.isInteger(screen)||screen<1||screen>config.columns*config.rows)return null;
  return {x:(screen-1)%config.columns*width,y:Math.floor((screen-1)/config.columns)*height,width,height};
}
export const roomName = value => String(value||'halloween').trim().slice(0,64)||'halloween';

export const isCharacterLine = config => (config.columns===1 && config.rows>=5)||(config.rows===1 && config.columns>=5);
