phina.globalize();

var SCREEN_WIDTH = 960;
var SCREEN_HEIGHT = 540;
var GROUND_Y = 460;
var MATCH_TIME = 60;

var ASSETS = collectStageAssets(collectCharacterAssets({
  image: {
  },
  spritesheet: {
    fighter_ss: 'assets/spritesheet/fighter.json',
  },
}));

var P1_KEYS = {
  left: 'a',
  right: 'd',
  up: 'w',
  down: 's',
  light: 'b',
  heavy: 'n',
  kick: 'm',
};

var P2_KEYS = {
  left: 'left',
  right: 'right',
  up: 'up',
  down: 'down',
  light: ['i', '1', 'num_1'],
  heavy: ['o', '2', 'num_2'],
  kick: ['p', '3', 'num_3'],
};

phina.main(function () {
  var app = GameApp({
    startLabel: 'title',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    fps: 60,
    assets: ASSETS,
    scenes: [
      { className: 'GameTitleScene', label: 'title', nextLabel: 'select' },
      { className: 'SelectScene', label: 'select', nextLabel: 'versus' },
      { className: 'VersusScene', label: 'versus', nextLabel: 'result' },
      { className: 'GameResultScene', label: 'result', nextLabel: 'title' },
    ],
  });
  app.run();
});
