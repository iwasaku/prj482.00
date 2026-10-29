phina.globalize();

var SCREEN_WIDTH = 960;
var SCREEN_HEIGHT = 540;
var GROUND_Y = 460;
var MATCH_TIME = 60;

var ASSETS = SoundFx.collect(collectStageAssets(collectCharacterAssets({
  image: {
    hadou: 'assets/image/hadou.png',
  },
  spritesheet: {
    fighter_ss: 'assets/spritesheet/fighter.json',
    hadou_ss: 'assets/spritesheet/hadou.json',
  },
})));

var P1_KEYS = {
  left: 'a',
  right: 'd',
  up: 'w',
  down: 's',
  light: 'g',
  heavy: 'h',
  kick: 'b',
  kickHeavy: 'n',
  special: 'm',
};

var P2_KEYS = {
  left: 'left',
  right: 'right',
  up: 'up',
  down: 'down',
  light: ['8', 'num_8'],
  heavy: ['9', 'num_9'],
  kick: 'i',
  kickHeavy: 'o',
  special: 'p',
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
  app.on('enterframe', function () {
    if (app.keyboard.getKeyDown('f8')) SoundFx.toggleMute();
  });
  app.run();
});
