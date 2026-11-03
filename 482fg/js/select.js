phina.globalize();

// 同担拒否: true で同一キャラ選択不可
// cpuShuffle: VS CPUの順番をシャッフル
// survivalMode: VS CPUで体力を引き継ぐ
// stageFixed: VS CPUのステージを固定
var GAME_OPTIONS = {
  rejectSameCharacter: false,
  cpuShuffle: true,
  survivalMode: false,
  stageFixed: false,
};

function loadGameOptions() {
  try {
    var raw = localStorage.getItem('fg_options');
    if (!raw) return;
    var saved = JSON.parse(raw);
    if (typeof saved.rejectSameCharacter === 'boolean') {
      GAME_OPTIONS.rejectSameCharacter = saved.rejectSameCharacter;
    }
    if (typeof saved.cpuShuffle === 'boolean') GAME_OPTIONS.cpuShuffle = saved.cpuShuffle;
    if (typeof saved.survivalMode === 'boolean') GAME_OPTIONS.survivalMode = saved.survivalMode;
    if (typeof saved.stageFixed === 'boolean') GAME_OPTIONS.stageFixed = saved.stageFixed;
  } catch (e) {}
}

function saveGameOptions() {
  try {
    localStorage.setItem('fg_options', JSON.stringify(GAME_OPTIONS));
  } catch (e) {}
}

loadGameOptions();

function allowSameCharacter() {
  return !GAME_OPTIONS.rejectSameCharacter;
}

