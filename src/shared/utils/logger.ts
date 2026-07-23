import * as loglevel from 'loglevel';

// eslint-disable-next-line no-undef
if (process.env.NODE_ENV == 'development') {
  loglevel.setLevel('debug');
} else {
  loglevel.setLevel('error');
}

export default loglevel;
