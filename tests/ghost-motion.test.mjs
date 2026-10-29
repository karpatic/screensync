import test from 'node:test';
import assert from 'node:assert/strict';
import {ghostPosition,GHOST_PERIOD} from '../ghost-motion.js';
import {defaultConfig} from '../layout.js';
test('default is the five-screen vertical tower',()=>{
  assert.equal(defaultConfig().columns,1);assert.equal(defaultConfig().rows,5);
});
test('one ghost visits all five screens down and back up without a loop jump',()=>{
  const down=new Set(),up=new Set();
  for(let t=0;t<=GHOST_PERIOD;t+=.05){
    const p=ghostPosition(t),next=ghostPosition(t+.05);
    (t<=GHOST_PERIOD/2?down:up).add(Math.floor(p.y/600)+1);
    assert.ok(Math.abs(p.y-next.y)<12);assert.ok(p.x>=425&&p.x<=575);
  }
  assert.deepEqual([...down].sort(),[1,2,3,4,5]);assert.deepEqual([...up].sort(),[1,2,3,4,5]);
  assert.deepEqual(ghostPosition(0),ghostPosition(GHOST_PERIOD));
  assert.deepEqual(ghostPosition(-1),ghostPosition(GHOST_PERIOD-1));
});
