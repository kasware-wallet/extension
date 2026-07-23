/* eslint-disable @typescript-eslint/no-explicit-any */

import { browserRuntimeConnect } from '@/shared/webapi/browser';
import { MANIFEST_VERSION } from '@/shared/constant';

import Message from './index';
import log from 'loglevel';

class PortMessage extends Message {
  port: any | null = null;
  listenCallback: any;

  constructor(port?: any) {
    super();

    if (port) {
      this.port = port;
    }
  }

  connect = (name?: string) => {
    this.port = browserRuntimeConnect(undefined, name ? { name } : undefined);
    this.port.onMessage.addListener(({ _type_, data }) => {
      if (_type_ === `${this._EVENT_PRE}kaspa_message`) {
        this.emit('kaspa_message', data);
        return;
      }
      if (_type_ === `${this._EVENT_PRE}message`) {
        this.emit('message', data);
        return;
      }

      if (_type_ === `${this._EVENT_PRE}response`) {
        this.onResponse(data);
      }
    });

    return this;
  };

  listen = (listenCallback: any) => {
    if (!this.port) return;
    this.listenCallback = listenCallback;
    this.port.onMessage.addListener(({ _type_, data }) => {
      if (_type_ === `${this._EVENT_PRE}request`) {
        this.onRequest(data);
      }
    });

    return this;
  };

  send = (type, data) => {
    if (!this.port) return;
    try {
      this.port.postMessage({ _type_: `${this._EVENT_PRE}${type}`, data: fixForFireFox(data) });
      // this.port.postMessage({ _type_: `${this._EVENT_PRE}${type}`, data: typeof data === 'function'?undefined:data });//not work
    } catch (e) {
      const message = (e as Error).message;
      if (
        message.includes('Attempting to use a disconnected port object') ||
        message.includes('Extension context invalidated')
      ) {
        log.info(e);
      } else if (
        message.includes('Do not know how to serialize a BigInt') ||
        message.includes('Could not serialize message')
      ) {
        // consider handling bigint with superjson
        // try {
        //   this.port.postMessage({ _type_: `${this._EVENT_PRE}${type}`, data: JSON.parse(JSON.stringify(data)) });
        // } catch (e) {
        //   log.error(e, data);
        // }
        log.error(e, data);
      } else {
        log.error(e, data, JSON.stringify(data));
      }
    }
  };

  dispose = () => {
    this._dispose();
    this.port?.disconnect();
  };
}
function fixForFireFox(data) {
  return MANIFEST_VERSION === 'mv2' ? JSON.parse(fixBigIntJSONStringify(data)) : data; //fix firefox error when dapps connect the kasware :DOMException: Function object could not be cloned.
}
export default PortMessage;

function fixBigIntJSONStringify(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
}
