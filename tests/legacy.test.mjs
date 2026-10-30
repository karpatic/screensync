import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parse} from 'acorn';
import {serverDate} from '../clock-http.js';

test('all scripts parsed by Safari 9 contain only ES5 syntax',()=>{
  for(const file of ['compat.js','boot.js','app.legacy.js']){
    assert.doesNotThrow(()=>parse(fs.readFileSync(file,'utf8'),{ecmaVersion:5}),file);
  }
});
test('legacy loader never requests modules or the modern PeerJS library',()=>{
  const scripts=[];
  vm.runInNewContext(fs.readFileSync('boot.js','utf8'),{window:{screenSyncLegacy:true},document:{createElement:()=>({}),body:{appendChild:script=>scripts.push(script)}}});
  assert.equal(scripts.length,1);assert.match(scripts[0].src,/app\.legacy\.js/);assert.equal(scripts[0].type,undefined);
});
test('modern loader still starts artwork if peer library loading fails',()=>{
  const scripts=[];
  vm.runInNewContext(fs.readFileSync('boot.js','utf8'),{window:{screenSyncLegacy:false,RTCPeerConnection:function(){}},document:{createElement:()=>({}),body:{appendChild:script=>scripts.push(script)}}});
  assert.match(scripts[0].src,/peerjs/);scripts[0].onerror();
  assert.match(scripts[1].src,/app\.js/);assert.equal(scripts[1].type,'module');
});
test('clock synchronization works through XHR without fetch or AbortSignal',async()=>{
  const previous=globalThis.XMLHttpRequest;let request;
  globalThis.XMLHttpRequest=class{
    constructor(){request=this;this.status=200;}
    open(method,url,async){this.method=method;this.url=url;assert.equal(async,true);}
    getResponseHeader(name){assert.equal(name,'Date');return 'Thu, 29 Oct 2026 16:00:00 GMT';}
    send(){queueMicrotask(()=>this.onload());}
  };
  try{
    assert.equal(await serverDate('/?clock=123'),Date.parse('2026-10-29T16:00:00Z'));
    assert.equal(request.method,'HEAD');assert.equal(request.timeout,4000);
    globalThis.XMLHttpRequest.prototype.send=function(){queueMicrotask(()=>this.ontimeout());};
    await assert.rejects(serverDate('/?clock=456'),/Clock request failed/);
  }finally{globalThis.XMLHttpRequest=previous;}
});
