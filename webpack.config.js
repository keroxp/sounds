const webpack = require("webpack");
const TsConfigWebpackPlugin = require("ts-config-webpack-plugin");
const path = require("path");
module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: {
    index: path.resolve(__dirname, "src/index.tsx")
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "public/dist/")
  },
  plugins: [
    new TsConfigWebpackPlugin(),
    new webpack.SourceMapDevToolPlugin({
      filename: "[name].js.map",
      exclude: ["vendor.js", "vendors~pdfjsWorker.js"]
    }),
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "initial"
        }
      }
    }
  }
};