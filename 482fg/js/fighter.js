phina.globalize();

var FIGHTER_W = 56;
var FIGHTER_H = 112;
var MOVE_SPEED = 4.2;
var JUMP_VELOCITY = -14.5;
var GRAVITY = 0.55;
var MAX_HP = 100;

var MOVES = {
  light: {
    anim: 'attack_light',
    damage: 8, startup: 5, active: 4, recovery: 10,
    knockback: 3.2, hitstun: 14,
    boxW: 52, boxH: 28, boxX: 58, boxY: -70,
  },
  heavy: {
    anim: 'attack_heavy',
    damage: 16, startup: 10, active: 5, recovery: 18,
    knockback: 6.5, hitstun: 22,
    boxW: 64, boxH: 36, boxX: 66, boxY: -76,
  },
  kick: {
    anim: 'attack_kick',
    damage: 12, startup: 8, active: 5, recovery: 14,
    knockback: 5.2, hitstun: 18,
    boxW: 70, boxH: 28, boxX: 62, boxY: -42,
  },
  low_light: {
    anim: 'attack_low_light',
    damage: 7, startup: 5, active: 4, recovery: 11,
    knockback: 2.6, hitstun: 12,
    boxW: 56, boxH: 22, boxX: 50, boxY: -22,
    low: true,
  },
  low_kick: {
    anim: 'attack_low_kick',
    damage: 13, startup: 9, active: 5, recovery: 16,
    knockback: 5.8, hitstun: 18,
    boxW: 78, boxH: 24, boxX: 64, boxY: -18,
    low: true,
  },
  hadou: {
    anim: 'attack_hadou',
    damage: 14, startup: 14, active: 1, recovery: 22,
    knockback: 4.5, hitstun: 18,
    boxW: 40, boxH: 28, boxX: 50, boxY: -70,
    projectile: true,
    projectileDelay: 12,
    projectileSpeed: 7,
  },
  shoryu: {
    anim: 'attack_shoryu',
    damage: 18, startup: 4, active: 14, recovery: 24,
    knockback: 3.0, hitstun: 22,
    boxW: 48, boxH: 70, boxX: 36, boxY: -90,
    launch: -12.5,
    forward: 3.5,
    invulnFrames: 8,
  },
  tatsu: {
    anim: 'attack_tatsu',
    damage: 13, startup: 7, active: 16, recovery: 18,
    knockback: 5.0, hitstun: 16,
    boxW: 70, boxH: 30, boxX: 48, boxY: -40,
    travel: 5.5,
  },
};

var COMMANDS = [
  { motion: [6, 2, 3], button: 'punch', move: 'shoryu' },
  { motion: [2, 3, 6], button: 'punch', move: 'hadou' },
  { motion: [2, 1, 4], button: 'kick', move: 'tatsu' },
];

var CMD_BUFFER = 20;
var DASH_WINDOW = 14;
var DASH_FWD_SPEED = 11;
var DASH_BACK_SPEED = 9.5;
var DASH_FWD_TIME = 12;
var DASH_BACK_TIME = 16;

