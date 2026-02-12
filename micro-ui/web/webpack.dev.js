const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const webpack = require("webpack");
const path = require("path");
const dotenv = require("dotenv");

// Load .env file to ensure environment variables are available for proxy config
dotenv.config();

module.exports = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
  
  output: {
    filename: "[name].bundle.js",
    chunkFilename: "[name].chunk.js",
    publicPath: "/workbench-ui/",
  },
  
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    historyApiFallback: {
      index: "/workbench-ui/index.html",
    },
    compress: true,
    port: process.env.PORT || 3000,
    hot: true,
    liveReload: false, // Disable auto refresh to prevent conflicts
    open: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    },
    // Use setupProxy.js for proxy configuration (includes mock API if enabled)
    setupMiddlewares: (middlewares, devServer) => {
      // Load setupProxy.js which handles both mock API and proxy setup
      try {
        const setupProxy = require("./src/setupProxy.js");
        setupProxy(devServer.app);
      } catch (error) {
        console.warn("⚠️  Could not load setupProxy.js:", error.message);
      }
      return middlewares;
    },
    // Proxy configuration is now handled by setupProxy.js
  },
  
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("development"),
    }),
  ],
  
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  
  performance: {
    hints: false,
  },
});