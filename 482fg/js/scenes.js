phina.globalize();

phina.define('GameTitleScene', {
  superClass: 'DisplayScene',

  init: function (options) {
    this.superInit(options);
    this.backgroundColor = '#151515';
    this.modeIndex = 0;
    this.selecting = false;
    this.idleFrames = 0;
    this.modes = [
      { label: '1P VS 2P', cpu: false },
      { label: '1P VS CPU', cpu: true },
      { label: 'OPTION', option: true },
      { label: '遊び方', howto: true },
    ];

    this.titleSprite = Sprite('title').addChildTo(this).setPosition(this.gridX.center(), this.gridY.center()).setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    this.pressLabel = Label({
      text: 'SPACE / START を押す',
      fontSize: 28,
      fill: '#ffe08a',
      fontWeight: 'bold',
      stroke: '#000',
      strokeWidth: 6,
    }).addChildTo(this).setPosition(this.gridX.center(), 420);

    this.modeHeader = Label({
      text: 'MODE SELECT',
      fontSize: 20,
      fill: '#aaa',
    }).addChildTo(this).setPosition(this.gridX.center(), 160);
    this.modeHeader.hide();

    this.modeLabels = [];
    for (var i = 0; i < this.modes.length; i++) {
      var lb = Label({
        text: this.modes[i].label,
        fontSize: 36,
        fill: '#888',
        fontWeight: 'bold',
        stroke: '#000',
        strokeWidth: 5,
      }).addChildTo(this).setPosition(this.gridX.center(), 210 + i * 48);
      lb.hide();
      this.modeLabels.push(lb);
    }

    this.footerLabel = Label({
      text: '↑↓ で選択   SPACE / START で決定',
      fontSize: 22,
      fill: '#ffe08a',
    }).addChildTo(this).setPosition(this.gridX.center(), 480);
    this.footerLabel.hide();
  },

  _refreshModes: function () {
    for (var i = 0; i < this.modeLabels.length; i++) {
      var on = i === this.modeIndex;
      this.modeLabels[i].fill = on ? '#ffe08a' : '#666';
      this.modeLabels[i].fontSize = on ? 40 : 32;
    }
  },

  _enterSelect: function () {
    this.selecting = true;
    this.titleSprite.alpha = 0.35;
    this.pressLabel.hide();
    this.modeHeader.show();
    for (var i = 0; i < this.modeLabels.length; i++) this.modeLabels[i].show();
    this.footerLabel.show();
    this._refreshModes();
  },

  _anyInput: function (kb) {
    return kb.getKeyDown('space') || kb.getKeyDown('up') || kb.getKeyDown('down') ||
      kb.getKeyDown('w') || kb.getKeyDown('s') || kb.getKeyDown('a') || kb.getKeyDown('d') ||
      GamepadHub.startDown() || GamepadHub.down(0, 'up') || GamepadHub.down(0, 'down') ||
      GamepadHub.down(0, 'left') || GamepadHub.down(0, 'right') || GamepadHub.down(0, 'light');
  },

  update: function (app) {
    GamepadHub.poll();
    var kb = app.keyboard;
    var space = kb.getKeyDown('space') || GamepadHub.startDown();
    var any = this._anyInput(kb);

    if (any) this.idleFrames = 0;
    else this.idleFrames += 1;
    if (this.idleFrames >= 15 * 60) {
      this.exit({ nextLabel: 'demo', demo: true });
      return;
    }

    if (!this.selecting) {
      this.pressLabel.alpha = Math.sin(app.frame * 0.15) > 0 ? 1 : 0;
      if (space) {
        SoundFx.unlock();
        SoundFx.play('ui_ok');
        this._enterSelect();
      }
      return;
    }

    var up = kb.getKeyDown('up') || kb.getKeyDown('w') || GamepadHub.down(0, 'up');
    var down = kb.getKeyDown('down') || kb.getKeyDown('s') || GamepadHub.down(0, 'down');
    if (up || down) {
      this.modeIndex = (this.modeIndex + (down ? 1 : -1) + this.modes.length) % this.modes.length;
      SoundFx.play('ui_move');
      this._refreshModes();
    }
    if (space) {
      SoundFx.play('ui_ok');
      var mode = this.modes[this.modeIndex];
      if (mode.option) {
        this.exit({ nextLabel: 'option' });
      } else if (mode.howto) {
        this.exit({ nextLabel: 'howto' });
      } else {
        this.exit({ cpu: !!mode.cpu, nextLabel: 'select' });
      }
    }
  },
});