phina.define('Fighter', {
  superClass: 'Sprite',

  init: function(options) {
    options = options || {};
    this.imageName = options.image || 'fighter_p1';
    this.ssName = options.ss || 'fighter_ss';
    this.superInit(this.imageName);
    this.origin.set(0.5, 1);

    this.name = options.name || 'P1';
    this.charaName = options.charaName || this.name;
    this.keys = options.keys;
    this.padIndex = options.padIndex != null ? options.padIndex : 0;
    this.moves = options.moves || MOVES;
    this.moveSpeed = options.speed != null ? options.speed : MOVE_SPEED;
    this.jumpVelocity = options.jump != null ? options.jump : JUMP_VELOCITY;
    this.hp = options.hp != null ? options.hp : MAX_HP;
    this.maxHp = this.hp;
    this.facing = options.facing || 1;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.state = 'idle';
    this.stateTime = 0;
    this.invuln = 0;
    this.hitstun = 0;
    this.move = null;
    this.hasHit = false;
    this.alive = true;
    this.holdingDown = false;
    this.holdingBack = false;
    this.inputLeft = false;
    this.inputRight = false;
    this.crouching = false;
    this.blockstun = 0;
    this.cmdBuf = [];
    this.queuedShot = null;
    this.inputClock = 0;
    this.lastFwdTap = -999;
    this.lastBackTap = -999;
    this.prevFwd = false;
    this.prevBack = false;
    this.dashDir = 0;
    this.dashSpeed = 0;
    this.dashTime = 0;
    this.debugHitboxes = options.debugHitboxes !== false;
    this.baseColor = options.color || '#3aa0ff';

    this.anim = FrameAnimation(this.ssName).attachTo(this);
    this.anim.gotoAndPlay('idle');
    this.currentAnimName = 'idle';

    this.hurtbox = Hitbox({
      width: 44,
      height: 100,
      ox: 0,
      oy: 0,
      fill: 'rgba(80,160,255,0.22)',
    });

    this.attackBox = Hitbox({
      width: 40,
      height: 24,
      fill: 'rgba(255,70,70,0.35)',
      stroke: 'rgba(255,180,180,0.9)',
    });
    this.attackBox.visible = false;
    this.attackBox.active = false;

    this.nameLabel = Label({
      text: this.name,
      fontSize: 14,
      fill: '#fff',
      fontWeight: 'bold',
    }).addChildTo(this);
    this.nameLabel.setPosition(0, -118);
  },

  onadded: function() {
    this.hurtbox.addChildTo(this.parent);
    this.attackBox.addChildTo(this.parent);
  },

  playAnim: function(name) {
    if (!name || !this.anim) return;
    if (this.currentAnimName === name && !this.anim.paused) return;
    this.currentAnimName = name;
    this.anim.gotoAndPlay(name);
  },

  setDebugVisible: function(visible) {
    this.debugHitboxes = visible;
    this.hurtbox.visible = visible && this.alive;
    if (!this.attackBox.active) this.attackBox.visible = false;
  },

  canAct: function() {
    return this.alive && (
      this.state === 'idle' ||
      this.state === 'walk' ||
      this.state === 'jump' ||
      this.state === 'crouch' ||
      this.state === 'guard' ||
      this.state === 'dash'
    );
  },

  _pressed: function(kb, names) {
    if (!names) return false;
    var list = Array.isArray(names) ? names : [names];
    for (var i = 0; i < list.length; i++) {
      if (kb.getKey(list[i])) return true;
    }
    return false;
  },

  _justPressed: function(kb, names) {
    if (!names) return false;
    var list = Array.isArray(names) ? names : [names];
    for (var i = 0; i < list.length; i++) {
      if (kb.getKeyDown(list[i])) return true;
    }
    return false;
  },

  _dirCode: function(left, right, down, upHeld) {
    var fwd = (this.facing > 0 && right) || (this.facing < 0 && left);
    var back = (this.facing > 0 && left) || (this.facing < 0 && right);
    var x = fwd ? 1 : back ? -1 : 0;
    var y = upHeld ? 1 : down ? -1 : 0;
    return 5 + x + y * 3;
  },

  _pushCommand: function(dir) {
    this.cmdBuf.push(dir);
    if (this.cmdBuf.length > CMD_BUFFER) this.cmdBuf.shift();
  },

  _matchMotion: function(motion) {
    var compact = [];
    for (var i = 0; i < this.cmdBuf.length; i++) {
      var d = this.cmdBuf[i];
      if (d === 5) continue;
      if (compact.length && compact[compact.length - 1] === d) continue;
      compact.push(d);
    }
    var n = 0;
    for (var j = 0; j < compact.length; j++) {
      if (compact[j] === motion[n]) n += 1;
      if (n >= motion.length) return true;
    }
    return false;
  },

  tryCommand: function(button) {
    if (!this.canAct() || this.state === 'jump') return false;
    for (var i = 0; i < COMMANDS.length; i++) {
      var cmd = COMMANDS[i];
      if (cmd.button !== button) continue;
      if (!this.moves[cmd.move]) continue;
      if (this._matchMotion(cmd.motion)) {
        this.cmdBuf = [];
        this.startMove(cmd.move, true);
        return true;
      }
    }
    return false;
  },

  startMove: function(kind, fromCommand) {
    if (!fromCommand) {
      if (this.crouching && kind === 'light') kind = 'low_light';
      else if (this.crouching && (kind === 'kick' || kind === 'heavy')) kind = 'low_kick';
    }
    var data = this.moves[kind];
    if (!data || !this.canAct()) return;
    if (this.state === 'jump') return;
    this.state = 'attack';
    this.stateTime = 0;
    this.move = data;
    this.hasHit = false;
    this.vx = 0;
    this.queuedShot = null;
    this.playAnim(data.anim || 'attack_heavy');
  },

  startDash: function(dir) {
    if (!this.onGround || this.holdingDown) return;
    if (this.state === 'attack' || this.state === 'hit' || this.state === 'dead' || this.state === 'blockstun') return;
    this.state = 'dash';
    this.stateTime = 0;
    this.dashDir = dir;
    if (dir === this.facing) {
      this.dashSpeed = DASH_FWD_SPEED;
      this.dashTime = DASH_FWD_TIME;
    } else {
      this.dashSpeed = DASH_BACK_SPEED;
      this.dashTime = DASH_BACK_TIME;
      this.invuln = Math.max(this.invuln, 8);
    }
    this.vx = dir * this.dashSpeed;
    this.playAnim('walk');
  },

  isGuarding: function() {
    if (!this.alive || !this.onGround) return false;
    if (this.state === 'attack' || this.state === 'hit' || this.state === 'dead') return false;
    return this.holdingBack || this.state === 'guard' || this.state === 'blockstun';
  },

  canBlock: function(move) {
    if (!this.isGuarding()) return false;
    if (move && move.low) return !!(this.crouching || this.holdingDown);
    return true;
  },

  block: function(move, dir) {
    var stun = Math.max(6, Math.floor((move.hitstun || 12) * 0.55));
    this.state = 'blockstun';
    this.stateTime = 0;
    this.blockstun = stun;
    this.vx = dir * Math.max(1.2, (move.knockback || 3) * 0.35);
    this.vy = 0;
    this.move = null;
    this.hasHit = false;
    this.attackBox.active = false;
    this.attackBox.visible = false;
    this.playAnim(this.holdingDown || this.crouching ? 'guard_crouch' : 'guard');
  },

  takeHit: function(move, dir) {
    if (!this.alive || this.invuln > 0) return false;
    if (this.canBlock(move)) {
      this.block(move, dir);
      return 'block';
    }
    this.hp = Math.max(0, this.hp - move.damage);
    this.vx = dir * move.knockback;
    this.vy = -2.4;
    this.onGround = false;
    this.crouching = false;
    this.state = 'hit';
    this.stateTime = 0;
    this.hitstun = move.hitstun;
    this.invuln = 8;
    this.move = null;
    this.hasHit = false;
    this.attackBox.active = false;
    this.attackBox.visible = false;
    if (this.hp <= 0) {
      this.alive = false;
      this.state = 'dead';
      this.vy = -8;
      this.playAnim('dead');
    } else {
      this.playAnim('hit');
    }
    return true;
  },

  updateBoxes: function() {
    if (this.crouching || (this.state === 'attack' && this.move && this.move.low)) {
      this.hurtbox.height = 58;
    } else {
      this.hurtbox.height = 100;
    }
    this.hurtbox.followFighter(this);
    if (this.attackBox.active && this.move) {
      this.attackBox.width = this.move.boxW;
      this.attackBox.height = this.move.boxH;
      this.attackBox.ox = this.move.boxX;
      this.attackBox.oy = this.move.boxY;
      this.attackBox.followFighter(this);
      this.attackBox.visible = this.debugHitboxes;
    } else {
      this.attackBox.active = false;
      this.attackBox.visible = false;
    }
    this.hurtbox.visible = this.debugHitboxes && this.alive;
  },

  _syncAnim: function() {
    if (this.state === 'attack' || this.state === 'hit' || this.state === 'dead') return;
    var name = 'idle';
    if (!this.onGround) name = this.vy < 0 ? 'jump' : 'fall';
    else if (this.state === 'guard' || this.state === 'blockstun') {
      name = (this.crouching || this.holdingDown) ? 'guard_crouch' : 'guard';
    }
    else if (this.state === 'dash') name = 'walk';
    else if (this.state === 'crouch') name = 'crouch';
    else if (this.state === 'walk') name = 'walk';
    this.playAnim(name);
  },

  update: function(app) {
    if (this.invuln > 0) this.invuln -= 1;
    this.stateTime += 1;

    var kb = app.keyboard;
    var left = this._pressed(kb, this.keys.left) || GamepadHub.held(this.padIndex, 'left');
    var right = this._pressed(kb, this.keys.right) || GamepadHub.held(this.padIndex, 'right');
    var down = this._pressed(kb, this.keys.down) || GamepadHub.held(this.padIndex, 'down');
    var upHeld = this._pressed(kb, this.keys.up) || GamepadHub.held(this.padIndex, 'up');
    var up = this._justPressed(kb, this.keys.up) || GamepadHub.down(this.padIndex, 'up');
    this._pushCommand(this._dirCode(left, right, down, upHeld));
    this.inputLeft = left;
    this.inputRight = right;
    this.holdingDown = !!(down && this.onGround);
    this.holdingBack = !!(this.onGround && ((this.facing > 0 && left && !right) || (this.facing < 0 && right && !left)));
    this.inputClock += 1;
    var fwdNow = (this.facing > 0 && right && !left) || (this.facing < 0 && left && !right);
    var backNow = (this.facing > 0 && left && !right) || (this.facing < 0 && right && !left);
    if (this.onGround && !this.holdingDown && this.alive && this.state !== 'hit' && this.state !== 'dead' && this.state !== 'blockstun' && this.state !== 'attack') {
      if (fwdNow && !this.prevFwd) {
        if (this.inputClock - this.lastFwdTap <= DASH_WINDOW) this.startDash(this.facing);
        this.lastFwdTap = this.inputClock;
      }
      if (backNow && !this.prevBack) {
        if (this.inputClock - this.lastBackTap <= DASH_WINDOW) this.startDash(-this.facing);
        this.lastBackTap = this.inputClock;
      }
    }
    this.prevFwd = fwdNow;
    this.prevBack = backNow;
    var light = this._justPressed(kb, this.keys.light) || GamepadHub.down(this.padIndex, 'light');
    var heavy = this._justPressed(kb, this.keys.heavy) || GamepadHub.down(this.padIndex, 'heavy');
    var kick = this._justPressed(kb, this.keys.kick) || GamepadHub.down(this.padIndex, 'kick');

    if (this.alive && this.state !== 'hit' && this.state !== 'dead' && this.state !== 'blockstun') {
      if (light) {
        if (!this.tryCommand('punch')) this.startMove('light');
      } else if (heavy) {
        if (!this.tryCommand('punch')) this.startMove('heavy');
      } else if (kick) {
        if (!this.tryCommand('kick')) this.startMove('kick');
      }
    }

    if (this.state === 'attack' && this.move) {
      var t = this.stateTime;
      var start = this.move.startup;
      var activeEnd = start + this.move.active;
      var total = activeEnd + this.move.recovery;
      this.attackBox.active = !this.move.projectile && (t >= start && t < activeEnd && !this.hasHit);
      if (this.move.invulnFrames && t < this.move.invulnFrames) this.invuln = 2;
      if (this.move.launch && t === this.move.startup) {
        this.vy = this.move.launch;
        this.onGround = false;
        this.x += this.facing * (this.move.forward || 0);
      }
      if (this.move.travel) this.vx = this.facing * this.move.travel;
      if (this.move.projectile && t === this.move.projectileDelay) this.queuedShot = this.move;
      if (t >= total) {
        this.move = null;
        this.attackBox.active = false;
        this.state = (this.holdingDown && this.onGround) ? 'crouch' : 'idle';
        this.crouching = this.state === 'crouch';
      }
    } else if (this.state === 'hit') {
      if (this.stateTime >= this.hitstun) {
        this.state = this.onGround ? 'idle' : 'jump';
      }
    } else if (this.state === 'blockstun') {
      this.vx *= 0.8;
      if (this.stateTime >= this.blockstun) {
        if (this.holdingDown && this.onGround) {
          this.state = 'crouch';
          this.crouching = true;
        } else {
          this.state = 'idle';
          this.crouching = false;
        }
      }
    } else if (this.state === 'dash') {
      this.vx = this.dashDir * this.dashSpeed;
      if (this.stateTime >= this.dashTime) {
        this.state = 'idle';
        this.vx = 0;
      }
    } else if (this.state !== 'dead') {
      this.vx = 0;
      if (this.canAct()) {
        if (this.holdingDown) {
          this.crouching = true;
          this.state = this.holdingBack ? 'guard' : 'crouch';
        } else {
          this.crouching = false;
          if (left && !right) this.vx = -this.moveSpeed;
          if (right && !left) this.vx = this.moveSpeed;
          if (up && this.onGround) {
            this.vy = this.jumpVelocity;
            this.onGround = false;
            this.state = 'jump';
          } else if (this.onGround) {
            this.state = this.vx !== 0 ? 'walk' : 'idle';
          }
        }
      }
    }

    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      this.vy = 0;
      this.onGround = true;
      if (this.state === 'jump') this.state = 'idle';
    } else {
      this.onGround = false;
      this.crouching = false;
    }

    var margin = 36;
    this.x = Math.clamp(this.x, margin, SCREEN_WIDTH - margin);

    this.scaleX = this.facing >= 0 ? 1 : -1;
    this.nameLabel.scaleX = this.scaleX;

    this.alpha = (this.invuln > 0 && this.alive && this.stateTime % 4 < 2) ? 0.55 : 1;
    this._syncAnim();
    this.updateBoxes();
  },
});
