# spaceship

nice boat. demo: [https://factal.github.io/spaceship/](https://factal.github.io/spaceship/) (GitHub Pages の仕様上ディレクトリを読むことができないっぽいのでテクスチャ関係が欠落しています。誰か助けて)

# lib
- [webpack](https://webpack.js.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Three.js](https://threejs.org/)
- [enable3d](https://enable3d.io/)
- [ammo.js](https://github.com/kripken/ammo.js)

# 操作方法
- W: ピッチアップ
- A: 左ロール
- S: ピッチダウン
- D: 右ロール
- Q: 左ヨー
- R: 右ヨー
- R: 加速
- F: 減速
- T: スロットル0
- Z: 姿勢安定化切り替え
- X: 姿勢制御切り替え (デフォルトではプレイヤーのrotationがすべて0になるように補正します)
- C: 運動量安定化切り替え
- B: レーザー
- N: ミサイル (ランダムな場所から出現し、プレイヤーを追尾します)

```sh
# ビルド
npm run build
```

# powered by SUPER unchi coding
