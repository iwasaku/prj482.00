phina.globalize();

phina.define('SelectScene', {
  superClass: 'DisplayScene',

  init: function (options) {
    this.superInit(options);
    this.backgroundColor = '#12151c';
    this.roster = CHARACTER_ROSTER;
    this.cols = Math.min(6, this.roster.length);
    this.p1Index = 0;
    this.p2Index = Math.min(1, this.roster.length - 1);
    this.p1Locked = false;
    this.p2Locked = false;

    Label({
      text: 'CHARACTER SELECT',
      fontSize: 32,
      fill: '#fff',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 36);

    Label({
      text: '1P: A/D またはパッド1  J/A 決定    2P: ←/→ またはパッド2  O/A 決定    SPACE/START 開始',
      fontSize: 14,
      fill: '#aaa',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 68);

    this.p1Preview = this._preview(150, 230, 1);
    this.p2Preview = this._preview(SCREEN_WIDTH - 150, 230, -1);

    this.p1Name = Label({ text: '', fontSize: 22, fill: '#3aa0ff', fontWeight: 'bold' })
      .addChildTo(this).setPosition(150, 360 - 18);
    this.p2Name = Label({ text: '', fontSize: 22, fill: '#ff8a3a', fontWeight: 'bold' })
      .addChildTo(this).setPosition(SCREEN_WIDTH - 150, 360 - 18);
    this.p1Meta = Label({ text: '', fontSize: 14, fill: '#ccc' })
      .addChildTo(this).setPosition(150, 386 - 18);
    this.p2Meta = Label({ text: '', fontSize: 14, fill: '#ccc' })
      .addChildTo(this).setPosition(SCREEN_WIDTH - 150, 386 - 18);

    this.cards = [];
    var startX = SCREEN_WIDTH / 2 - ((this.cols - 1) * 70);
    for (var i = 0; i < this.roster.length; i++) {
      var chara = this.roster[i];
      var card = RectangleShape({
        width: 120,
        height: 148,
        fill: '#1c2230',
        stroke: '#666',
        strokeWidth: 2,
      }).addChildTo(this);
      card.setPosition(startX + i * 140, 458);
      var face = Sprite(chara.image).addChildTo(card);
      face.srcRect.set(0, 0, 128, 128);
      face.width = 88;
      face.height = 88;
      face.setPosition(0, -18);
      Label({
        text: chara.name,
        fontSize: 12,
        fill: '#fff',
      }).addChildTo(card).setPosition(0, 52);
      card.charaIndex = i;
      this.cards.push(card);
    }

    this.hint = Label({
      text: '',
      fontSize: 16,
      fill: '#ffe08a',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 400);

    this._refresh();
  },

  _preview: function (x, y, facing) {
    var wrap = DisplayElement().addChildTo(this).setPosition(x, y);
    wrap.facing = facing;
    wrap.sprite = null;
    wrap.anim = null;
    return wrap;
  },

  _setPreview: function (wrap, chara) {
    if (wrap.sprite) wrap.sprite.remove();
    var sprite = Sprite(chara.image).addChildTo(wrap);
    sprite.origin.set(0.5, 1);
    sprite.scaleX = wrap.facing;
    sprite.anim = FrameAnimation(chara.ss).attachTo(sprite);
    sprite.anim.gotoAndPlay('idle');
    wrap.sprite = sprite;
  },

  _refresh: function () {
    var p1 = this.roster[this.p1Index];
    var p2 = this.roster[this.p2Index];
    this._setPreview(this.p1Preview, p1);
    this._setPreview(this.p2Preview, p2);
    this.p1Name.text = '1P  ' + p1.name + (this.p1Locked ? '  OK' : '');
    this.p2Name.text = '2P  ' + p2.name + (this.p2Locked ? '  OK' : '');
    this.p1Name.fill = p1.color;
    this.p2Name.fill = p2.color;
    this.p1Meta.text = p1.title + '  SPD ' + p1.stats.speed + '  HP ' + p1.stats.hp;
    this.p2Meta.text = p2.title + '  SPD ' + p2.stats.speed + '  HP ' + p2.stats.hp;

    for (var i = 0; i < this.cards.length; i++) {
      var card = this.cards[i];
      var isP1 = i === this.p1Index;
      var isP2 = i === this.p2Index;
      if (isP1) {
        card.stroke = '#3aa0ff';
        card.strokeWidth = 4;
      } else if (isP2) {
        card.stroke = '#ff8a3a';
        card.strokeWidth = 4;
      } else {
        card.stroke = '#555';
        card.strokeWidth = 2;
      }
    }

    if (this.p1Locked && this.p2Locked) this.hint.text = 'SPACE で対戦開始';
    else this.hint.text = '';
  },

  _move: function (player, dir) {
    if (player === 1 && this.p1Locked) return;
    if (player === 2 && this.p2Locked) return;
    var n = this.roster.length;
    if (n < 2) return;
    var other = player === 1 ? this.p2Index : this.p1Index;
    var next = player === 1 ? this.p1Index : this.p2Index;
    for (var i = 0; i < n; i++) {
      next = (next + dir + n) % n;
      if (next !== other) break;
    }
    if (player === 1) this.p1Index = next;
    else this.p2Index = next;
    this._refresh();
  },

  _start: function () {
    if (this.p1Index === this.p2Index) return;
    this.exit({
      p1Id: this.roster[this.p1Index].id,
      p2Id: this.roster[this.p2Index].id,
    });
  },

  update: function (app) {
    GamepadHub.poll();
    var kb = app.keyboard;
    if (kb.getKeyDown('a') || GamepadHub.down(0, 'left')) this._move(1, -1);
    if (kb.getKeyDown('d') || GamepadHub.down(0, 'right')) this._move(1, 1);
    if (kb.getKeyDown('left') || GamepadHub.down(1, 'left')) this._move(2, -1);
    if (kb.getKeyDown('right') || GamepadHub.down(1, 'right')) this._move(2, 1);
    if (kb.getKeyDown('j') || GamepadHub.down(0, 'light')) {
      this.p1Locked = !this.p1Locked;
      this._refresh();
    }
    if (kb.getKeyDown('o') || kb.getKeyDown('1') || kb.getKeyDown('num_1') || GamepadHub.down(1, 'light')) {
      this.p2Locked = !this.p2Locked;
      this._refresh();
    }
    if ((kb.getKeyDown('space') || GamepadHub.startDown()) && this.p1Locked && this.p2Locked) this._start();
  },
});
