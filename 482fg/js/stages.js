phina.globalize();

/*
 * ステージ追加手順
 * 1. assets/image/ に 960x540 の背景を置く
 * 2. 下の STAGE_ROSTER に1件追加する
 * groundY を省略すると GROUND_Y を使う
 */
var STAGE_ROSTER = [
  {
    id: 'night',
    name: 'NIGHT PARK',
    image: 'stage_night',
    imagePath: 'assets/image/stage_night.png',
  },
  {
    id: 'noon',
    name: 'NOON STREET',
    image: 'stage_noon',
    imagePath: 'assets/image/stage_noon.png',
  },
  {
    id: 'sunset',
    name: 'SUNSET PIER',
    image: 'stage_sunset',
    imagePath: 'assets/image/stage_sunset.png',
  },
  {
    id: 'rain',
    name: 'RAIN ALLEY',
    image: 'stage_rain',
    imagePath: 'assets/image/stage_rain.png',
  },
  {
    id: 'dojo',
    name: 'OLD DOJO',
    image: 'stage_dojo',
    imagePath: 'assets/image/stage_dojo.png',
  },
];

function getStage(id) {
  for (var i = 0; i < STAGE_ROSTER.length; i++) {
    if (STAGE_ROSTER[i].id === id) return STAGE_ROSTER[i];
  }
  return STAGE_ROSTER[0];
}

function pickRandomStage() {
  var i = Math.floor(Math.random() * STAGE_ROSTER.length);
  return STAGE_ROSTER[i];
}

function collectStageAssets(assets) {
  assets = assets || { image: {}, spritesheet: {} };
  assets.image = assets.image || {};
  STAGE_ROSTER.forEach(function(stage) {
    assets.image[stage.image] = stage.imagePath || ('assets/image/' + stage.image + '.png');
  });
  return assets;
}
