// Persistencia de datos con localStorage.
export const storage = {
  read(key) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? (key === 'sesion' ? null : []) : JSON.parse(value);
    } catch { return key === 'sesion' ? null : []; }
  },
  write(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(key); },
};
