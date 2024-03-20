const webpack = require('webpack');
const { EsbuildPlugin } = require('esbuild-loader')

const config = {
  mode: 'production',
  devtool: false,
  performance: {
    maxEntrypointSize: 2500000,
    maxAssetSize: 2500000
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
    new webpack.DefinePlugin({
      'process.env.BUILD_ENV': JSON.stringify('PRO')
    })
  ],
  optimization: {
    // minimize: false,
    minimizer: [
      new EsbuildPlugin({	
        keepNames: true,	
      }),	
    ]
  },
};

module.exports = config;
