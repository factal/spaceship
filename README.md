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


```
# ビルド
npm run build
```

# powered by SUPER unchi coding