phina.define('HowToScene', {
  superClass: 'DisplayScene',

  init: function (options) {
    this.superInit(options);
    this.backgroundColor = '#151515';

    Label({
      text: '遊び方',
      fontSize: 48,
      fill: '#fff',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(this.gridX.center(), 70);

    Label({
      text: '1P: A/D 移動  W ジャンプ  S しゃがみ  G弱P H強P B弱K N強K M必殺\n2P: ←/→ 移動  ↑ジャンプ  ↓しゃがみ  8弱P 9強P I弱K O強K P必殺\nパッド: 十字/スティック 移動  Y弱P  X強P  A弱K  B強K  L必殺  START決定\n※パッドのボタン配置はOPTIONで変更可能\n必殺  前+必殺 波動(2ゲージ)  後+必殺 竜巻(1ゲージ)  上+必殺 昇龍(0ゲージ)  下+必殺 瞬獄殺(3ゲージ)\n投げ  前+弱or強P 一本背負い    後+弱or強P 巴投げ',
      fontSize: 20,
      fill: '#ddd',
      align: 'center',
    }).addChildTo(this).setPosition(this.gridX.center(), 240);

    Label({
      text: 'SPACE / START / ESC / SELECT でタイトルへ',
      fontSize: 20,
      fill: '#aaa',
    }).addChildTo(this).setPosition(this.gridX.center(), 480);
  },

  update: function (app) {
    GamepadHub.poll();
    var kb = app.keyboard;
    if (kb.getKeyDown('space') || kb.getKeyDown('escape') || GamepadHub.startDown() || GamepadHub.selectDown()) {
      SoundFx.play('ui_ok');
      this.exit({ nextLabel: 'title' });
    }
  },
});

phina.define('OptionScene', {
  superClass: 'DisplayScene',

  init: function (options) {
    this.superInit(options);
    this.backgroundColor = '#151515';
    this.mode = 'menu';
    this.menuIndex = 0;
    this.playerIndex = 0;
    this.step = 0;

    this.titleLabel = Label({
      text: 'OPTION',
      fontSize: 48,
      fill: '#fff',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(this.gridX.center(), 80);

    this.menuLabels = [];
    var items = ['同担拒否', 'ボタン配置', 'VS CPU', 'ステージ選択', 'ラウンド時間', 'BGM', 'キャッシュ再読み込み', 'タイトルへ戻る'];
    var itemY = [140, 180, 220, 260, 300, 340, 380, 470];
    for (var i = 0; i < items.length; i++) {
      var lb = Label({
        text: items[i],
        fontSize: 32,
        fill: '#fff',
      }).addChildTo(this).setPosition(this.gridX.center(), itemY[i]);
      this.menuLabels.push(lb);
    }
    this.valueLabel = Label({
      text: '',
      fontSize: 32,
      fill: '#ffe08a',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(this.gridX.center() + 200, 200);

    this.cpuIndex = 0;
    this.cpuLabels = [];
    this.cpuValues = [];
    var cpuItems = ['難易度', 'CPUシャッフル', 'サバイバルモード'];
    for (var c = 0; c < cpuItems.length; c++) {
      var cl = Label({
        text: cpuItems[c],
        fontSize: 28,
        fill: '#fff',
      }).addChildTo(this).setPosition(this.gridX.center() - 160, 200 + c * 56);
      cl.hide();
      this.cpuLabels.push(cl);
      var cv = Label({
        text: '',
        fontSize: 28,
        fill: '#ffe08a',
        fontWeight: 'bold',
      }).addChildTo(this).setPosition(this.gridX.center() + 180, 200 + c * 56);
      cv.hide();
      this.cpuValues.push(cv);
    }

    this.subTitle = Label({
      text: '',
      fontSize: 28,
      fill: '#ffe08a',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(this.gridX.center(), 150);
    this.subTitle.hide();

    this.roleLabels = [];
    for (var r = 0; r < PAD_ACTIONS.length; r++) {
      var role = Label({
        text: '',
        fontSize: 26,
        fill: '#ccc',
      }).addChildTo(this).setPosition(this.gridX.center(), 210 + r * 40);
      role.hide();
      this.roleLabels.push(role);
    }

    this.prompt = Label({
      text: '',
      fontSize: 20,
      fill: '#aaa',
    }).addChildTo(this).setPosition(this.gridX.center(), 510);

    this._refresh();
  },

  _refresh: function () {
    var menu = this.mode === 'menu';
    for (var i = 0; i < this.menuLabels.length; i++) {
      this.menuLabels[i].visible = menu;
      var on = menu && i === this.menuIndex;
      this.menuLabels[i].fill = on ? '#ffe08a' : '#888';
      this.menuLabels[i].fontSize = on ? 36 : 30;
    }
    this.valueLabel.visible = false;
    if (this.stageLabels && this.mode !== 'stage') {
      for (var sj = 0; sj < this.stageLabels.length; sj++) {
        this.stageLabels[sj].hide();
        this.stageValues[sj].hide();
      }
    }
    for (var c = 0; c < this.cpuLabels.length; c++) {
      this.cpuLabels[c].visible = this.mode === 'cpu';
      this.cpuValues[c].visible = this.mode === 'cpu';
    }
    if (menu) {
      this.titleLabel.text = 'OPTION';
      this.subTitle.hide();
      for (var r = 0; r < this.roleLabels.length; r++) this.roleLabels[r].hide();
      this.prompt.text = this.menuIndex === 7
        ? 'SPACE / START でタイトルへ'
        : (this.menuIndex === 6
          ? 'SPACE / START でキャッシュ削除＆再読み込み'
          : 'SPACE / START で開始');
    } else if (this.mode === 'roundtime') {
      this.titleLabel.text = 'ラウンド時間';
      this.subTitle.show();
      var rt = GAME_OPTIONS.roundTime;
      this.subTitle.text = (rt === 'unlimited') ? '∞' : String(rt);
      this.subTitle.fill = '#ffe08a';
      for (var r = 0; r < this.roleLabels.length; r++) this.roleLabels[r].hide();
      this.prompt.text = '←→ で切り替え    ESC / SELECT で戻る';
    } else if (this.mode === 'reject') {
      this.titleLabel.text = '同担拒否';
      this.valueLabel.visible = false;
      this.subTitle.show();
      this.subTitle.text = GAME_OPTIONS.rejectSameCharacter ? 'ON' : 'OFF';
      this.subTitle.fill = GAME_OPTIONS.rejectSameCharacter ? '#ff8a3a' : '#3aa0ff';
      for (var r = 0; r < this.roleLabels.length; r++) this.roleLabels[r].hide();
      this.prompt.text = '←→ で切り替え    ESC / SELECT で戻る';
    } else if (this.mode === 'cpu') {
      this.titleLabel.text = 'VS CPU';
      this.valueLabel.visible = false;
      this.subTitle.hide();
      for (var r = 0; r < this.roleLabels.length; r++) this.roleLabels[r].hide();
      var vals = [
        GAME_OPTIONS.cpuDifficulty || '中級',
        GAME_OPTIONS.cpuShuffle ? 'ON' : 'OFF',
        GAME_OPTIONS.survivalMode ? 'ON' : 'OFF',
      ];
      for (var c = 0; c < this.cpuLabels.length; c++) {
        var on = c === this.cpuIndex;
        this.cpuLabels[c].fill = on ? '#ffe08a' : '#888';
        this.cpuLabels[c].fontSize = on ? 32 : 26;
        this.cpuValues[c].text = vals[c];
        this.cpuValues[c].fill = on ? '#ffe08a' : '#aaa';
      }
      this.prompt.text = '←→ で切り替え    ESC / SELECT で戻る';
    } else if (this.mode === 'stage') {
      this.titleLabel.text = 'ステージ選択';
      this.valueLabel.visible = false;
      this.subTitle.hide();
      for (var r = 0; r < this.roleLabels.length; r++) this.roleLabels[r].hide();
      var s2 = GAME_OPTIONS.stageSelect2p || 'random';
      var sc = GAME_OPTIONS.stageSelectCpu || 'random';
      var l2 = s2 === 'on' ? 'ON' : (s2 === 'random' ? 'ランダム' : (getStage(s2).name || s2));
      var lc = sc === 'perChar' ? 'キャラごと' : (sc === 'random' ? 'ランダム' : (getStage(sc).name || sc));
      if (!this.stageLabels) {
        this.stageLabels = [];
        this.stageValues = [];
        var names = ['VS 2P', 'VS CPU'];
        for (var si = 0; si < 2; si++) {
          var sl = Label({ text: names[si], fontSize: 28, fill: '#fff' }).addChildTo(this).setPosition(this.gridX.center() - 160, 200 + si * 60);
          this.stageLabels.push(sl);
          var sv = Label({ text: '', fontSize: 28, fill: '#ffe08a', fontWeight: 'bold' }).addChildTo(this).setPosition(this.gridX.center() + 180, 200 + si * 60);
          this.stageValues.push(sv);
        }
      }
      var vals = [l2, lc];
      for (var si = 0; si < 2; si++) {
        var on = si === (this.stageIndex || 0);
        this.stageLabels[si].show();
        this.stageLabels[si].fill = on ? '#ffe08a' : '#888';
        this.stageLabels[si].fontSize = on ? 32 : 26;
        this.stageValues[si].show();
        this.stageValues[si].text = vals[si];
        this.stageValues[si].fill = on ? '#ffe08a' : '#aaa';
      }
      this.prompt.text = '↑↓ で選択  ←→ で切り替え    ESC / SELECT で戻る';
    } else if (this.mode === 'bgm') {
      this.titleLabel.text = 'BGM';
      this.valueLabel.visible = false;
      this.subTitle.show();
      this.subTitle.text = GAME_OPTIONS.bgm ? 'ON' : 'OFF';
      this.subTitle.fill = GAME_OPTIONS.bgm ? '#3aa0ff' : '#ff8a3a';
      for (var r = 0; r < this.roleLabels.length; r++) this.roleLabels[r].hide();
      this.prompt.text = '←→ で切り替え    ESC / SELECT で戻る';
    } else if (this.mode === 'player') {
      this.titleLabel.text = 'ボタン配置';
      this.valueLabel.visible = false;
      this.subTitle.show();
      this.subTitle.text = this.playerIndex === 0 ? '1P' : '2P';
      this.subTitle.fill = this.playerIndex === 0 ? '#3aa0ff' : '#ff8a3a';
      for (var r = 0; r < this.roleLabels.length; r++) this.roleLabels[r].hide();
      this.prompt.text = '←→ で選択    SPACE / START で決定    ESC / SELECT で戻る';
    } else {
      this.titleLabel.text = (this.playerIndex === 0 ? '1P' : '2P') + ' ボタン配置';
      this.valueLabel.visible = false;
      this.subTitle.hide();
      var bind = this.draft || PAD_BINDINGS[this.playerIndex];
      for (var r = 0; r < this.roleLabels.length; r++) {
        var act = PAD_ACTIONS[r];
        var current = r === this.step;
        this.roleLabels[r].show();
        this.roleLabels[r].text = act.label + '    ' + (r < this.step ? padButtonName(bind[act.key]) : (current ? '← ボタンを押す' : ''));
        this.roleLabels[r].fill = current ? '#ffe08a' : (r < this.step ? '#fff' : '#666');
        this.roleLabels[r].fontSize = current ? 30 : 24;
      }
      this.prompt.text = 'A / B / X / Y / L / R を押す    ESC / SELECT で戻る';
    }
  },

  update: function (app) {
    GamepadHub.poll();
    var kb = app.keyboard;
    if (this.mode === 'menu') this._updateMenu(kb);
    else if (this.mode === 'roundtime') this._updateRoundTime(kb);
    else if (this.mode === 'reject') this._updateReject(kb);
    else if (this.mode === 'cpu') this._updateCpu(kb);
    else if (this.mode === 'stage') this._updateStage(kb);
    else if (this.mode === 'bgm') this._updateBgm(kb);
    else if (this.mode === 'player') this._updatePlayer(kb);
    else this._updateAssign(kb);
  },

  _updateMenu: function (kb) {
    var up = kb.getKeyDown('up') || kb.getKeyDown('w') || GamepadHub.down(0, 'up');
    var down = kb.getKeyDown('down') || kb.getKeyDown('s') || GamepadHub.down(0, 'down');
    if (up || down) {
      this.menuIndex = (this.menuIndex + (down ? 1 : -1) + 8) % 8;
      SoundFx.play('ui_move');
      this._refresh();
    }
    if (kb.getKeyDown('space') || GamepadHub.startDown()) {
      SoundFx.play('ui_ok');
      if (this.menuIndex === 0) {
        this.mode = 'reject';
        this._refresh();
      } else if (this.menuIndex === 1) {
        this.mode = 'player';
        this._refresh();
      } else if (this.menuIndex === 2) {
        this.mode = 'cpu';
        this._refresh();
      } else if (this.menuIndex === 3) {
        this.mode = 'stage';
        this._refresh();
      } else if (this.menuIndex === 4) {
        this.mode = 'roundtime';
        this._refresh();
      } else if (this.menuIndex === 5) {
        this.mode = 'bgm';
        this._refresh();
      } else if (this.menuIndex === 6) {
        this._forceReloadCache();
      } else if (this.menuIndex === 7) {
        this.exit({ nextLabel: 'title' });
      }
    }
    if (kb.getKeyDown('escape')) {
      SoundFx.play('ui_ok');
      this.exit({ nextLabel: 'title' });
    }
  },

  _updateRoundTime: function (kb) {
    var left = kb.getKeyDown('left') || kb.getKeyDown('a') || GamepadHub.down(0, 'left');
    var right = kb.getKeyDown('right') || kb.getKeyDown('d') || GamepadHub.down(0, 'right');
    if (left || right) {
      var order = [30, 60, 99, 'unlimited'];
      var i = order.indexOf(GAME_OPTIONS.roundTime);
      if (i < 0) i = 1;
      GAME_OPTIONS.roundTime = order[(i + (right ? 1 : -1) + order.length) % order.length];
      saveGameOptions();
      SoundFx.play('ui_move');
      this._refresh();
    }
    if (kb.getKeyDown('escape') || GamepadHub.selectDown()) {
      SoundFx.play('ui_ok');
      this.mode = 'menu';
      this._refresh();
    }
  },

  _updateBgm: function (kb) {
    var left = kb.getKeyDown('left') || kb.getKeyDown('a') || GamepadHub.down(0, 'left');
    var right = kb.getKeyDown('right') || kb.getKeyDown('d') || GamepadHub.down(0, 'right');
    if (left || right) {
      GAME_OPTIONS.bgm = !GAME_OPTIONS.bgm;
      saveGameOptions();
      if (!GAME_OPTIONS.bgm) SoundFx.stopBgm();
      SoundFx.play('ui_move');
      this._refresh();
    }
    if (kb.getKeyDown('escape') || GamepadHub.selectDown()) {
      SoundFx.play('ui_ok');
      this.mode = 'menu';
      this._refresh();
    }
  },

  _updateReject: function (kb) {
    var left = kb.getKeyDown('left') || kb.getKeyDown('a') || GamepadHub.down(0, 'left');
    var right = kb.getKeyDown('right') || kb.getKeyDown('d') || GamepadHub.down(0, 'right');
    if (left || right) {
      GAME_OPTIONS.rejectSameCharacter = !GAME_OPTIONS.rejectSameCharacter;
      saveGameOptions();
      SoundFx.play('ui_move');
      this._refresh();
    }
    if (kb.getKeyDown('escape') || GamepadHub.selectDown()) {
      SoundFx.play('ui_ok');
      this.mode = 'menu';
      this._refresh();
    }
  },

  _updateCpu: function (kb) {
    var up = kb.getKeyDown('up') || kb.getKeyDown('w') || GamepadHub.down(0, 'up');
    var down = kb.getKeyDown('down') || kb.getKeyDown('s') || GamepadHub.down(0, 'down');
    if (up || down) {
      this.cpuIndex = (this.cpuIndex + (down ? 1 : -1) + 3) % 3;
      SoundFx.play('ui_move');
      this._refresh();
    }
    var left = kb.getKeyDown('left') || kb.getKeyDown('a') || GamepadHub.down(0, 'left');
    var right = kb.getKeyDown('right') || kb.getKeyDown('d') || GamepadHub.down(0, 'right');
    if (left || right) {
      if (this.cpuIndex === 0) {
        var order = ['初級', '中級', '上級'];
        var i = order.indexOf(GAME_OPTIONS.cpuDifficulty);
        if (i < 0) i = 1;
        GAME_OPTIONS.cpuDifficulty = order[(i + (right ? 1 : -1) + 3) % 3];
      } else if (this.cpuIndex === 1) GAME_OPTIONS.cpuShuffle = !GAME_OPTIONS.cpuShuffle;
      else if (this.cpuIndex === 2) GAME_OPTIONS.survivalMode = !GAME_OPTIONS.survivalMode;
      saveGameOptions();
      SoundFx.play('ui_move');
      this._refresh();
    }
    if (kb.getKeyDown('escape') || GamepadHub.selectDown()) {
      SoundFx.play('ui_ok');
      this.mode = 'menu';
      this._refresh();
    }
  },

  _updateStage: function (kb) {
    var up = kb.getKeyDown('up') || kb.getKeyDown('w') || GamepadHub.down(0, 'up');
    var down = kb.getKeyDown('down') || kb.getKeyDown('s') || GamepadHub.down(0, 'down');
    if (up || down) {
      this.stageIndex = ((this.stageIndex || 0) + (down ? 1 : -1) + 2) % 2;
      SoundFx.play('ui_move');
      this._refresh();
    }
    var left = kb.getKeyDown('left') || kb.getKeyDown('a') || GamepadHub.down(0, 'left');
    var right = kb.getKeyDown('right') || kb.getKeyDown('d') || GamepadHub.down(0, 'right');
    if (left || right) {
      if ((this.stageIndex || 0) === 0) {
        var list = ['on', 'random'];
        for (var i = 0; i < STAGE_ROSTER.length; i++) list.push(STAGE_ROSTER[i].id);
        var cur = GAME_OPTIONS.stageSelect2p || 'random';
        var idx = list.indexOf(cur);
        if (idx < 0) idx = 1;
        idx = (idx + (right ? 1 : -1) + list.length) % list.length;
        GAME_OPTIONS.stageSelect2p = list[idx];
      } else {
        var list2 = ['perChar', 'random'];
        for (var j = 0; j < STAGE_ROSTER.length; j++) list2.push(STAGE_ROSTER[j].id);
        var cur2 = GAME_OPTIONS.stageSelectCpu || 'random';
        var idx2 = list2.indexOf(cur2);
        if (idx2 < 0) idx2 = 1;
        idx2 = (idx2 + (right ? 1 : -1) + list2.length) % list2.length;
        GAME_OPTIONS.stageSelectCpu = list2[idx2];
      }
      saveGameOptions();
      SoundFx.play('ui_move');
      this._refresh();
    }
    if (kb.getKeyDown('escape') || GamepadHub.selectDown()) {
      SoundFx.play('ui_ok');
      this.mode = 'menu';
      if (this.stageLabels) {
        for (var si = 0; si < this.stageLabels.length; si++) {
          this.stageLabels[si].hide();
          this.stageValues[si].hide();
        }
      }
      this._refresh();
    }
  },

  _updatePlayer: function (kb) {
    var left = kb.getKeyDown('left') || kb.getKeyDown('a') || GamepadHub.down(0, 'left');
    var right = kb.getKeyDown('right') || kb.getKeyDown('d') || GamepadHub.down(0, 'right');
    if (left || right) {
      this.playerIndex = this.playerIndex ? 0 : 1;
      SoundFx.play('ui_move');
      this._refresh();
    }
    if (kb.getKeyDown('space') || GamepadHub.startDown()) {
      SoundFx.play('ui_ok');
      this.mode = 'assign';
      this.step = 0;
      this.draft = Object.assign({}, PAD_BINDINGS[this.playerIndex]);
      this._refresh();
    }
    if (kb.getKeyDown('escape') || GamepadHub.selectDown()) {
      SoundFx.play('ui_ok');
      this.mode = 'menu';
      this._refresh();
    }
  },

  _forceReloadCache: function () {
    this.prompt.text = 'キャッシュ削除中...';
    var done = function () {
      location.reload(true);
    };
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      }).then(function () {
        return caches.keys();
      }).then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      }).then(done).catch(done);
    } else {
      done();
    }
  },

  _updateAssign: function (kb) {
    if (kb.getKeyDown('escape') || GamepadHub.selectDown()) {
      SoundFx.play('ui_ok');
      this.draft = null;
      this.mode = 'menu';
      this._refresh();
      return;
    }
    var btn = GamepadHub.bindButtonDown(this.playerIndex);
    if (!btn) return;
    var act = PAD_ACTIONS[this.step];
    var bind = this.draft;
    for (var i = 0; i < PAD_ACTIONS.length; i++) {
      if (bind[PAD_ACTIONS[i].key] === btn.id) bind[PAD_ACTIONS[i].key] = -1;
    }
    bind[act.key] = btn.id;
    SoundFx.play('ui_ok');
    this.step += 1;
    if (this.step >= PAD_ACTIONS.length) {
      PAD_BINDINGS[this.playerIndex] = this.draft;
      savePadBindings();
      this.draft = null;
      this.mode = 'menu';
      this.menuIndex = 1;
    }
    this._refresh();
  },
});

phina.define('SuperGauge', {
  superClass: 'DisplayElement',

  init: function (options) {
    this.superInit();
    options = options || {};
    this.side = options.side || 'left';
    this.max = options.max || 100;
    this.value = 0;
    this.levels = 3;
    this.segW = options.segW || 72;
    this.gap = 3;
    this.heights = [8, 14, 22];
    this.fillColor = options.fillColor || '#ffe08a';
    this.emptyColor = options.emptyColor || '#1a1a1a';
    this.blinkT = 0;

    var originX = this.side === 'left' ? 1 : 0;
    this.segments = [];
    for (var i = 0; i < this.levels; i++) {
      var h = this.heights[i];
      var wrap = DisplayElement().addChildTo(this);
      var ox = (this.side === 'left' ? -i : i) * (this.segW + this.gap);
      wrap.setPosition(ox, 0);

      var bg = RectangleShape({
        width: this.segW,
        height: h,
        fill: this.emptyColor,
        stroke: 'rgba(255,255,255,0.85)',
        strokeWidth: 1,
      }).addChildTo(wrap);
      bg.origin.set(originX, 1);
      bg.setPosition(0, 0);

      var fill = RectangleShape({
        width: 0.001,
        height: Math.max(2, h - 2),
        fill: this.fillColor,
        stroke: null,
      }).addChildTo(wrap);
      fill.origin.set(originX, 1);
      fill.setPosition(originX === 1 ? -1 : 1, -1);

      this.segments.push({ bg: bg, fill: fill });
    }
  },

  setValue: function (v) {
    this.value = Math.max(0, Math.min(this.max, v == null ? 0 : v));
  },

  flashDeny: function () {
    this.denyT = 10;
  },

  update: function () {
    this.blinkT += 0.14;
    var pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(this.blinkT));
    var deny = this.denyT > 0;
    if (deny) this.denyT -= 1;
    for (var i = 0; i < this.levels; i++) {
      var start = Math.round(i * this.max / this.levels);
      var end = Math.round((i + 1) * this.max / this.levels);
      var span = Math.max(1, end - start);
      var ratio = Math.max(0, Math.min(1, (this.value - start) / span));
      var full = this.value >= end;
      var seg = this.segments[i];
      seg.fill.width = Math.max(0.001, (this.segW - 2) * ratio);
      seg.fill.alpha = full ? pulse : 1;
      seg.bg.fill = (deny && (this.denyT % 4 < 2)) ? '#ff4040' : this.emptyColor;
    }
  },
});

phina.define('VersusScene', {
  superClass: 'DisplayScene',

  init: function (options) {
    this.superInit(options);
    this.backgroundColor = '#1b2230';
    this.ended = false;
    this.matchOver = false;
    this.finishWait = 0;
    this.timeLeft = (GAME_OPTIONS.roundTime === 'unlimited') ? Infinity : (GAME_OPTIONS.roundTime || 60);
    this.frame = 0;
    this.hitstop = 0;
    this.shots = [];
    this.winsNeeded = 2;
    this.p1Wins = (options && options.p1Wins) || 0;
    this.p2Wins = (options && options.p2Wins) || 0;
    this.round = (options && options.round) || 1;
    this.cpuMode = !!(options && options.cpu);
    this.demo = !!(options && options.demo);
    this.idleFrames = 0;
    this.p1Id = options && options.p1Id;
    this.cpuQueue = (options && options.cpuQueue) || null;
    this.cpuIndex = (options && options.cpuIndex) || 0;
    this.survival = !!(options && options.survival);
    this.carryHp = options && options.p1Hp;

    if (this.demo) {
      var ids = [];
      for (var ci = 0; ci < CHARACTER_ROSTER.length; ci++) ids.push(CHARACTER_ROSTER[ci].id);
      var i1 = Math.floor(Math.random() * ids.length);
      var i2 = Math.floor(Math.random() * ids.length);
      if (GAME_OPTIONS.rejectSameCharacter) {
        while (i2 === i1) i2 = Math.floor(Math.random() * ids.length);
      }
      options = options || {};
      options.p1Id = ids[i1];
      options.p2Id = ids[i2];
      options.stageId = pickRandomStage().id;
      this.cpuMode = true;
    }

    var p1Data = getCharacter(options && options.p1Id);
    var p2Data = getCharacter(options && options.p2Id);
    this.stageData = (options && options.stageId) ? getStage(options.stageId) : pickRandomStage();
    this.fixedStageId = options && options.stageId;
    this.stageMode = options && options.stageMode;
    if (this.demo) SoundFx.stopBgm();
    else SoundFx.playBgm(this.stageData.image);

    Sprite(this.stageData.image)
      .addChildTo(this)
      .setOrigin(0.5, 0.5)
      .setPosition(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

    this.rainDrops = [];
    if (this.stageData.rain) {
      this._createRain();
    }

    // 足元の丸い影
    this.p1Shadow = CircleShape({
      radius: 35,
      fill: 'rgba(0,0,0,1)',
    }).addChildTo(this).setPosition(260, GROUND_Y - 10);
    this.p1Shadow.scaleY = 0.26;
    this.p2Shadow = CircleShape({
      radius: 35,
      fill: 'rgba(0,0,0,1)',
    }).addChildTo(this).setPosition(700, GROUND_Y - 10);
    this.p2Shadow.scaleY = 0.26;

    this.p1 = Fighter({
      name: '1P',
      charaName: p1Data.name,
      keys: P1_KEYS,
      padIndex: 0,
      cpu: this.demo,
      cpuLevel: this.demo ? cpuLevelFor(2) : 0,
      facing: 1,
      image: p1Data.image,
      ss: p1Data.ss,
      color: p1Data.color,
      hadou: p1Data.hadou,
      speed: p1Data.stats.speed,
      jump: p1Data.stats.jump,
      hp: p1Data.stats.hp,
      moves: mergeMoves(p1Data.moves),
      debugHitboxes: SHOW_HITBOXES,
    }).addChildTo(this).setPosition(260, GROUND_Y);
    if (this.survival && this.carryHp != null) {
      this.p1.hp = Math.max(1, Math.min(this.p1.maxHp, this.carryHp));
    }

    this.p2 = Fighter({
      name: '2P',
      charaName: p2Data.name,
      keys: P2_KEYS,
      padIndex: 1,
      cpu: this.cpuMode || this.demo,
      cpuLevel: this.demo ? cpuLevelFor(2) : cpuLevelFor(this.cpuIndex),
      facing: -1,
      image: p2Data.image2p || p2Data.image,
      ss: p2Data.ss,
      color: p2Data.color,
      hadou: p2Data.hadou,
      speed: p2Data.stats.speed,
      jump: p2Data.stats.jump,
      hp: p2Data.stats.hp,
      moves: mergeMoves(p2Data.moves),
      debugHitboxes: SHOW_HITBOXES,
    }).addChildTo(this).setPosition(700, GROUND_Y);
    this.p1.opponent = this.p2;
    this.p2.opponent = this.p1;
    this.p1.shots = this.shots;
    this.p2.shots = this.shots;

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
      stroke: "black",
      strokeWidth: 4,
    }).addChildTo(this).setPosition(24, 18);
    Label({
      text: (this.cpuMode ? 'CPU ' : '2P ') + p2Data.name,
      fontSize: 14,
      fill: '#fff',
      align: 'right',
      stroke: "black",
      strokeWidth: 4,
    }).addChildTo(this).setPosition(SCREEN_WIDTH - 24, 18);

    this.timerLabel = Label({
      text: (GAME_OPTIONS.roundTime === 'unlimited') ? '∞' : String(GAME_OPTIONS.roundTime || 60),
      fontSize: 36,
      fill: '#fff',
      fontWeight: 'bold',
      stroke: "black",
      strokeWidth: 4,
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 36);

    Label({
      text: this.stageData.name,
      fontSize: 12,
      fill: '#ffe08a',
      stroke: "black",
      strokeWidth: 4,
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 62);

    if (this.demo) {
      this.demoPress = Label({
        text: 'SPACE / START を押す',
        fontSize: 24,
        fill: '#ffe08a',
        fontWeight: 'bold',
        stroke: '#000',
        strokeWidth: 5,
      }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 36);
    }

    this.roundLabel = Label({
      text: 'ROUND ' + this.round,
      fontSize: 12,
      fill: '#ddd',
      stroke: "black",
      strokeWidth: 4,
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 78);

    this.cpuProgress = Label({
      text: this.cpuQueue ? ((this.cpuIndex + 1) + ' / ' + this.cpuQueue.length) : '',
      fontSize: 12,
      fill: '#ffe08a',
      stroke: "black",
      strokeWidth: 4,
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 94);

    this.p1WinMarks = this._winMarks(24, 58, 0);
    this.p2WinMarks = this._winMarks(SCREEN_WIDTH - 24, 58, 1);

    this.p1Gauge = SuperGauge({
      side: 'left',
      fillColor: p1Data.color,
      emptyColor: '#141414',
    }).addChildTo(this).setPosition(24 + 72 * 3 + 3 * 2, SCREEN_HEIGHT - 10);
    this.p2Gauge = SuperGauge({
      side: 'right',
      fillColor: p2Data.color,
      emptyColor: '#141414',
    }).addChildTo(this).setPosition(SCREEN_WIDTH - (24 + 72 * 3 + 3 * 2), SCREEN_HEIGHT - 10);

    this.koLabel = Label({
      text: '',
      fontSize: 64,
      fill: '#fff',
      fontWeight: 'bold',
      stroke: "black",
      strokeWidth: 4,
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 200);

    this.introLabel = Label({
      text: '',
      fontSize: 64,
      fill: '#ffe08a',
      fontWeight: 'bold',
      stroke: "black",
      strokeWidth: 4,
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 210);

    this.fadeOverlay = RectangleShape({
      width: SCREEN_WIDTH + 4,
      height: SCREEN_HEIGHT + 4,
      fill: '#000',
      stroke: null,
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.hide();
    this.fadePhase = null;
    this.fadeAlpha = 0;
    this.FADE_SPEED = 0.04;
    this.cinematic = null;
    this.superSparks = [];
    this.superOverlay = RectangleShape({
      width: SCREEN_WIDTH + 4,
      height: SCREEN_HEIGHT + 4,
      fill: '#120008',
      stroke: null,
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    this.superOverlay.alpha = 0;
    this.superOverlay.hide();

    this.inputLabels = { p1: [], p2: [] };
    this.inputHeader = Label({
      text: 'INPUT F9',
      fontSize: 12,
      fill: '#888',
      stroke: '#000',
      strokeWidth: 3,
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 120);
    this.inputHeader.hide();
    for (var il = 0; il < 12; il++) {
      var lp1 = Label({
        text: '',
        fontSize: 13,
        fill: '#3aa0ff',
        align: 'left',
        stroke: '#000',
        strokeWidth: 3,
      }).addChildTo(this).setPosition(12, 140 + il * 16);
      lp1.origin.set(0, 0.5);
      lp1.hide();
      this.inputLabels.p1.push(lp1);
      var lp2 = Label({
        text: '',
        fontSize: 13,
        fill: '#ff8a3a',
        align: 'right',
        stroke: '#000',
        strokeWidth: 3,
      }).addChildTo(this).setPosition(SCREEN_WIDTH - 12, 140 + il * 16);
      lp2.origin.set(1, 0.5);
      lp2.hide();
      this.inputLabels.p2.push(lp2);
    }

    this._refreshWinMarks();
    this._startIntro();
  },

  _winMarks: function (x, y, originX) {
    var wrap = DisplayElement().addChildTo(this).setPosition(x, y);
    wrap.dots = [];
    for (var i = 0; i < this.winsNeeded; i++) {
      var dot = CircleShape({
        radius: 7,
        fill: '#222',
        stroke: '#fff',
        strokeWidth: 1,
      }).addChildTo(wrap);
      var ox = originX ? -i * 20 : i * 20;
      dot.setPosition(ox, 0);
      wrap.dots.push(dot);
    }
    return wrap;
  },

  _refreshWinMarks: function () {
    var i;
    for (i = 0; i < this.p1WinMarks.dots.length; i++) {
      this.p1WinMarks.dots[i].fill = i < this.p1Wins ? '#3aa0ff' : '#222';
    }
    for (i = 0; i < this.p2WinMarks.dots.length; i++) {
      this.p2WinMarks.dots[i].fill = i < this.p2Wins ? '#ff8a3a' : '#222';
    }
  },

  exit: function (params) {
    SoundFx.stopBgm();
    this.superMethod('exit', params);
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

  _createRain: function () {
    var count = 70;
    for (var i = 0; i < count; i++) {
      var drop = RectangleShape({
        width: 1 + Math.random() * 1.5,
        height: 8 + Math.random() * 10,
        fill: 'rgba(180, 210, 255, 0.55)',
        stroke: null,
      }).addChildTo(this);
      drop.x = Math.random() * (SCREEN_WIDTH + 40) - 20;
      drop.y = Math.random() * SCREEN_HEIGHT;
      drop.vy = 8 + Math.random() * 6;
      drop.vx = -1.5 - Math.random() * 1.5;
      drop.rotation = -12;
      this.rainDrops.push(drop);
    }
  },

  _updateInputHistory: function () {
    var on = typeof SHOW_INPUT_HISTORY !== 'undefined' && SHOW_INPUT_HISTORY;
    this.inputHeader.visible = on;
    var sides = [{ key: 'p1', f: this.p1 }, { key: 'p2', f: this.p2 }];
    for (var s = 0; s < sides.length; s++) {
      var labels = this.inputLabels[sides[s].key];
      var log = (sides[s].f && sides[s].f.inputLog) || [];
      for (var i = 0; i < labels.length; i++) {
        labels[i].visible = on;
        if (!on) continue;
        var idx = log.length - labels.length + i;
        labels[i].text = idx >= 0 ? (log[idx].text || log[idx]) : '';
      }
    }
  },

  _updateRain: function () {
    for (var i = 0; i < this.rainDrops.length; i++) {
      var d = this.rainDrops[i];
      d.x += d.vx;
      d.y += d.vy;
      if (d.y > SCREEN_HEIGHT + 20 || d.x < -40) {
        d.y = -20 - Math.random() * 40;
        d.x = Math.random() * (SCREEN_WIDTH + 60) - 20;
      }
    }
  },

  update: function (app) {
    GamepadHub.poll();
    this._updateInputHistory();
    if (this.demo) {
      var kb = app.keyboard;
      var any = kb.getKeyDown('space') || GamepadHub.startDown() ||
        kb.getKeyDown('up') || kb.getKeyDown('down') || kb.getKeyDown('w') || kb.getKeyDown('s') ||
        GamepadHub.down(0, 'up') || GamepadHub.down(0, 'down') || GamepadHub.down(0, 'light');
      if (any) {
        this.exit({ nextLabel: 'title' });
        return;
      }
      this.idleFrames += 1;
      if (this.idleFrames >= 30 * 60) {
        this.exit({ nextLabel: 'title' });
        return;
      }
      if (this.demoPress) this.demoPress.alpha = Math.sin(app.frame * 0.15) > 0 ? 1 : 0;
    }
    this._updateShadows();

    if (this.rainDrops.length) this._updateRain();

    if (this.fadePhase) {
      this.p1.sleep();
      this.p2.sleep();
      this._updateFade();
      return;
    }

    if (this.introPhase) {
      this.p1.sleep();
      this.p2.sleep();
      this._updateIntro();
      return;
    }

    if (this.ended) {
      this.p1.wakeUp();
      this.p2.wakeUp();
      if (this.finishWait > 0) this.finishWait -= 1;
      if (this.finishWait <= 0) {
        this._beginFadeOut();
      }
      return;
    }
    if (this.cinematic) {
      this.p1.sleep();
      this.p2.sleep();
      this._updateCinematic();
      this._updateHud();
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
      this.p2.state === 'throwing' || this.p2.state === 'thrown' ||
      this.p1.state === 'super_cinematic' || this.p1.state === 'super_victim' ||
      this.p2.state === 'super_cinematic' || this.p2.state === 'super_victim';
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
    if (GAME_OPTIONS.roundTime !== 'unlimited' && this.frame % 60 === 0) this.timeLeft -= 1;
    var ko = this.p1.hp <= 0 || this.p2.hp <= 0;
    if (ko) this._finish('ko');
    else if (GAME_OPTIONS.roundTime !== 'unlimited' && this.timeLeft <= 0) this._finish('time');
  },

  _updateShadows: function () {
    if (!this.p1Shadow || !this.p1) return;
    var maxH = 180;
    function place(shadow, fighter) {
      if (!shadow || !fighter) return;
      shadow.x = fighter.x;
      shadow.y = GROUND_Y - 10;
      var h = Math.max(0, GROUND_Y - fighter.y);
      var s = Math.max(0.35, 1 - h / maxH);
      shadow.scaleX = s;
      shadow.scaleY = 0.26 * s;
      shadow.alpha = Math.max(0.15, 0.35 * (1 - h / maxH * 0.5));
    }
    place(this.p1Shadow, this.p1);
    place(this.p2Shadow, this.p2);
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
    var list = this.shots;
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (!a.parent || a.hasHit) continue;
      for (var j = i + 1; j < list.length; j++) {
        var b = list[j];
        if (!b.parent || b.hasHit) continue;
        if (a.owner === b.owner) continue;
        if (aabbOverlap(a.getRect(), b.getRect())) {
          a.hasHit = true;
          b.hasHit = true;
          a.remove();
          b.remove();
          SoundFx.play('block');
          break;
        }
      }
    }
    this.shots = list.filter(function (shot) {
      if (!shot.parent || shot.hasHit) return false;
      var defender = shot.owner === self.p1 ? self.p2 : self.p1;
      if (defender.alive && aabbOverlap(shot.getRect(), defender.hurtbox.getRect())) {
        var result = defender.takeHit(shot.move, shot.facing);
        if (result) {
          shot.hasHit = true;
          shot.remove();
          SoundFx.impact(result, shot.move);
          self._applyGauge(shot.owner, defender, result);
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
        this._applyGauge(attacker, defender, hit);
        SoundFx.impact(hit, attacker.move);
        if (hit === 'block') this.hitstop = 2;
        else if (hit === 'tech') {
          defender.thrower = null;
          attacker._throwBreak(-attacker.facing);
          this.hitstop = 4;
        } else if (hit === 'super') {
          defender.thrower = null;
          this._startCinematic(attacker, defender);
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

  _startCinematic: function (attacker, defender) {
    attacker.state = 'super_cinematic';
    attacker.stateTime = 0;
    attacker.vx = 0;
    attacker.vy = 0;
    attacker.attackBox.active = false;
    attacker.playAnim('attack_throw');
    defender.state = 'super_victim';
    defender.vx = 0;
    defender.vy = 0;
    defender.y = GROUND_Y;
    defender.onGround = true;
    defender.playAnim('hit');
    var mid = (attacker.x + defender.x) / 2;
    attacker.x = mid - attacker.facing * 24;
    defender.x = mid + attacker.facing * 28;
    attacker.y = GROUND_Y;
    attacker.onGround = true;
    this.cinematic = {
      attacker: attacker,
      defender: defender,
      move: attacker.move,
      t: 0,
      hits: 0,
      maxHits: 10,
      hitGap: 6,
    };
    this.superSparks = [];
    this.superOverlay.show();
    this.superOverlay.alpha = 0.82;
  },

  _spawnSuperSpark: function () {
    var cin = this.cinematic;
    var ax = cin && cin.attacker ? cin.attacker.x : SCREEN_WIDTH / 2;
    var ay = cin && cin.attacker ? (cin.attacker.y - 80) : 250;
    var dx = cin && cin.defender ? cin.defender.x : ax;
    var dy = cin && cin.defender ? (cin.defender.y - 80) : ay;
    var cx = (ax + dx) / 2;
    var cy = (ay + dy) / 2;
    var spark = RectangleShape({
      width: 16 + Math.random() * 28,
      height: 5 + Math.random() * 10,
      fill: Math.random() > 0.5 ? '#fff' : '#ff4a4a',
      stroke: null,
    }).addChildTo(this);
    spark.setPosition(
      cx + (Math.random() - 0.5) * 120,
      cy + (Math.random() - 0.5) * 100
    );
    spark.rotation = Math.random() * 180;
    spark.life = 7;
    this.superSparks.push(spark);
  },

  _clearSuperSparks: function () {
    this.superSparks.forEach(function (s) {
      if (s.parent) s.remove();
    });
    this.superSparks = [];
  },

  _updateCinematic: function () {
    var cin = this.cinematic;
    cin.t += 1;
    var attacker = cin.attacker;
    var defender = cin.defender;
    attacker.vx = 0;
    attacker.vy = 0;
    defender.vx = 0;
    defender.vy = 0;
    attacker.y = GROUND_Y;
    defender.y = GROUND_Y;

    if (cin.t >= 8 && cin.hits < cin.maxHits && (cin.t - 8) % cin.hitGap === 0) {
      cin.hits += 1;
      this._spawnSuperSpark();
      SoundFx.play('hit_heavy');
      defender.playAnim('hit');
      attacker.playAnim('attack_throw');
    }

    var remain = [];
    for (var i = 0; i < this.superSparks.length; i++) {
      var s = this.superSparks[i];
      s.life -= 1;
      s.alpha = Math.max(0, s.life / 7);
      if (s.life <= 0) s.remove();
      else remain.push(s);
    }
    this.superSparks = remain;

    var fadeStart = 8 + cin.maxHits * cin.hitGap + 10;
    if (cin.t > fadeStart) {
      this.superOverlay.alpha = Math.max(0, this.superOverlay.alpha - 0.08);
    }

    if (cin.t < fadeStart + 16) return;

    this._clearSuperSparks();
    this.superOverlay.hide();
    this.superOverlay.alpha = 0;
    var move = cin.move || MOVES.shungoku;
    var dmg = move.damage || 48;
    defender.hp = Math.max(0, defender.hp - dmg);
    attacker.move = null;
    attacker.hasHit = false;
    attacker.state = 'idle';
    attacker.playAnim('idle');
    if (defender.hp <= 0) {
      defender.alive = false;
      defender.state = 'dead';
      defender.vx = attacker.facing * (move.knockback || 10);
      defender.vy = -9;
      defender.onGround = false;
      defender.playAnim('dead');
    } else {
      defender.state = 'hit';
      defender.stateTime = 0;
      defender.hitstun = move.hitstun || 36;
      defender.invuln = 10;
      defender.vx = attacker.facing * (move.knockback || 10);
      defender.vy = -7;
      defender.onGround = false;
      defender.playAnim('hit');
    }
    this.cinematic = null;
    this.p1.wakeUp();
    this.p2.wakeUp();
    this._updateHud();
    if (defender.hp <= 0) this._finish('ko');
  },

  _applyGauge: function (attacker, defender, result) {
    if (!result || result === 'tech' || result === 'super') return;
    if (result === 'block') {
      attacker.addGauge(3);
      defender.addGauge(2);
    } else {
      attacker.addGauge(8);
      defender.addGauge(5);
    }
  },

  _updateHud: function () {
    this.p1Bar.width = Math.max(0.001, this.hpBarWidth * (this.p1.hp / this.p1.maxHp));
    this.p2Bar.width = Math.max(0.001, this.hpBarWidth * (this.p2.hp / this.p2.maxHp));
    this.p1Gauge.setValue(this.p1.gauge);
    this.p2Gauge.setValue(this.p2.gauge);
    if (this.p1.gaugeDeny > 0) { this.p1Gauge.flashDeny(); this.p1.gaugeDeny = 0; }
    if (this.p2.gaugeDeny > 0) { this.p2Gauge.flashDeny(); this.p2.gaugeDeny = 0; }
    this.timerLabel.text = (GAME_OPTIONS.roundTime === 'unlimited') ? '∞' : String(Math.max(0, this.timeLeft));
  },

  _finish: function (reason) {
    if (this.ended) return;
    this.ended = true;
    var timedOut = reason === 'time' || (this.timeLeft <= 0 && this.p1.hp > 0 && this.p2.hp > 0);
    var p1Ratio = this.p1.maxHp > 0 ? this.p1.hp / this.p1.maxHp : 0;
    var p2Ratio = this.p2.maxHp > 0 ? this.p2.hp / this.p2.maxHp : 0;
    var barEps = 1 / this.hpBarWidth;
    var roundWinner = 'DRAW';
    if (p1Ratio > p2Ratio + barEps) roundWinner = '1P';
    else if (p2Ratio > p1Ratio + barEps) roundWinner = '2P';

    if (roundWinner === '1P') this.p1Wins += 1;
    else if (roundWinner === '2P') this.p2Wins += 1;
    else {
      this.p1Wins += 1;
      this.p2Wins += 1;
    }
    this._refreshWinMarks();

    this.matchOver = this.p1Wins >= this.winsNeeded || this.p2Wins >= this.winsNeeded;
    if (this.p1Wins > this.p2Wins) this.winner = '1P';
    else if (this.p2Wins > this.p1Wins) this.winner = '2P';
    else this.winner = 'DRAW';

    this.koLabel.fontSize = timedOut ? 52 : 64;
    if (timedOut) this.koLabel.text = 'TIME OVER';
    else if (roundWinner === 'DRAW') this.koLabel.text = 'DRAW';
    else this.koLabel.text = 'K.O.';
    this.finishWait = 90;
    if (roundWinner === '1P') this.p1.startWin();
    else if (roundWinner === '2P') this.p2.startWin();
    if (timedOut) SoundFx.play('timeover');
    else if (roundWinner === 'DRAW') SoundFx.play('draw');
    else SoundFx.play('ko');
  },

  _clearShots: function () {
    this.shots.forEach(function (shot) {
      if (shot.parent) shot.remove();
    });
    this.shots = [];
  },

  _nextRound: function () {
    this._clearShots();
    this.ended = false;
    this.hitstop = 0;
    this.timeLeft = (GAME_OPTIONS.roundTime === 'unlimited') ? Infinity : (GAME_OPTIONS.roundTime || 60);
    this.frame = 0;
    this.round += 1;
    this.roundLabel.text = 'ROUND ' + this.round;
    this.koLabel.text = '';
    this.p1.resetRound(260, 1);
    this.p2.resetRound(700, -1);
    this._updateHud();
  },

  _beginFadeOut: function () {
    this.fadePhase = 'out';
    this.fadeAlpha = 0;
    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.show();
  },

  _updateFade: function () {
    if (this.fadePhase === 'out') {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + this.FADE_SPEED);
      this.fadeOverlay.alpha = this.fadeAlpha;
      if (this.fadeAlpha >= 1) {
        if (this.matchOver) {
          if (this.demo) {
            this.exit({ nextLabel: 'title' });
            return;
          }
          if (this.cpuMode && this.cpuQueue) {
            this._exitCpu();
            return;
          }
          this.exit({
            winner: this.winner,
            p1Wins: this.p1Wins,
            p2Wins: this.p2Wins,
            cpu: this.cpuMode,
          });
          return;
        }
        this._nextRound();
        this.p1.sleep();
        this.p2.sleep();
        this.fadePhase = 'in';
        this.fadeAlpha = 1;
        this.fadeOverlay.alpha = 1;
      }
      return;
    }

    if (this.fadePhase === 'in') {
      this.fadeAlpha = Math.max(0, this.fadeAlpha - this.FADE_SPEED);
      this.fadeOverlay.alpha = this.fadeAlpha;
      if (this.fadeAlpha <= 0) {
        this.fadePhase = null;
        this.fadeOverlay.hide();
        this._startIntro();
      }
    }
  },

  _exitCpu: function () {
    var won = this.winner === '1P';
    if (won) {
      var next = this.cpuIndex + 1;
      if (next < this.cpuQueue.length) {
        this.exit({
          nextLabel: 'versus',
          p1Id: this.p1Id,
          p2Id: this.cpuQueue[next],
          cpu: true,
          cpuQueue: this.cpuQueue,
          cpuIndex: next,
          survival: this.survival,
          stageId: this.stageMode === 'perChar' ? ((getCharacter(this.cpuQueue[next]) || {}).stage || null) : (this.fixedStageId || null),
          stageMode: this.stageMode,
          p1Hp: this.survival ? this.p1.hp : null,
        });
        return;
      }
      this.exit({ nextLabel: 'result', ending: 'good', cpu: true, winner: '1P' });
      return;
    }
    this.exit({ nextLabel: 'result', ending: 'bad', cpu: true, winner: this.winner });
  },

  _startIntro: function () {
    this.introPhase = 'round';
    this.introWait = 75;
    this.introLabel.text = 'ROUND ' + this.round;
    this.introLabel.fill = '#ffe08a';
    this.introLabel.fontSize = 56;
    this.p1.sleep();
    this.p2.sleep();
    if (this.round === 1) SoundFx.play('round1');
    else if (this.round === 2) SoundFx.play('round2');
    else if (this.round === 3) SoundFx.play('round3');
    else SoundFx.play('round1');
  },

  _updateIntro: function () {
    this.introWait -= 1;
    if (this.introWait > 0) return;
    if (this.introPhase === 'round') {
      this.introPhase = 'fight';
      this.introWait = 50;
      this.introLabel.text = 'FIGHT';
      this.introLabel.fill = '#fff';
      this.introLabel.fontSize = 72;
      SoundFx.play('fight');
      return;
    }
    this.introPhase = null;
    this.introLabel.text = '';
    this.p1.wakeUp();
    this.p2.wakeUp();
  },
});

phina.define('StageSelectScene', {
  superClass: 'DisplayScene',

  init: function (options) {
    this.superInit(options);
    this.backgroundColor = '#12151c';
    this.options = options || {};
    this.index = 0;
    this.roster = STAGE_ROSTER;

    Label({
      text: 'STAGE SELECT',
      fontSize: 32,
      fill: '#fff',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 40);

    this.nameLabel = Label({
      text: '',
      fontSize: 28,
      fill: '#ffe08a',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 100);

    this.preview = Sprite(this.roster[0].image)
      .addChildTo(this)
      .setPosition(SCREEN_WIDTH / 2, 280);
    this.preview.width = 480;
    this.preview.height = 270;

    Label({
      text: '←→ で選択    SPACE / START で決定',
      fontSize: 16,
      fill: '#aaa',
    }).addChildTo(this).setPosition(SCREEN_WIDTH / 2, 500);

    this._refresh();
  },

  _refresh: function () {
    var s = this.roster[this.index];
    this.nameLabel.text = s.name;
    if (this.preview) this.preview.remove();
    this.preview = Sprite(s.image)
      .addChildTo(this)
      .setPosition(SCREEN_WIDTH / 2, 280);
    this.preview.width = 480;
    this.preview.height = 270;
  },

  update: function (app) {
    GamepadHub.poll();
    var kb = app.keyboard;
    var left = kb.getKeyDown('left') || kb.getKeyDown('a') || GamepadHub.down(0, 'left');
    var right = kb.getKeyDown('right') || kb.getKeyDown('d') || GamepadHub.down(0, 'right');
    if (left || right) {
      var n = this.roster.length;
      this.index = (this.index + (right ? 1 : -1) + n) % n;
      SoundFx.play('ui_move');
      this._refresh();
    }
    if (kb.getKeyDown('space') || kb.getKeyDown('g') || GamepadHub.startDown() || GamepadHub.down(0, 'light')) {
      SoundFx.play('ui_ok');
      var opts = Object.assign({}, this.options);
      opts.stageId = this.roster[this.index].id;
      opts.nextLabel = 'versus';
      this.exit(opts);
    }
  },
});

phina.define('GameResultScene', {
  superClass: 'DisplayScene',

  init: function (options) {
    this.superInit(options);
    this.backgroundColor = '#101010';
    var winner = (options && options.winner) || 'DRAW';
    var ending = options && options.ending;
    var p1Wins = (options && options.p1Wins) || 0;
    var p2Wins = (options && options.p2Wins) || 0;
    this.cpuMode = !!(options && options.cpu);

    Label({
      text: ending === 'good' ? 'YOU WIN!' : (ending === 'bad' ? 'YOU LOSE' : (winner === 'DRAW' ? 'DRAW' : winner + ' WIN')),
      fontSize: 72,
      fill: '#ffe08a',
      fontWeight: 'bold',
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-1));

    Label({
      text: ending ? '' : (p1Wins + '  -  ' + p2Wins),
      fontSize: 28,
      fill: '#ddd',
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(0.4));

    Label({
      text: 'SPACE / START でキャラ選択へ\nESC / SELECT でタイトルへ',
      fontSize: 22,
      fill: '#ddd',
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(2));

    if (winner === '1P') SoundFx.play('p1_win');
    else if (winner === '2P') SoundFx.play('p2_win');
    else SoundFx.play('draw');
  },

  update: function (app) {
    GamepadHub.poll();
    if (app.keyboard.getKeyDown('space') || GamepadHub.startDown()) {
      SoundFx.play('ui_ok');
      this.exit({ cpu: this.cpuMode, nextLabel: 'select' });
    }
    if (app.keyboard.getKeyDown('escape') || GamepadHub.selectDown()) {
      SoundFx.play('ui_ok');
      this.exit({ nextLabel: 'title' });
    }
  },
});