function buildCpuQueue(p1Id) {
  var ids = [];
  for (var i = 0; i < CHARACTER_ROSTER.length; i++) {
    var id = CHARACTER_ROSTER[i].id;
    if (!allowSameCharacter() && id === p1Id) continue;
    ids.push(id);
  }
  if (GAME_OPTIONS.cpuShuffle) {
    for (var j = ids.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = ids[j];
      ids[j] = ids[k];
      ids[k] = tmp;
    }
  }
  return ids;
}

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
    this.cpuMode = !!(options && options.cpu);
    this.ready = false;
    this.readyWait = 0;
    this.READY_FRAMES = 120;

    Label({
      text: 'CHARACTER SELECT',
      fontSize: 32,
      fill: '#fff',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 36);

    Label({
      text: this.cpuMode ? '1P: A/D  G決定    パッド: Y決定' : '1P: A/D  G決定    2P: ←/→  8決定    パッド: Y決定',
      fontSize: 14,
      fill: '#aaa',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 68);

    this.modeLabel = Label({
      text: this.cpuMode ? 'VS CPU' : 'VS 2P',
      fontSize: 16,
      fill: '#ffe08a',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 92);

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
      var hw = 60, hh = 74, sw = 4;
      var mk = function (w, h, fill, x, y) {
        return RectangleShape({
          width: w,
          height: h,
          fill: fill,
          stroke: null,
        }).addChildTo(card).setPosition(x, y).hide();
      };
      card.splitBorders = [
        mk(sw, 148, '#3aa0ff', -hw + sw / 2, 0),
        mk(sw, 148, '#ff8a3a', hw - sw / 2, 0),
        mk(hw, sw, '#3aa0ff', -hw / 2, -hh + sw / 2),
        mk(hw, sw, '#ff8a3a', hw / 2, -hh + sw / 2),
        mk(hw, sw, '#3aa0ff', -hw / 2, hh - sw / 2),
        mk(hw, sw, '#ff8a3a', hw / 2, hh - sw / 2),
      ];
      card.charaIndex = i;
      this.cards.push(card);
    }

    this.hint = Label({
      text: '',
      fontSize: 16,
      fill: '#ffe08a',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 400);

    this.readyOverlay = RectangleShape({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      fill: 'rgba(8, 10, 16, 0.72)',
      stroke: null,
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    this.readyOverlay.hide();

    this.readyTitle = Label({
      text: 'READY',
      fontSize: 56,
      fill: '#ffe08a',
      fontWeight: 'bold',
    }).addChildTo(this.readyOverlay).setPosition(0, -40);

    this.readyMatchup = Label({
      text: '',
      fontSize: 22,
      fill: '#fff',
    }).addChildTo(this.readyOverlay).setPosition(0, 24);

    this.readySub = Label({
      text: '対戦を開始します',
      fontSize: 16,
      fill: '#ccc',
    }).addChildTo(this.readyOverlay).setPosition(0, 58);

    this._refresh();
  },

  _preview: function (x, y, facing) {
    var wrap = DisplayElement().addChildTo(this).setPosition(x, y);
    wrap.facing = facing;
    wrap.sprite = null;
    wrap.anim = null;
    return wrap;
  },

  _setPreview: function (wrap, chara, imageName) {
    if (wrap.sprite) wrap.sprite.remove();
    var sprite = Sprite(imageName || chara.image).addChildTo(wrap);
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
    this._setPreview(this.p2Preview, p2, p2.image2p);
    this.p1Name.text = '1P  ' + p1.name + (this.p1Locked ? '  OK' : '');
    this.p2Name.text = (this.cpuMode ? 'CPU  全キャラ' : '2P  ' + p2.name) + (this.p2Locked && !this.cpuMode ? '  OK' : '');
    this.p1Name.fill = p1.color;
    this.p2Name.fill = p2.color;
    this.p1Meta.text = p1.title + '  SPD ' + p1.stats.speed + '  HP ' + p1.stats.hp;
    this.p2Meta.text = p2.title + '  SPD ' + p2.stats.speed + '  HP ' + p2.stats.hp;

    for (var i = 0; i < this.cards.length; i++) {
      var card = this.cards[i];
      var isP1 = i === this.p1Index;
      var isP2 = !this.cpuMode && i === this.p2Index;
      if (isP1 && isP2) {
        card.stroke = null;
        card.strokeWidth = 0;
        for (var b = 0; b < card.splitBorders.length; b++) card.splitBorders[b].show();
      } else if (isP1) {
        for (var b = 0; b < card.splitBorders.length; b++) card.splitBorders[b].hide();
        card.stroke = '#3aa0ff';
        card.strokeWidth = 4;
      } else if (isP2) {
        for (var b = 0; b < card.splitBorders.length; b++) card.splitBorders[b].hide();
        card.stroke = '#ff8a3a';
        card.strokeWidth = 4;
      } else {
        for (var b = 0; b < card.splitBorders.length; b++) card.splitBorders[b].hide();
        card.stroke = '#555';
        card.strokeWidth = 2;
      }
    }

    if (this.ready) this.hint.text = '';
    else if (this.p1Locked && this.p2Locked) this.hint.text = '';
    else this.hint.text = '';
  },

  _beginReady: function () {
    if (this.ready) return;
    if (!this.cpuMode && !allowSameCharacter() && this.p1Index === this.p2Index) return;
    this.ready = true;
    this.readyWait = this.READY_FRAMES;
    var p1 = this.roster[this.p1Index];
    var p2 = this.roster[this.p2Index];
    this.readyMatchup.text = this.cpuMode
      ? '1P  ' + p1.name + '   VS   CPU'
      : '1P  ' + p1.name + '   VS   2P  ' + p2.name;
    this.readyOverlay.show();
    SoundFx.play('ui_ready');
  },

  _move: function (player, dir) {
    if (player === 1 && this.p1Locked) return;
    if (player === 2 && this.p2Locked) return;
    var n = this.roster.length;
    if (n < 1) return;
    if (n < 2 && !allowSameCharacter()) return;
    var other = player === 1 ? this.p2Index : this.p1Index;
    var next = player === 1 ? this.p1Index : this.p2Index;
    for (var i = 0; i < n; i++) {
      next = (next + dir + n) % n;
      if (allowSameCharacter() || next !== other) break;
    }
    if (player === 1) this.p1Index = next;
    else this.p2Index = next;
    SoundFx.play('ui_move');
    this._refresh();
  },

  _start: function () {
    if (this.cpuMode) {
      var p1Id = this.roster[this.p1Index].id;
      var queue = buildCpuQueue(p1Id);
      var stage = GAME_OPTIONS.stageFixed ? pickRandomStage() : null;
      this.exit({
        p1Id: p1Id,
        p2Id: queue.length ? queue[0] : p1Id,
        cpu: true,
        cpuQueue: queue,
        cpuIndex: 0,
        survival: !!GAME_OPTIONS.survivalMode,
        stageFixed: !!GAME_OPTIONS.stageFixed,
        stageId: stage ? stage.id : null,
      });
      return;
    }
    if (!allowSameCharacter() && this.p1Index === this.p2Index) return;
    this.exit({
      p1Id: this.roster[this.p1Index].id,
      p2Id: this.roster[this.p2Index].id,
      cpu: false,
    });
  },

  update: function (app) {
    GamepadHub.poll();
    if (this.ready) {
      this.readyWait -= 1;
      if (this.readyWait <= 0) this._start();
      return;
    }

    var kb = app.keyboard;
    if (kb.getKeyDown('a') || GamepadHub.down(0, 'left')) this._move(1, -1);
    if (kb.getKeyDown('d') || GamepadHub.down(0, 'right')) this._move(1, 1);
    if (kb.getKeyDown('left') || GamepadHub.down(1, 'left')) {
      if (!this.cpuMode) this._move(2, -1);
    }
    if (kb.getKeyDown('right') || GamepadHub.down(1, 'right')) {
      if (!this.cpuMode) this._move(2, 1);
    }
    if (kb.getKeyDown('g') || GamepadHub.down(0, 'light')) {
      this.p1Locked = !this.p1Locked;
      if (this.cpuMode) this.p2Locked = true;
      SoundFx.play(this.p1Locked ? 'ui_ok' : 'ui_move');
      this._refresh();
      if (this.cpuMode && this.p1Locked) this._beginReady();
      else if (this.p1Locked && this.p2Locked) this._beginReady();
    }
    if (!this.cpuMode && (kb.getKeyDown('8') || kb.getKeyDown('num_8') || GamepadHub.down(1, 'light'))) {
      this.p2Locked = !this.p2Locked;
      SoundFx.play(this.p2Locked ? 'ui_ok' : 'ui_move');
      this._refresh();
      if (this.p1Locked && this.p2Locked) this._beginReady();
    }
  },
});
