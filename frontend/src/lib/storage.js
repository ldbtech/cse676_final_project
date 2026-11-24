// Tiny key-value wrapper. Every read and write reports its outcome,
// so the UI can show a visible error instead of failing silently.
export function createStore(backend, prefix = 'finconsole.') {
  const key = (name) => prefix + name;
  const fail = (err) => ({ ok: false, error: String((err && err.message) || err) });

  return {
    load(name) {
      try {
        const raw = backend.getItem(key(name));
        if (raw === null) return { ok: true, value: null };
        return { ok: true, value: JSON.parse(raw) };
      } catch (err) {
        return fail(err);
      }
    },
    save(name, value) {
      try {
        backend.setItem(key(name), JSON.stringify(value));
        return { ok: true };
      } catch (err) {
        return fail(err);
      }
    },
  };
}

export function browserStore() {
  return createStore(window.localStorage);
}
