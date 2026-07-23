import webpackMerge from 'webpack-merge';
import commonConfig from './build/webpack.common.config';
import debugConfig from './build/webpack.debug.config';
import devConfig from './build/webpack.dev.config';
import proConfig from './build/webpack.pro.config';

const configs = {
  dev: devConfig,
  pro: proConfig,
  debug: debugConfig
} as const;

const config = (env) => {
  if (env.config == 'dev') {
    process.env.NODE_ENV = 'development';
    process.env.BABEL_ENV = 'development';
  } else {
    process.env.NODE_ENV = 'production';
    process.env.BABEL_ENV = 'production';
    process.env.TAILWIND_MODE = 'watch';
  }

  if (env.config) {
    return webpackMerge(commonConfig(env), configs[env.config]);
  }

  return commonConfig(env);
};

export default config;
