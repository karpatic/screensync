// Small timing mesh. PeerJS only brokers discovery; RTCDataChannel carries clocks.
export class PeerClock {
  constructor({Peer, room, slot, baseNow, logicalNow, onOffset, onStatus,
    monotonic = () => performance.now(), schedule = setInterval, cancel = clearInterval}) {
    Object.assign(this, {Peer, room, slot, baseNow, logicalNow, onOffset, onStatus, monotonic, schedule, cancel});
    this.links = new Map(); this.pending = new Map(); this.samples = [];
    this.leader = slot; this.lastSync = 0; this.stopped = false; this.sequence = 0;
    this.network = 'Finding screens'; this.peer = null;
  }
  async start() {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(this.room));
    this.prefix = 'screensync-v1-' + Array.from(new Uint8Array(digest)).map(n => n.toString(16).padStart(2, '0')).join('').slice(0,32);
    if (this.stopped) return;
    this.id = `${this.prefix}-${this.slot}`;
    // A preview observes the wall without claiming any numbered screen's ID.
    if (this.slot === 10) this.id += '-' + crypto.randomUUID();
    this.openPeer();
    this.timer = this.schedule(() => this.tick(), 2500);
  }
  openPeer() {
    if (this.stopped) return;
    const peer = this.peer = new this.Peer(this.id, {
      debug: 0, secure: true,
      // STUN discovers direct routes. No TURN relay is configured.
      config: {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]}
    });
    peer.on('open', () => {if (this.peer !== peer) return; this.network = 'Discovering'; this.tick();});
    peer.on('connection', conn => this.attach(conn));
    peer.on('disconnected', () => {if (this.peer !== peer) return; this.network = 'Discovery offline'; this.report();});
    peer.on('error', error => {
      if (this.peer !== peer) return;
      if (error.type === 'unavailable-id') {
        this.network = `Screen ${this.slot} already open in this room`;
      } else if (error.type !== 'peer-unavailable') this.network = 'Retrying discovery';
      this.report();
    });
  }
  slotFor(id) {
    if (!id?.startsWith(this.prefix + '-')) return null;
    const suffix = id.slice(this.prefix.length + 1);
    if (/^[0-9]$/.test(suffix)) return Number(suffix);
    if (/^10-[a-f0-9-]+$/.test(suffix)) return 10;
    return null;
  }
  attach(conn) {
    const slot = this.slotFor(conn.peer);
    if (slot === null || conn.peer === this.id || this.links.has(conn.peer)) {conn.close(); return;}
    const link = {conn, slot, lastSeen: this.monotonic(), created: this.monotonic(), open: false};
    this.links.set(conn.peer, link);
    conn.on('open', () => {
      if (this.links.get(conn.peer) !== link) return;
      link.open = true; link.lastSeen = this.monotonic();
      this.send(link, {type:'hello', version:1}); this.elect(); this.ping(link);
    });
    conn.on('data', message => this.receive(link, message));
    const remove = () => this.remove(conn.peer, link);
    conn.on('close', remove); conn.on('error', remove);
  }
  send(link, data) {try {if (link.conn.open) link.conn.send(data);} catch {this.remove(link.conn.peer, link);}}
  remove(id, link) {
    if (this.links.get(id) !== link) return;
    this.links.delete(id);
    for (const [nonce, ping] of this.pending) if (ping.id === id) this.pending.delete(nonce);
    try {link.conn.close();} catch { /* Already closed. */ }
    this.elect();
  }
  elect() {
    const active = [...this.links.values()].filter(link => link.open);
    const leader = Math.min(this.slot, ...active.map(link => link.slot));
    if (this.leader !== leader) {this.leader = leader; this.samples = []; this.lastSync = 0;}
    this.report();
  }
  ping(link) {
    const nonce = ++this.sequence;
    this.pending.set(nonce, {id:link.conn.peer, t0:this.baseNow(), sent:this.monotonic()});
    this.send(link, {type:'ping', nonce});
  }
  receive(link, data) {
    if (this.links.get(link.conn.peer) !== link || !link.open || !data || typeof data !== 'object') return;
    if (!['hello','ping','pong'].includes(data.type)) return;
    link.lastSeen = this.monotonic();
    if (data.type === 'hello') {this.elect(); return;}
    if (!Number.isSafeInteger(data.nonce)) return;
    if (data.type === 'ping') {
      const t1 = this.logicalNow();
      this.send(link, {type:'pong', nonce:data.nonce, t1, t2:this.logicalNow()}); return;
    }
    const ping = this.pending.get(data.nonce);
    if (!ping || ping.id !== link.conn.peer) return;
    this.pending.delete(data.nonce);
    const t3 = this.baseNow(), elapsed = this.monotonic() - ping.sent;
    if (link.slot !== this.leader || this.leader === this.slot || !Number.isFinite(data.t1) || !Number.isFinite(data.t2)) return;
    const processing = data.t2-data.t1, rtt = elapsed-processing;
    if (elapsed > 2000 || processing < 0 || rtt < -1) return;
    // Four-timestamp NTP estimate: subtract the leader's processing time.
    const offset = ((data.t1-ping.t0)+(data.t2-t3))/2;
    this.samples.push({rtt:Math.max(0,rtt), offset});
    if (this.samples.length > 8) this.samples.shift();
    const best = this.samples.reduce((a,b) => a.rtt < b.rtt ? a : b);
    this.onOffset(best.offset); this.lastSync = this.monotonic(); this.uncertainty = best.rtt/2;
    this.report();
  }
  tick() {
    if (this.stopped) return;
    if (!this.peer || this.peer.destroyed) this.openPeer();
    else if (this.peer.disconnected) {try {this.peer.reconnect();} catch { /* Retry next tick. */ }}
    const stamp = this.monotonic();
    for (const [id, link] of this.links) {
      if (stamp-link.lastSeen > 12000 || (!link.open && stamp-link.created > 8000)) this.remove(id, link);
    }
    for (const [nonce,ping] of this.pending) if (stamp-ping.sent > 5000) this.pending.delete(nonce);
    if (this.peer?.open) {
      // Higher slots dial lower slots, avoiding duplicate simultaneous channels.
      for (let slot = 0; slot < Math.min(this.slot,10); slot++) {
        const id = `${this.prefix}-${slot}`;
        if (!this.links.has(id)) this.attach(this.peer.connect(id, {serialization:'json', reliable:true}));
      }
    }
    this.elect();
    for (const link of this.links.values()) if (link.open) this.ping(link);
  }
  get following() {return this.leader < this.slot && this.lastSync > 0 && this.monotonic()-this.lastSync < 12000;}
  report() {
    const count = [...this.links.values()].filter(link => link.open && link.slot < 10).length + (this.slot < 10 ? 1 : 0);
    let text = this.network;
    if (count > (this.slot < 10 ? 1 : 0)) text = this.following
      ? `P2P · ${count}/10 screens · clock ${this.leader} · RTT ±${Math.ceil(this.uncertainty)} ms`
      : this.leader === this.slot ? `P2P · ${count}/10 screens · clock leader ${this.slot}` : `P2P · ${count}/10 screens · aligning to ${this.leader}`;
    this.onStatus({text, count, leader:this.leader, following:this.following});
  }
  stop() {this.stopped = true; if (this.timer) this.cancel(this.timer); this.peer?.destroy();}
}
