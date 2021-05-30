# spaceship

Elite: Dangerousクローン的なやつを作りたかった　操作システムだけ実装

# lib
- [webpack](https://webpack.js.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Three.js](https://threejs.org/)
- [enable3d](https://enable3d.io/)
- [ammo.js](https://github.com/kripken/ammo.js)

# 見てほしいところ/苦労した点
- 速度や位置を直接入力せず、力とトルクだけで姿勢制御を行うためにちゃんと論文を読んだ（c.f. Park, Y. (2015). Robust and optimal attitude control of spacecraft with disturbances. International Journal of Systems Science, 46(7), 1222-1233.）
- glTFで読み込んだモデルをプレイヤーとして動かすために割と面倒なことをしなければならなかった
- ライブラリが中途半端に型定義されてて「こう書くとVSCodeから叱られるんだよなあ……@ts-ignore！」みたいなことを度々しなければならなかった

# 操作方法
- W: ピッチアップ
- A: 左ロール
- S: ピッチダウン
- D: 右ロール
- Q: 左ヨー
- R: 右ヨー
- R: 加速
- F: 減速
- Z: 姿勢安定化切り替え
- X: 姿勢制御切り替え (デフォルトではプレイヤーのrotationがすべて0になるように補正します)
- C: 運動量安定化切り替え
- T: スロットル0

```
# ビルド
npm run build
```

# 2021/05/30 last update
- レーザーを追加 (/src/modules/laser.ts)
- エンジンエフェクトを追加 (/src/modules/fire.tx)
- 加減速をスロットル方式に変更
- コードの著しいスパゲッティ化
- たぶんバグあります

# powered by SUPER unchi coding
