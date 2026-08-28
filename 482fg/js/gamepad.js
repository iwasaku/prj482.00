phina.globalize();

var PAD_DEADZONE = 0.42;

var PAD_MAP = {
  left: { buttons: [14], axis: 0, dir: -1 },
  right: { buttons: [15], axis: 0, dir: 1 },
  up: { buttons: [12], axis: 1, dir: -1 },
  down: { buttons: [13], axis: 1, dir: 1 },
  light: { buttons: [0, 2] },
  heavy: { buttons: [3] },
  kick: { buttons: [1, 5] },
  start: { buttons: [9, 8] },
};

var GamepadHub = {
  _prev: [{}, {}],
  _now: [{}, {}],

  poll: function() {
    this._prev = this._now;
    this._now = [{}, {}];
    var list = [];
    if (navigator.getGamepads) {
      var raw = navigator.getGamepads();
      for (var i = 0; i < raw.length; i++) {
        if (raw[i]) list.push(raw[i]);
      }
    }
    for (var p = 0; p < 2; p++) {
      this._now[p] = this._read(list[p]);
    }
    this.count = list.length;
  },

  _btn: function(pad, index) {
    if (!pad || !pad.buttons || !pad.buttons[index]) return false;
    var b = pad.buttons[index];
    return !!(b.pressed || b.value > 0.5);
  },

  _axis: function(pad, index, dir) {
    if (!pad || !pad.axes || pad.axes[index] == null) return false;
    return pad.axes[index] * dir >= PAD_DEADZONE;
  },

  _read: function(pad) {
    var state = {};
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
    return state;
  },

  held: function(index, action) {
    var s = this._now[index];
    return !!(s && s[action]);
  },

  down: function(index, action) {
    var now = this._now[index];
    var prev = this._prev[index];
    return !!(now && now[action] && !(prev && prev[action]));
  },

  startDown: function() {
    return this.down(0, 'start') || this.down(1, 'start');
  },
};
