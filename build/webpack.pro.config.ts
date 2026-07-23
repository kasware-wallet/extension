import { EsbuildPlugin } from 'esbuild-loader';
import webpack from 'webpack';

const IS_MV2 = process.env.manifest === 'mv2';
console.log('IS_MV2', IS_MV2);
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
    }),
    // Ignore source map warnings from npm packages, do not load external source maps
    new webpack.IgnorePlugin({
      resourceRegExp: /\.map$/
    })
  ],
  optimization: {
    // minimize: false,
    minimizer: [
      new EsbuildPlugin({
        keepNames: true
      }),
    ],
    // sideEffects: false,
    // 'deterministic' results in faster recompilations in cases where a child
    // chunk changes, but the parent chunk does not.
    ...(IS_MV2 && {
      // don't warn about large JS assets, unless they are going to be too big for Firefox
      // performance: { maxAssetSize: 1 << 22 },
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
      // runtimeChunk: 'single', // Extract Webpack runtime code into a separate file
      // runtimeChunk: {
      //   name: 'runtime'
      // },
      splitChunks: {
        chunks: (chunk) => chunk.name !== 'extensionContentScript' && chunk.name !== 'extensionPageScript',
        minSize: 10000,
        maxSize: 4000000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          'webextension-polyfill': {
            minSize: 0,
            test: /[\\/]node_modules[\\/]webextension-polyfill/,
            name: 'webextension-polyfill',
            chunks: 'all',
            priority: 100
          },
          ...(IS_MV2 && {
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              reuseExistingChunk: true
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true
            }
          })
        }
      }
    })
  }
};
export default config;
