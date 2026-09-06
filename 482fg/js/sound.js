phina.globalize();
// whoosh＝弱攻撃音
// whoosh_heavy＝強攻撃音
// hit＝弱ヒット音
// hit_heavy＝強ヒット音
// block＝ガード音
// throw＝投げ音
// tech＝受け身音
var SOUND_FILES = {
  ui_move: 'assets/sound/ui_move.mp3',
  ui_ok: 'assets/sound/ui_ok.mp3',
  ui_ready: 'assets/sound/ui_ready.mp3',
  jump: 'assets/sound/jump.mp3',
  land: 'assets/sound/land.mp3',
  dash: 'assets/sound/dash.mp3',
  whoosh: 'assets/sound/whoosh.mp3',
  whoosh_heavy: 'assets/sound/whoosh_heavy.mp3',
  hadou: 'assets/sound/hadou.mp3',
  shoryu: 'assets/sound/shoryu.mp3',
  tatsu: 'assets/sound/tatsu.mp3',
  hit: 'assets/sound/hit.mp3',
  hit_heavy: 'assets/sound/hit_heavy.mp3',
  block: 'assets/sound/block.mp3',
  throw: 'assets/sound/throw.mp3',
  tech: 'assets/sound/tech.mp3',
  ko: 'assets/sound/ko.mp3',
  draw: 'assets/sound/draw.mp3',
  timeover: 'assets/sound/timeover.mp3',
  round1: 'assets/sound/round1.mp3',
  round2: 'assets/sound/round2.mp3',
  round3: 'assets/sound/round3.mp3',
  fight: 'assets/sound/fight.mp3',
  p1_win: 'assets/sound/p1_win.mp3',
  p2_win: 'assets/sound/p2_win.mp3',
};

var SoundFx = {
  muted: false,
  unlocked: false,
  master: 0.85,
  groups: {
    ui: 0.55,
    action: 0.7,
    hit: 0.85,
    voice: 0.8,
  },
  groupOf: {
    ui_move: 'ui',
    ui_ok: 'ui',
    ui_ready: 'ui',
    jump: 'action',
    land: 'action',
    dash: 'action',
    whoosh: 'action',
    whoosh_heavy: 'action',
    hadou: 'action',
    shoryu: 'action',
    tatsu: 'action',
    hit: 'hit',
    hit_heavy: 'hit',
    block: 'hit',
    throw: 'hit',
    tech: 'hit',
    ko: 'voice',
    draw: 'voice',
    timeover: 'voice',
    round1: 'voice',
    round2: 'voice',
    round3: 'voice',
    fight: 'voice',
    p1_win: 'voice',
    p2_win: 'voice',
  },

  collect: function (assets) {
    assets = assets || {};
    assets.sound = assets.sound || {};
    var keys = Object.keys(SOUND_FILES);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      assets.sound[k] = SOUND_FILES[k];
    }
    return assets;
  },

  unlock: function () {
    if (this.unlocked) return;
    this.unlocked = true;
    try {
      var ctx = phina.sound && phina.sound.Sound && phina.sound.Sound.getAudioContext
        ? phina.sound.Sound.getAudioContext()
        : null;
      if (ctx && ctx.resume) ctx.resume();
    } catch (e) { /* ignore */ }
  },

  toggleMute: function () {
    this.muted = !this.muted;
    return this.muted;
  },

  play: function (name, opt) {
    if (this.muted || !name) return;
    this.unlock();
    var asset = typeof AssetManager !== 'undefined' ? AssetManager.get('sound', name) : null;
    if (!asset) return;
    var inst = asset.clone ? asset.clone() : asset;
    var group = (opt && opt.group) || this.groupOf[name] || 'action';
    var vol = this.master * (this.groups[group] != null ? this.groups[group] : 0.7);
    if (opt && opt.volume != null) vol *= opt.volume;
    inst.volume = Math.max(0, Math.min(1, vol));
    try { inst.play(); } catch (e) { /* ignore */ }
  },

  swing: function (move) {
    if (!move) {
      this.play('whoosh');
      return;
    }
    if (move.projectile) this.play('hadou');
    else if (move.launch) this.play('shoryu');
    else if (move.travel) this.play('tatsu');
    else if (move.throw) this.play('whoosh_heavy');
    else if ((move.damage || 0) >= 15 || (move.startup || 0) >= 10) this.play('whoosh_heavy');
    else this.play('whoosh');
  },

  impact: function (result, move) {
    if (result === 'block') this.play('block');
    else if (result === 'tech') this.play('tech');
    else if (result === 'throw') this.play('throw');
    else if (move && ((move.damage || 0) >= 16 || move.launch)) this.play('hit_heavy');
    else this.play('hit');
  },
};
