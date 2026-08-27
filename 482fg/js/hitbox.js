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
  superClass: 'CircleShape',

  init: function(owner, move) {
    this.superInit({
      radius: 16,
      fill: owner.baseColor || '#7ec8ff',
      stroke: '#fff',
      strokeWidth: 2,
    });
    this.owner = owner;
    this.move = move;
    this.facing = owner.facing;
    this.vx = owner.facing * (move.projectileSpeed || 7);
    this.life = 80;
    this.hasHit = false;
    this.origin.set(0.5, 0.5);
  },

  getRect: function() {
    return {
      left: this.x - this.radius,
      right: this.x + this.radius,
      top: this.y - this.radius,
      bottom: this.y + this.radius,
    };
  },

  update: function() {
    this.x += this.vx;
    this.life -= 1;
    if (this.life <= 0 || this.x < -40 || this.x > SCREEN_WIDTH + 40) this.remove();
  },
});
