phina.globalize();

var PAD_DEADZONE = 0.42;

var PAD_BIND_BUTTONS = [
  { id: 0, name: 'A' },
  { id: 1, name: 'B' },
  { id: 2, name: 'X' },
  { id: 3, name: 'Y' },
  { id: 4, name: 'L' },
  { id: 5, name: 'R' },
];

var PAD_ACTIONS = [
  { key: 'light', label: '弱パンチ' },
  { key: 'heavy', label: '強パンチ' },
  { key: 'kick', label: '弱キック' },
  { key: 'kickHeavy', label: '強キック' },
  { key: 'special', label: '必殺技' },
];

var PAD_BINDINGS = [
  { light: 3, heavy: 2, kick: 0, kickHeavy: 1, special: 4 },
  { light: 3, heavy: 2, kick: 0, kickHeavy: 1, special: 4 },
];

function loadPadBindings() {
  try {
    var raw = localStorage.getItem('fg_pad_bindings');
    if (!raw) return;
    var saved = JSON.parse(raw);
    for (var p = 0; p < 2; p++) {
      if (!saved[p]) continue;
      for (var a = 0; a < PAD_ACTIONS.length; a++) {
        var key = PAD_ACTIONS[a].key;
        var id = saved[p][key];
        if (typeof id === 'number') PAD_BINDINGS[p][key] = id;
      }
    }
  } catch (e) {}
}

function savePadBindings() {
  try {
    localStorage.setItem('fg_pad_bindings', JSON.stringify(PAD_BINDINGS));
  } catch (e) {}
}

loadPadBindings();

function padButtonName(id) {
  for (var i = 0; i < PAD_BIND_BUTTONS.length; i++) {
    if (PAD_BIND_BUTTONS[i].id === id) return PAD_BIND_BUTTONS[i].name;
  }
  return '-';
}

var PAD_MAP = {
  left: { buttons: [14], axis: 0, dir: -1 },
  right: { buttons: [15], axis: 0, dir: 1 },
  up: { buttons: [12], axis: 1, dir: -1 },
  down: { buttons: [13], axis: 1, dir: 1 },
  start: { buttons: [9] },
  select: { buttons: [8] },
};

var GamepadHub = {
  _prev: [{}, {}],
  _now: [{}, {}],

  poll: function () {
    // 参照の代入ではなく、前フレームの状態を浅いコピーで保持する
    this._prev = [
      Object.assign({}, this._now[0]),
      Object.assign({}, this._now[1])
    ];
    this._now = [{}, {}];

    var list = [];
    if (navigator.getGamepads) {
      var raw = navigator.getGamepads();
      for (var i = 0; i < raw.length; i++) {
        if (raw[i]) list.push(raw[i]);
      }
    }
    for (var p = 0; p < 2; p++) {
      this._now[p] = this._read(list[p], p);
    }
    this.count = list.length;
  },

  _btn: function (pad, index) {
    if (!pad || !pad.buttons || !pad.buttons[index]) return false;
    var b = pad.buttons[index];
    return !!(b.pressed || b.value > 0.5);
  },

  _axis: function (pad, index, dir) {
    if (!pad || !pad.axes || pad.axes[index] == null) return false;
    return pad.axes[index] * dir >= PAD_DEADZONE;
  },

  _read: function (pad, playerIndex) {
    var state = { _raw: [] };
    if (!pad) return state;
    var names = Object.keys(PAD_MAP);
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var spec = PAD_MAP[name];
      var on = false;
      if (spec.buttons) {
        for (var b = 0; b < spec.buttons.length; b++) {
          if (this._btn(pad, spec.buttons[b])) on = true;
        }
      }
      if (spec.axis != null && this._axis(pad, spec.axis, spec.dir)) on = true;
      state[name] = on;
    }
    var bind = PAD_BINDINGS[playerIndex] || PAD_BINDINGS[0];
    for (var a = 0; a < PAD_ACTIONS.length; a++) {
      var key = PAD_ACTIONS[a].key;
      var id = bind[key];
      state[key] = id != null && id >= 0 && this._btn(pad, id);
    }
    for (var r = 0; r < 16; r++) state._raw[r] = this._btn(pad, r);
    return state;
  },

  held: function (index, action) {
    var s = this._now[index];
    return !!(s && s[action]);
  },

  down: function (index, action) {
    var now = this._now[index];
    var prev = this._prev[index];
    return !!(now && now[action] && !(prev && prev[action]));
  },

  startDown: function () {
    return this.down(0, 'start') || this.down(1, 'start');
  },

  selectDown: function () {
    return this.down(0, 'select') || this.down(1, 'select');
  },

  rawDown: function (index, buttonId) {
    var now = this._now[index];
    var prev = this._prev[index];
    if (!now || !now._raw) return false;
    return !!(now._raw[buttonId] && !(prev && prev._raw && prev._raw[buttonId]));
  },

  bindButtonDown: function (index) {
    for (var i = 0; i < PAD_BIND_BUTTONS.length; i++) {
      var btn = PAD_BIND_BUTTONS[i];
      if (this.rawDown(index, btn.id)) return btn;
    }
    return null;
  },
};