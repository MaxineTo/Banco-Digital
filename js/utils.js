//Helpers compartidos

//IMPORTS
import { storage as sto } from './storageService.js';

// Las keys representan los datos que se almacenaran en el localStorage.
const KEYS = ['usuarios', 'cuentas', 'movimientos'];
// Funcion para encontrar todas las cuentas de un solo user.
export const ownAccounts = (s, userId) => s.cuentas.filter(c => c.usuarioId === userId);

// Objeto que contiene todas las funciones de ayuda compartidas, para luego exportarlas como metodos de helpers.
export const helpers = {
  // Tomar en un objeto todos los datos guardados en el localStorage.
  state() { return Object.fromEntries(KEYS.map(k => [k, sto.read(k)])); },
  save(s) { KEYS.forEach(k => sto.write(k, s[k])); },
  // Verificación para datos obligatorios en input de users.
  required(s, label) {
    if (!String(s ?? '').trim()) throw Error(`${label} es obligatorio.`);
    return String(s).trim();
  },
  // Tomar el usuario en la sesión actual.
  getUser(s) {
    const session = sto.read('sesion');
    return session ? s.usuarios.find(u => u.id === session.usuarioId && u.activo !== false) : undefined;
  },
  // Generar un ID unico con crypto: se usa con uder ids, cuentas y movimientos
  id() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`; },

  // -- Formatear para render
  money(n) { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n); },
  date(s) { return new Date(s).toLocaleDateString('es-MX'); },
  spaced(s) { return String(s).replace(/(.{4})(?=.)/g, '$1 '); },
  amount(s) {
    const n = Number(s);
    if (!String(s ?? '').trim() || !Number.isFinite(n) || n <= 0) throw Error('El monto debe ser mayor a cero.');
    if (Math.round(n * 100) !== n * 100 && Math.abs(Math.round(n * 100) - n * 100) > 1e-8) throw Error('El monto admite máximo dos decimales.');
    return Math.round(n * 100) / 100;
  },
  // Encontrar todos los movimientos de una cuenta.
  history(s, accounts) {
    return s.movimientos.filter(m => accounts.some(c => m.tipo === 'TRANSFERENCIA_RECIBIDA' ? c.id === m.cuentaDestino : c.id === m.cuentaOrigen));
  },
  // Guardar los datos de un movimiento en el objeto para salvarlo en localStorage
  record(s, tipo, monto, origen, destino, descripcion, saldo) {
    s.movimientos.push({ id: this.id(), tipo, monto, cuentaOrigen: origen, cuentaDestino: destino, descripcion, saldoResultante: saldo, fecha: new Date().toISOString() });
  },
  // Acorta la forma de seleccionar un elemento HTML
  $(selector) { return document.querySelector(selector); },
  // Tomar el valor de un campo llenado por el user en un form
  field(form, name) { return form.elements.namedItem(name)?.value ?? ''; },
  // Alertar al usuario
  alertUser(icon, title, text = '') {
    return globalThis.Swal ? globalThis.Swal.fire({ icon, title, text }) : Promise.resolve(window.alert(`${title}\n${text}`));
  },
  // Tomar confirmacion de usuario (async)
  async confirmUser(title, text) {
    return globalThis.Swal ? (await globalThis.Swal.fire({ title, text, icon: 'question', showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar' })).isConfirmed : window.confirm(`${title}\n${text}`);
  },
  // run maneja las acciones ya sea que sean exitosas o que haya erroes.
  async run(action, success) {
    try { await action(); if (success) await this.alertUser('success', success); return true; }
    catch (e) { await this.alertUser('error', 'No fue posible completar la operación', e.message); return false; }
  },
  // Redireccionar a un html diferente
  redirect(page) { window.location.href = page; },
};
