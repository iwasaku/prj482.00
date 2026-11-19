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
    name: '西永福',
    image: 'stage_nishieifuku',
    imagePath: 'assets/image/stage_nishieifuku.png',
  },
  {
    id: 'noon',
    name: '大塚',
    image: 'stage_ootsuka',
    imagePath: 'assets/image/stage_ootsuka.png',
  },
  {
    id: 'sunset',
    name: '下北沢',
    image: 'stage_shimokitazawa',
    imagePath: 'assets/image/stage_shimokitazawa.png',
  },
  {
    id: 'rain',
    name: '新宿',
    image: 'stage_shinjuku',
    imagePath: 'assets/image/stage_shinjuku.png',
    rain: true,
  },
  {
    id: 'dojo',
    name: '渋谷',
    image: 'stage_shibuya',
    imagePath: 'assets/image/stage_shibuya.png',
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
  assets = assets || { image: {}, spritesheet: {}, sound: {} };
  assets.image = assets.image || {};
  assets.sound = assets.sound || {};
  STAGE_ROSTER.forEach(function (stage) {
    assets.image[stage.image] = stage.imagePath || ('assets/image/' + stage.image + '.png');
  });
  return assets;
}
