phina.globalize();

function aabbOverlap(a, b) {
  return a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top;
}

phina.define('Hitbox', {
  superClass: 'RectangleShape',

  init: function(options) {
    options = options || {};
    this.superInit({
      width: options.width || 40,
      height: options.height || 80,
      fill: options.fill || 'rgba(80, 160, 255, 0.28)',
      stroke: options.stroke || 'rgba(180, 220, 255, 0.8)',
      strokeWidth: 1,
    });
    this.ox = options.ox || 0;
    this.oy = options.oy || 0;
    this.origin.set(0.5, 1);
  },

  followFighter: function(fighter) {
    var dir = fighter.facing;
    this.x = fighter.x + this.ox * dir;
    this.y = fighter.y + this.oy;
  },

  getRect: function() {
    return {
      left: this.x - this.width * this.originX,
      right: this.x + this.width * (1 - this.originX),
      top: this.y - this.height * this.originY,
      bottom: this.y + this.height * (1 - this.originY),
    };
  },
});

phina.define('HadouShot', {
  superClass: 'Sprite',

  init: function(owner, move) {
    this.superInit('hadou');
    this.owner = owner;
    this.move = move;
    this.facing = owner.facing;
    this.vx = owner.facing * (move.projectileSpeed || 7);
    this.life = 80;
    this.hasHit = false;
    // コアが進行方向側になるよう原点をずらす（シートは右向き・芯は右側）
    this.origin.set(0.68, 0.5);
    this.scaleX = this.facing >= 0 ? 1 : -1;
    this.hitW = 36;
    this.hitH = 32;
    this.anim = FrameAnimation('hadou_ss').attachTo(this);
    this.anim.gotoAndPlay('fly');
  },

  getRect: function() {
    var hw = this.hitW / 2;
    var hh = this.hitH / 2;
    return {
      left: this.x - hw,
      right: this.x + hw,
      top: this.y - hh,
      bottom: this.y + hh,
    };
  },

  update: function() {
    this.x += this.vx;
    this.life -= 1;
    var pulse = 1 + Math.sin(this.life * 0.35) * 0.06;
    this.scaleY = pulse;
    this.scaleX = (this.facing >= 0 ? 1 : -1) * pulse;
    if (this.life <= 0 || this.x < -40 || this.x > SCREEN_WIDTH + 40) this.remove();
  },
});
