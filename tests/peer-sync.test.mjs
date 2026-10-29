import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PeerClock} from '../peer-sync.js';

const wait = ms => new Promise(resolve => setTimeout(resolve,ms));
class Connection extends EventEmitter {
  constructor(peer) {super(); this.peer=peer; this.open=false;}
  send(data) {const other=this.other; setTimeout(()=>{if(other?.open)other.emit('data',structuredClone(data));},2);}
  close() {if(this.closed)return;this.closed=true;this.open=false;this.emit('close');this.other?.close();}
}
function transport() {
  const peers = new Map();
  return class extends EventEmitter {
    constructor(id) {super();this.id=id;this.open=false;queueMicrotask(()=>{
      if(peers.has(id)){this.destroyed=true;this.emit('error',{type:'unavailable-id'});return;}
      peers.set(id,this);this.open=true;this.emit('open',id);
    });}
    connect(id) {
      const a=new Connection(id);
      setTimeout(()=>{
        const remote=peers.get(id);
        if(!remote){this.emit('error',{type:'peer-unavailable'});a.emit('error',Error('absent'));return;}
        const b=new Connection(this.id);a.other=b;b.other=a;remote.emit('connection',b);
        a.open=b.open=true;b.emit('open');a.emit('open');
      },1);return a;
    }
    destroy() {this.destroyed=true;this.open=false;if(peers.get(this.id)===this)peers.delete(this.id);}
  };
}
function client(Peer,slot,skew,room='test') {
  let offset=0,status;
  const baseNow=()=>Date.now()+skew;
  const clock=new PeerClock({Peer,slot,room,baseNow,logicalNow:()=>baseNow()+offset,
    onOffset:x=>offset=x,onStatus:x=>status=x,schedule:()=>1,cancel:()=>{}});
  return {clock,now:()=>baseNow()+offset,get status(){return status}};
}
async function settle(clients,rounds=4){for(let i=0;i<rounds;i++){clients.forEach(c=>c.clock.tick());await wait(35);}}

test('mesh corrects skew, isolates rooms, and elects a new leader on disconnect',async()=>{
  const Peer=transport();
  const a=client(Peer,0,90000),b=client(Peer,1,-60000),c=client(Peer,9,30000),other=client(Peer,2,0,'another-room');
  const all=[a,b,c,other];await Promise.all(all.map(c=>c.clock.start()));
  try{
    await settle(all);
    assert.equal(b.status.leader,0);assert.equal(c.status.leader,0);
    assert.equal(a.status.count,3);assert.equal(other.status.count,1);
    assert.ok(Math.abs(a.now()-b.now())<25,'correct 150 seconds of clock skew');
    assert.ok(Math.abs(a.now()-c.now())<25);assert.ok(b.clock.following);
    a.clock.stop();for(const [id,link]of a.clock.links)a.clock.remove(id,link);
    await settle([b,c,other]);
    assert.equal(b.status.leader,1);assert.equal(c.status.leader,1);
    assert.equal(b.status.count,2);assert.ok(Math.abs(b.now()-c.now())<25);
    // A restarted lower-numbered screen joins, then takes over automatically.
    const replacement=client(Peer,0,92000);all.push(replacement);await replacement.clock.start();
    await settle([replacement,b,c,other]);
    assert.equal(c.status.leader,0);assert.ok(Math.abs(replacement.now()-c.now())<25);
  } finally {all.forEach(c=>c.clock.stop());}
});

test('unmatched replies cannot change time; malformed IDs are rejected',async()=>{
  const Peer=transport(),a=client(Peer,0,0);await a.clock.start();
  try{
    const conn=new Connection('not-this-room-1');a.clock.attach(conn);assert.ok(conn.closed);
    assert.equal(a.clock.links.size,0);
    const valid=new Connection(a.clock.prefix+'-1');a.clock.attach(valid);valid.open=true;valid.emit('open');
    const link=a.clock.links.get(valid.peer),before=a.now();
    a.clock.receive(link,{type:'pong',nonce:999,t1:1e15,t2:1e15});
    assert.ok(Math.abs(a.now()-before)<25);
  }finally{a.clock.stop();}
});
