phina.globalize();

phina.define('GameTitleScene', {
  superClass: 'DisplayScene',

  init: function (options) {
    this.superInit(options);
    this.backgroundColor = '#151515';

    Label({
      text: '482 FIGHTER(仮)',
      fontSize: 56,
      fill: '#fff',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(this.gridX.center(), 140);

    Label({
      text: '',
      fontSize: 20,
      fill: '#aaa',
    }).addChildTo(this).setPosition(this.gridX.center(), 190);

    Label({
      text: '1P: A/D 移動  W ジャンプ  S しゃがみ  B弱 N強 Mキック\n2P: ←/→ 移動  ↑ジャンプ  ↓しゃがみ  I弱 O強 Pキック\nパッド: 十字/スティック 移動  A/X弱  Y強  B/R1キック  START決定\n必殺  ↓↘→+弱/強 波動  →↓↘+弱/強 昇龍  ↓↙←+キック 竜巻\n投げ  前+弱強 一本背負い    後+弱強 巴投げ',
      fontSize: 18,
      fill: '#ddd',
      align: 'center',
    }).addChildTo(this).setPosition(this.gridX.center(), 300);

    Label({
      text: 'SPACE / START でキャラ選択へ',
      fontSize: 22,
      fill: '#ffe08a',
    }).addChildTo(this).setPosition(this.gridX.center(), 430);
  },

  update: function (app) {
    GamepadHub.poll();
    if (app.keyboard.getKeyDown('space') || GamepadHub.startDown()) this.exit();
  },
});

phina.define('VersusScene', {
  superClass: 'DisplayScene',

  init: function (options) {
    this.superInit(options);
    this.backgroundColor = '#1b2230';
    this.ended = false;
    this.finishWait = 0;
    this.timeLeft = MATCH_TIME;
    this.frame = 0;
    this.hitstop = 0;
    this.debug = true;
    this.shots = [];

    var p1Data = getCharacter(options && options.p1Id);
    var p2Data = getCharacter(options && options.p2Id);
    this.stageData = (options && options.stageId) ? getStage(options.stageId) : pickRandomStage();

    Sprite(this.stageData.image)
      .addChildTo(this)
      .setOrigin(0.5, 0.5)
      .setPosition(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

    this.p1 = Fighter({
      name: '1P',
      charaName: p1Data.name,
      keys: P1_KEYS,
      padIndex: 0,
      facing: 1,
      image: p1Data.image,
      ss: p1Data.ss,
      color: p1Data.color,
      speed: p1Data.stats.speed,
      jump: p1Data.stats.jump,
      hp: p1Data.stats.hp,
      moves: mergeMoves(p1Data.moves),
    }).addChildTo(this).setPosition(260, GROUND_Y);

    this.p2 = Fighter({
      name: '2P',
      charaName: p2Data.name,
      keys: P2_KEYS,
      padIndex: 1,
      facing: -1,
      image: p2Data.image,
      ss: p2Data.ss,
      color: p2Data.color,
      speed: p2Data.stats.speed,
      jump: p2Data.stats.jump,
      hp: p2Data.stats.hp,
      moves: mergeMoves(p2Data.moves),
    }).addChildTo(this).setPosition(700, GROUND_Y);

    this.hpBarWidth = 360;
    this.p1BarBg = this._bar(24, 40, this.hpBarWidth, '#222', 0);
    this.p1Bar = this._bar(24, 40, this.hpBarWidth, p1Data.color, 0);
    this.p2BarBg = this._bar(SCREEN_WIDTH - 24, 40, this.hpBarWidth, '#222', 1);
    this.p2Bar = this._bar(SCREEN_WIDTH - 24, 40, this.hpBarWidth, p2Data.color, 1);

    Label({
      text: '1P ' + p1Data.name,
      fontSize: 14,
      fill: '#fff',
      align: 'left',
    }).addChildTo(this).setPosition(24, 18);
    Label({
      text: '2P ' + p2Data.name,
      fontSize: 14,
      fill: '#fff',
      align: 'right',
    }).addChildTo(this).setPosition(SCREEN_WIDTH - 24, 18);

    this.timerLabel = Label({
      text: String(MATCH_TIME),
      fontSize: 36,
      fill: '#fff',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 36);

    Label({
      text: this.stageData.name,
      fontSize: 12,
      fill: '#ffe08a',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 62);

    this.koLabel = Label({
      text: '',
      fontSize: 64,
      fill: '#fff',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 200);
  },

  _bar: function (x, y, w, color, originX) {
    var bar = RectangleShape({
      width: w,
      height: 18,
      fill: color,
      stroke: '#fff',
      strokeWidth: 1,
    }).addChildTo(this);
    bar.origin.set(originX == null ? 0 : originX, 0.5);
    bar.setPosition(x, y);
    return bar;
  },

  update: function (app) {
    GamepadHub.poll();
    if (app.keyboard.getKeyDown('h')) {
      this.debug = !this.debug;
      this.p1.setDebugVisible(this.debug);
      this.p2.setDebugVisible(this.debug);
    }

    if (this.ended) {
      this.p1.wakeUp();
      this.p2.wakeUp();
      if (this.finishWait > 0) this.finishWait -= 1;
      if (this.finishWait <= 0) this.exit({ winner: this.winner });
      return;
    }
    if (this.hitstop > 0) {
      this.hitstop -= 1;
      this.p1.sleep();
      this.p2.sleep();
      return;
    }
    this.p1.wakeUp();
    this.p2.wakeUp();

    var inThrow = this.p1.state === 'throwing' || this.p1.state === 'thrown' ||
      this.p2.state === 'throwing' || this.p2.state === 'thrown';
    if (!inThrow) {
      this.p1.facing = this.p1.x <= this.p2.x ? 1 : -1;
      this.p2.facing = this.p2.x <= this.p1.x ? 1 : -1;
      this._separate();
    }
    this._spawnShot(this.p1);
    this._spawnShot(this.p2);
    this._updateShots();
    this._tryHit(this.p1, this.p2);
    this._tryHit(this.p2, this.p1);
    this._updateHud();

    this.frame += 1;
    if (this.frame % 60 === 0) this.timeLeft -= 1;
    if (this.p1.hp <= 0 || this.p2.hp <= 0 || this.timeLeft <= 0) {
      this._finish();
    }
  },

  _separate: function () {
    // どちらかが空中なら横の押し出しをしない（ジャンプで越えられる）
    if (!this.p1.onGround || !this.p2.onGround) return;
    var gap = 50;
    var dx = this.p2.x - this.p1.x;
    if (Math.abs(dx) < gap) {
      var push = (gap - Math.abs(dx)) / 2;
      var dir = dx >= 0 ? 1 : -1;
      this.p1.x -= push * dir;
      this.p2.x += push * dir;
    }
  },

  _spawnShot: function (fighter) {
    if (!fighter.queuedShot) return;
    var shot = HadouShot(fighter, fighter.queuedShot).addChildTo(this);
    shot.setPosition(fighter.x + fighter.facing * 50, fighter.y - 72);
    this.shots.push(shot);
    fighter.queuedShot = null;
  },

  _updateShots: function () {
    var self = this;
    this.shots = this.shots.filter(function (shot) {
      if (!shot.parent) return false;
      var defender = shot.owner === self.p1 ? self.p2 : self.p1;
      if (!shot.hasHit && defender.alive && aabbOverlap(shot.getRect(), defender.hurtbox.getRect())) {
        var result = defender.takeHit(shot.move, shot.facing);
        if (result) {
          shot.hasHit = true;
          shot.remove();
          self.hitstop = result === 'block' ? 2 : 4;
          return false;
        }
      }
      return true;
    });
  },

  _tryHit: function (attacker, defender) {
    if (!attacker.attackBox.active || attacker.hasHit) return;
    if (!defender.alive) return;
    if (aabbOverlap(attacker.attackBox.getRect(), defender.hurtbox.getRect())) {
      var isThrow = !!(attacker.move && attacker.move.throw);
      if (isThrow) defender.thrower = attacker;
      var hit = defender.takeHit(attacker.move, attacker.facing);
      if (!hit && isThrow) defender.thrower = null;
      if (hit) {
        attacker.hasHit = true;
        attacker.attackBox.active = false;
        if (hit === 'block') this.hitstop = 2;
        else if (hit === 'tech') {
          defender.thrower = null;
          attacker._throwBreak(-attacker.facing);
          this.hitstop = 4;
        } else if (hit === 'throw') {
          attacker.startThrowing();
          this.hitstop = 6;
        } else {
          defender.thrower = null;
          this.hitstop = attacker.move === MOVES.heavy ? 6 : 3;
        }
      }
    }
  },

  _updateHud: function () {
    this.p1Bar.width = Math.max(0.001, this.hpBarWidth * (this.p1.hp / this.p1.maxHp));
    this.p2Bar.width = Math.max(0.001, this.hpBarWidth * (this.p2.hp / this.p2.maxHp));
    this.timerLabel.text = String(Math.max(0, this.timeLeft));
  },

  _finish: function () {
    this.ended = true;
    var winner = 'DRAW';
    if (this.p1.hp > this.p2.hp) winner = '1P';
    else if (this.p2.hp > this.p1.hp) winner = '2P';
    this.winner = winner;
    this.koLabel.text = winner === 'DRAW' ? 'DRAW' : winner + ' WIN';
    this.finishWait = 90;
  },
});

phina.define('GameResultScene', {
  superClass: 'DisplayScene',

  init: function (options) {
    this.superInit(options);
    this.backgroundColor = '#101010';
    var winner = (options && options.winner) || 'DRAW';

    Label({
      text: winner === 'DRAW' ? 'DRAW' : winner + ' WIN',
      fontSize: 72,
      fill: '#ffe08a',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-1));

    Label({
      text: 'SPACE でタイトルへ',
      fontSize: 22,
      fill: '#ddd',
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(2));
  },

  update: function (app) {
    GamepadHub.poll();
    if (app.keyboard.getKeyDown('space') || GamepadHub.startDown()) this.exit();
  },
});
