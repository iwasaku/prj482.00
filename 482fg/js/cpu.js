phina.globalize();

var CPU_REACT = 7;
var CPU_MISTAKE = 0.14;

phina.define('CpuController', {
  init: function (fighter) {
    this.fighter = fighter;
    this.plan = null;
    this.step = 0;
    this.left = 0;
    this.wait = 0;
    this.pending = null;
  },

  reset: function () {
    this.plan = null;
    this.step = 0;
    this.left = 0;
    this.wait = 0;
    this.pending = null;
    this._clear();
  },

  think: function (opponent, shots) {
    var f = this.fighter;
    if (!f.alive || !opponent) {
      this._clear();
      return;
    }
    var threat = this._threat(opponent);
    if (this.plan && this.plan.cancelable && (threat || this._shotNear(shots))) {
      this.plan = null;
    }
    if (this.wait > 0) {
      this.wait -= 1;
      this._clear();
      return;
    }
    if (!this.plan && this.pending) {
      this.plan = this.pending;
      this.pending = null;
      this.step = 0;
      this.left = 0;
    }
    if (!this.plan) this._decide(opponent, shots);
    this._emit();
  },

  _threat: function (opponent) {
    return opponent.state === 'attack' && opponent.move && !opponent.move.projectile &&
      opponent.stateTime < opponent.move.startup + 1;
  },

  _shotNear: function (shots) {
    var f = this.fighter;
    if (!shots) return false;
    for (var i = 0; i < shots.length; i++) {
      var s = shots[i];
      if (!s || s.hasHit || s.owner === f) continue;
      var dx = s.x - f.x;
      if (Math.abs(dx) < 240 && ((s.facing > 0 && dx < 20) || (s.facing < 0 && dx > -20))) return true;
    }
    return false;
  },

  _decide: function (opponent, shots) {
    var f = this.fighter;
    var dist = Math.abs(opponent.x - f.x);
    var attack = opponent.state === 'attack' && opponent.move;
    var startup = attack && opponent.stateTime < opponent.move.startup;
    var active = attack && opponent.stateTime >= opponent.move.startup &&
      opponent.stateTime < opponent.move.startup + opponent.move.active;
    var recovering = attack && opponent.stateTime >= opponent.move.startup + opponent.move.active;
    var air = !opponent.onGround;
    var mistake = Math.random() < CPU_MISTAKE;

    if (this._shotNear(shots) && !mistake) {
      this._queue(dist < 160 ? this._block(false, 10) : this._jump(), CPU_REACT);
      return;
    }
    if ((startup || active) && !opponent.move.projectile && !mistake) {
      this._queue(this._block(!!opponent.move.low, Math.max(6, opponent.move.startup + opponent.move.active - opponent.stateTime + 4)), CPU_REACT);
      return;
    }
    if (air && dist < 170 && opponent.vy > -2) {
      if (f.gauge >= 100 && dist < 110) this._set(this._super());
      else if (!mistake) this._set(this._special('up'));
      else this._set(this._block(false, 12));
      return;
    }
    if (recovering && dist < 110) {
      this._set(dist < 62 ? this._throw() : this._poke());
      return;
    }
    if (f.gauge >= 100 && dist < 100 && opponent.state !== 'hit') {
      this._set(this._super());
      return;
    }
    if (dist > 230) {
      this._set(Math.random() < 0.45 ? this._special('forward') : this._walk(16));
      return;
    }
    if (dist > 96) {
      this._set(Math.random() < 0.35 ? this._kick() : this._walk(8));
      return;
    }
    var roll = Math.random();
    if (roll < 0.28) this._set(this._throw());
    else if (roll < 0.55) this._set(this._low());
    else this._set(this._poke());
  },

  _queue: function (plan, delay) {
    this.pending = plan;
    this.wait = delay;
    this._clear();
  },

  _set: function (plan) {
    this.plan = plan;
    this.step = 0;
    this.left = 0;
  },

  _walk: function (frames) {
    return { cancelable: true, steps: [{ frames: frames, fwd: true }] };
  },

  _block: function (low, frames) {
    return { cancelable: true, steps: [{ frames: frames, back: true, down: !!low }] };
  },

  _jump: function () {
    return { cancelable: false, steps: [{ frames: 1, up: true }, { frames: 8 }] };
  },

  _poke: function () {
    return { cancelable: false, steps: [{ frames: 1, light: true }, { frames: 8 }] };
  },

  _kick: function () {
    return { cancelable: false, steps: [{ frames: 4, fwd: true }, { frames: 1, kick: true }, { frames: 8 }] };
  },

  _low: function () {
    return { cancelable: false, steps: [{ frames: 3, down: true }, { frames: 1, down: true, light: true }, { frames: 6, down: true }] };
  },

  _throw: function () {
    return { cancelable: false, steps: [{ frames: 2, fwd: true, heavyHeld: true }, { frames: 1, fwd: true, light: true, heavyHeld: true }, { frames: 6 }] };
  },

  _special: function (dir) {
    var step = { frames: 1, special: true };
    if (dir === 'forward') step.fwd = true;
    else if (dir === 'back') step.back = true;
    else if (dir === 'up') step.up = true;
    else if (dir === 'down') step.down = true;
    return { cancelable: false, steps: [step, { frames: 12 }] };
  },

  _super: function () {
    return this._special('down');
  },

  _emit: function () {
    var f = this.fighter;
    this._clear();
    if (!this.plan) return;
    var steps = this.plan.steps;
    if (this.step >= steps.length) {
      this.plan = null;
      return;
    }
    var step = steps[this.step];
    if (this.left <= 0) this.left = step.frames;
    var face = f.facing >= 0 ? 1 : -1;
    f.cpuRight = !!(step.fwd && face > 0) || !!(step.back && face < 0);
    f.cpuLeft = !!(step.fwd && face < 0) || !!(step.back && face > 0);
    f.cpuDown = !!step.down;
    f.cpuUp = !!step.up;
    f.cpuLight = !!step.light;
    f.cpuHeavy = !!step.heavy;
    f.cpuKick = !!step.kick;
    f.cpuSpecial = !!step.special;
    f.cpuLightHeld = !!step.light || !!step.lightHeld;
    f.cpuHeavyHeld = !!step.heavy || !!step.heavyHeld;
    this.left -= 1;
    if (this.left <= 0) this.step += 1;
  },

  _clear: function () {
    var f = this.fighter;
    f.cpuLeft = false;
    f.cpuRight = false;
    f.cpuDown = false;
    f.cpuUp = false;
    f.cpuLight = false;
    f.cpuHeavy = false;
    f.cpuKick = false;
    f.cpuSpecial = false;
    f.cpuLightHeld = false;
    f.cpuHeavyHeld = false;
  },
});
