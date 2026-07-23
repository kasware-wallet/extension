import gulp, { dest, src } from 'gulp';
import clean from 'gulp-clean';
import jsoncombine from 'gulp-jsoncombine';
import replace from 'gulp-replace';
import uglify from 'gulp-uglify';
import zip from 'gulp-zip';
import minimist from 'minimist';
import { exit } from 'process';
import webpack from 'webpack';
import packageConfig from './package.json';
import webpackConfigFunc from './webpack.config';
// import run from 'gulp-run';

//parse arguments
const knownOptions = {
  string: ['env', 'browser', 'manifest'],
  default: {
    env: 'dev',
    browser: 'chrome',
    manifest: 'mv3'
  }
};

const supported_envs = ['dev', 'pro'];
const supported_browsers = ['chrome', 'firefox', 'edge', 'brave'];
const supported_mvs = ['mv2', 'mv3'];
const brandName = 'kasware';
const version = packageConfig.version;
const validVersion = version.split('-beta')[0];
let options = {
  env: knownOptions.default.env,
  browser: knownOptions.default.browser,
  manifest: knownOptions.default.manifest
};
options = minimist(process.argv.slice(2), knownOptions);
if (!supported_envs.includes(options.env)) {
  console.error(`not supported env: [${options.env}]. It should be one of ${supported_envs.join(', ')}.`);
  exit(0);
}
if (!supported_browsers.includes(options.browser)) {
  console.error(`not supported browser: [${options.browser}]. It should be one of ${supported_browsers.join(', ')}.`);
  exit(0);
}
if (!supported_mvs.includes(options.manifest)) {
  console.error(`not supported browser: [${options.manifest}]. It should be one of ${supported_mvs.join(', ')}.`);
  exit(0);
}

//tasks...
function task_clean() {
  return gulp.src(`dist/${options.browser}/*`, { read: false }).pipe(clean());
}

function task_prepare() {
  return gulp.src('build/_raw/**/*').pipe(gulp.dest(`dist/${options.browser}`));
}

function task_merge_manifest() {
  let baseFile = '_base_v3';
  if (options.manifest == 'mv2') {
    baseFile = '_base_v2';
  }
  return gulp
    .src([
      `dist/${options.browser}/manifest/${baseFile}.json`,
      `dist/${options.browser}/manifest/${options.browser}.json`
    ])
    .pipe(
      jsoncombine('manifest.json', (data, meta) => {
        const result = Object.assign({}, data[baseFile], data[options.browser]);
        result.version = validVersion;
        return Buffer.from(JSON.stringify(result));
      })
    )
    .pipe(gulp.dest(`dist/${options.browser}`));
}

function task_clean_tmps() {
  return gulp.src(`dist/${options.browser}/manifest`, { read: false }).pipe(clean());
}

function task_webpack(cb) {
  webpack(
    webpackConfigFunc({
      version: validVersion,
      config: options.env,
      browser: options.browser,
      manifest: options.manifest
    }),
    cb
  );
}

function task_uglify(cb) {
  if (options.env == 'pro') {
    return gulp
      .src(`dist/${options.browser}/**/*.js`)
      .pipe(uglify())
      .pipe(gulp.dest(`dist/${options.browser}`));
  }
  cb();
}

function task_replace() {
  return src([`dist/${options.browser}/extensionServiceWorker*.js`])
    .pipe(replace('document.baseURI || self.location.href', 'self.location.href'))
    .pipe(replace('document.baseURI||self.location.href', 'self.location.href'))
    .pipe(dest(`dist/${options.browser}/`));
}

// function task_obfuscator() {
//   return run('javascript-obfuscator  ./dist/chrome/extensionServiceWorker.js  --output ./dist/chrome/extensionServiceWorker.js  --compact true').exec()
// }

function task_package(cb) {
  if (options.env == 'pro') {
    if (options.browser == 'firefox') {
      return gulp
        .src(`dist/${options.browser}/**/*`)
        .pipe(zip(`${brandName}-${options.browser}-${options.manifest}-v${version}.xpi`))
        .pipe(gulp.dest('./dist'));
    } else {
      return gulp
        .src(`dist/${options.browser}/**/*`)
        .pipe(zip(`${brandName}-${options.browser}-${options.manifest}-v${version}.zip`))
        .pipe(gulp.dest('./dist'));
    }
  }
  cb();
}

exports.build = gulp.series(
  task_clean,
  task_prepare,
  task_merge_manifest,
  task_clean_tmps,
  task_webpack,
  task_uglify,
  task_replace,
  // task_obfuscator,
  task_package
);
