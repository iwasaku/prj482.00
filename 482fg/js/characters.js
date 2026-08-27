phina.globalize();

/*
 * キャラ追加手順
 * 1. assets/image/ にスプライトシートを置く（今は 128x128 / 8列 x 6行）
 * 2. 下の CHARACTER_ROSTER に1件追加する
 * 3. シートの切り方が違う場合だけ spritesheet JSON を増やし、ss / ssPath を指定
 */
var CHARACTER_ROSTER = [
  {
    id: 'murata',
    name: 'MURATA',
    title: '標準',
    image: 'char_goro',
    imagePath: 'assets/image/char_goro.png',
    ss: 'fighter_ss',
    color: '#3dcc66',
    stats: { speed: 4.2, jump: -14.5, hp: 100 },
  },
  {
    id: 'asumi',
    name: 'ASUMI',
    title: 'リーチ',
    image: 'char_rei',
    imagePath: 'assets/image/char_rei.png',
    ss: 'fighter_ss',
    color: '#c8d0dc',
    stats: { speed: 4.0, jump: -14.2, hp: 96 },
    moves: {
      kick: { boxW: 84, boxX: 72, damage: 13 },
      low_kick: { boxW: 90, boxX: 74, damage: 14 },
    },
  },
  {
    id: 'bunbun',
    name: 'BUNBUN',
    title: 'ジャンパー',
    image: 'char_kenji',
    imagePath: 'assets/image/char_kenji.png',
    ss: 'fighter_ss',
    color: '#ff8a3a',
    stats: { speed: 4.4, jump: -17.0, hp: 92 },
  },
  {
    id: 'midare',
    name: 'MIDARE',
    title: 'スピード',
    image: 'char_mika',
    imagePath: 'assets/image/char_mika.png',
    ss: 'fighter_ss',
    color: '#e45ab8',
    stats: { speed: 5.2, jump: -15.2, hp: 88 },
    moves: {
      light: { damage: 7, startup: 4, recovery: 8 },
      kick: { damage: 11, startup: 7 },
    },
  },
  //{
  //  id: 'kenji',
  //  name: 'KENJI',
  //  title: 'パワー',
  //  image: 'char_nao',
  //  imagePath: 'assets/image/char_nao.png',
  //  ss: 'fighter_ss',
  //  color: '#e6c02a',
  //  stats: { speed: 3.6, jump: -13.6, hp: 110 },
  //  moves: {
  //    heavy: { damage: 19, knockback: 7.4, hitstun: 24 },
  //  },
  //},
  {
    id: 'yasui',
    name: 'YASUI',
    title: 'タンク',
    image: 'char_ryo',
    imagePath: 'assets/image/char_ryo.png',
    ss: 'fighter_ss',
    color: '#3aa0ff',
    stats: { speed: 3.2, jump: -13.0, hp: 125 },
    moves: {
      heavy: { damage: 18, startup: 12, knockback: 8.0 },
      low_kick: { damage: 15, knockback: 6.4 },
    },
  },

];

function getCharacter(id) {
  for (var i = 0; i < CHARACTER_ROSTER.length; i++) {
    if (CHARACTER_ROSTER[i].id === id) return CHARACTER_ROSTER[i];
  }
  return CHARACTER_ROSTER[0];
}

function mergeMoves(override) {
  var out = {};
  var keys = Object.keys(MOVES);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    out[k] = Object.assign({}, MOVES[k], (override && override[k]) || {});
  }
  return out;
}

function collectCharacterAssets(base) {
  var assets = base || { image: {}, spritesheet: {}, sound: {} };
  assets.image = assets.image || {};
  assets.spritesheet = assets.spritesheet || {};
  CHARACTER_ROSTER.forEach(function (chara) {
    assets.image[chara.image] = chara.imagePath || ('assets/image/' + chara.image + '.png');
    if (chara.ssPath) assets.spritesheet[chara.ss] = chara.ssPath;
  });
  return assets;
}
