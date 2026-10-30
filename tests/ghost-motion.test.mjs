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

test('all characters traverse five/six screen lines on a deterministic continuous clock',async()=>{
  const {processionState,CHARACTERS}=await import('../ghost-motion.js');
  for(const [columns,rows] of [[1,5],[1,6],[5,1],[6,1]]){
    const period=Math.max(columns,rows)*7.2,seen=new Set();
    for(let actor=0;actor<CHARACTERS.length;actor++){
      const visited=new Set();
      for(let phase=0;phase<period;phase+=.1){
        const time=actor*period+phase,s=processionState(time,columns,rows),next=processionState(time+.01,columns,rows);
        seen.add(s.kind);visited.add(columns===1?Math.floor(s.y/600)+1:Math.floor(s.x/1000)+1);
        assert.ok(s.x>=0&&s.x<=s.width&&s.y>=0&&s.y<=s.height);
        assert.ok(s.alpha>=0&&s.alpha<=1);
        assert.ok(Math.abs(s.x-next.x)<12&&Math.abs(s.y-next.y)<12,'no position jump at character boundaries');
      }
      assert.equal(visited.size,Math.max(columns,rows));
    }
    assert.deepEqual([...seen].sort(),[...CHARACTERS].sort());
    const start=processionState(0,columns,rows),end=processionState(period*CHARACTERS.length,columns,rows);
    assert.equal(start.kind,end.kind);assert.ok(Math.abs(start.x-end.x)<.001&&Math.abs(start.y-end.y)<.001);
  }
});
