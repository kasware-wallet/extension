import { permissionService } from '@/background/service';

export class Session {
  origin = '';

  icon = '';

  name = '';

  constructor(data) {
    if (data) {
      this.setProp(data);
    }
  }

  setProp({ origin, icon, name }) {
    this.origin = origin;
    this.icon = icon;
    this.name = name;
  }

  /**
   * The page's own name and icon — all `tabCheckin` is allowed to set.
   *
   * why not `origin`: it is the primary key of every permission, session and approval in this wallet, and
   * it used to be written from here, i.e. from the params a page sent. Since `window.kasware._request` is
   * public, any page could check in claiming another site's origin and inherit its grants. The origin is
   * now stamped by the background from the port's sender URL (see `getOrCreateSession`), which is the
   * shape the EVM branch always had.
   */
  setPageInfo({ name, icon }: { name?: string; icon?: string }) {
    this.name = name ?? '';
    this.icon = icon ?? '';
  }
}

// for each tab
const sessionMap = new Map();

const getSession = (id) => {
  return sessionMap.get(id);
};

/**
 * `origin` comes from the sender's URL, never from the page.
 *
 * Re-stamped on every call rather than only at creation: the key here is the tab id, and a tab keeps it
 * across navigations, so a session made on site A would otherwise still claim A's origin after the user
 * left for site B. The EVM service sidesteps this by keying on `${id}-${origin}`; this one cannot change
 * its key without orphaning the `pushMessage` the port installs on the session object.
 */
const getOrCreateSession = (id, origin = '') => {
  const existing = getSession(id);
  if (existing) {
    if (origin && existing.origin !== origin) {
      existing.origin = origin;
    }
    return existing;
  }

  return createSession(id, { origin, name: '', icon: '' });
};

const createSession = (id, data) => {
  const session = new Session(data);
  sessionMap.set(id, session);

  return session;
};

const deleteSession = (id) => {
  sessionMap.delete(id);
};

const broadcastEvent = (ev, data?, origin?) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sessions: any[] = [];
  sessionMap.forEach((session, key) => {
    if (permissionService.hasPermission(session.origin)) {
      sessions.push({
        key,
        ...session
      });
    }
  });

  // same origin
  if (origin) {
    sessions = sessions.filter((session) => session.origin === origin);
  }

  sessions.forEach((session) => {
    try {
      session.pushMessage?.(ev, data);
    } catch (e) {
      console.error(e);
      if (sessionMap.has(session.key)) {
        deleteSession(session.key);
      }
    }
  });
};

export default {
  getSession,
  getOrCreateSession,
  deleteSession,
  broadcastEvent
};
