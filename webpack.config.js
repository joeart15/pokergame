const webpack = require("webpack");

module.exports = {
  resolve: {
    fallback: {
      "fs": false,
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify"),
      "process": require.resolve("process/browser"),
      "zlib": require.resolve("browserify-zlib"),
      "util": require.resolve("util/"),
      "assert": require.resolve("assert/"),
      "constants": require.resolve("constants-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "buffer": require.resolve("buffer/"),
      "os": require.resolve("os-browserify/browser"),
      "net": false,
      "tls": false,
      "child_process": false,
      "worker_threads": false,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ],
};
