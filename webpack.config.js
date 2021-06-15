module.exports = {
    mode: "development",
    entry: "./src/main.ts",
    output: {
      path: `${__dirname}/dist`,
      filename: "main.js"
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader"
        },
        {
          test:/\.(png|jpg|gltf|glb|wav|ogg)$/,
          type: 'asset/resource',
        }
      ]
    },
    resolve: {
      extensions: [".ts", ".js", ".json"]
    },
  };