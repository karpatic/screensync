/* ES5 loader: Safari 9 never parses PeerJS or an ES module. */
(function (w,d) {
  'use strict';
  var version = w.screenSyncBuild ? w.screenSyncBuild.version+'-'+w.screenSyncBuild.id : '5';
  function run() {
    var app=d.createElement('script');
    if(w.screenSyncLegacy) app.src='app.legacy.js?v='+encodeURIComponent(version);
    else {app.type='module';app.src='app.js?v='+encodeURIComponent(version);}
    app.onerror=function(){d.getElementById('room-status').textContent='Could not load ScreenSync. Check the connection and reload.';};
    d.body.appendChild(app);
  }
  if(!w.screenSyncLegacy && w.RTCPeerConnection){
    var peer=d.createElement('script');peer.src='vendor/peerjs-1.5.5.min.js';peer.onload=run;peer.onerror=run;d.body.appendChild(peer);
  } else run();
}(window,document));
