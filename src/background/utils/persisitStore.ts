import { debounce } from 'debounce';

import { storage } from '@/background/webapi';
import type { STORE_KEYS } from '@/shared/constant';

const persistStorage = (name: string, obj: object) => {
  debounce(storage.set(name, obj), 1000);
};

interface CreatePersistStoreParams<T> {
  name: keyof typeof STORE_KEYS;
  template?: T;
  fromStorage?: boolean;
}

const createPersistStore = async <T extends object>({
  name,
  template = Object.create(null),
  fromStorage = true
}: CreatePersistStoreParams<T>): Promise<T> => {
  let tpl = template;

  if (fromStorage) {
    const storageCache = await storage.get(name);
    tpl = Object.assign({}, template, storageCache);
    // tpl = storageCache || template;
    if (!storageCache) {
      await storage.set(name, tpl);
    }
  }

  const createProxy = <A extends object>(obj: A): A =>
    new Proxy(obj, {
      set(target, prop, value) {
        target[prop] = value;

        persistStorage(name, target);
        // forked from r. But we disabed it temporarily because we did not benefit from it yet.
        // syncStateToUI(BROADCAST_TO_UI_EVENTS.storeChanged, {
        //   bgStoreName: name,
        //   changedKey: prop as string,
        //   changedKeys: [prop as string],
        //   partials: {
        //     [prop]: value
        //   }
        // });

        return true;
      },

      deleteProperty(target, prop) {
        if (Reflect.has(target, prop)) {
          Reflect.deleteProperty(target, prop);

          persistStorage(name, target);
        }

        return true;
      }
    });
  return createProxy<T>(tpl);
};

export default createPersistStore;
