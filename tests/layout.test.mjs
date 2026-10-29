import test from 'node:test';
import assert from 'node:assert/strict';
import {LAYOUTS,validConfig,defaultConfig,tileRect,compareConfig} from '../layout.js';

test('every supported formation tiles the complete artwork without gaps or overlap',()=>{
  for(const layout of LAYOUTS){
    const n=layout.columns*layout.rows;
    const rects=Array.from({length:n},(_,i)=>tileRect(i+1,layout));
    assert.equal(rects.reduce((sum,r)=>sum+r.width*r.height,0),3000*1800);
    assert.equal(rects[0].x,0);assert.equal(rects[0].y,0);
    assert.equal(rects[n-1].x+rects[n-1].width,3000);
    assert.equal(rects[n-1].y+rects[n-1].height,1800);
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
      const a=rects[i],b=rects[j];
      assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);
    }
    assert.equal(tileRect(0,layout),null);assert.equal(tileRect(n+1,layout),null);
  }
});
test('room settings validate dimensions and use deterministic revision ordering',()=>{
  assert.ok(validConfig(defaultConfig()));
  for(const value of [{columns:99,rows:99,revision:1,writer:'x'},{columns:3,rows:3,revision:Infinity,writer:'x'},{columns:3,rows:3,revision:-1,writer:'x'},null])assert.equal(validConfig(value),false);
  const a={...defaultConfig(),revision:1,writer:'a'},b={...a,writer:'b'};
  assert.ok(compareConfig(a,b)<0);assert.ok(compareConfig({...a,revision:2},b)>0);
});
