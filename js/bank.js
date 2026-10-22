//Operaciones bancarias: resgistrar, login, logout

//IMPORTS
import { storage as sto } from "./storageService.js";
import { helpers as hs, ownAccounts } from "./utils.js"; 


// Función para verificar el email input.
const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Función para generar un número de cuenta de 12 digitos (No asegura que sea único)
const accNumber = () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');

export const bank = {
  //Funciones de banco: register, login, logout, deposit, transfer, update, changePassword, remove
  register(nombre, email, telefono, password) {
    nombre = hs.required(nombre, 'El nombre');
    telefono = hs.required(telefono, 'El teléfono');
    email = hs.required(email, 'El correo').toLowerCase();
    // Validacion de datos [email, password y que el correo no exista en otra cuentas]
    if (!emailOk(email)) throw Error('Ingresa un correo válido.');
    if (password.length < 6)
      throw Error('La contraseña debe tener al menos 6 caracteres.');
    const s = hs.state();
    if (s.usuarios.some((u) => u.email === email))
      throw Error('Ya existe un usuario con este correo.');
    const usuario = {
      id: hs.id(),
      nombre,
      email,
      telefono,
      password,
      activo: true,
      fechaRegistro: new Date().toISOString(),
    };
    const numeroCuenta = accNumber();
    s.usuarios.push(usuario);
    s.cuentas.push({
      id: hs.id(),
      numeroCuenta,
      tipo: 'Ahorro',
      saldo: 0,
      usuarioId: usuario.id,
      activa: true,
      fechaApertura: new Date().toISOString(),
    });
    hs.save(s);
    return usuario;
  },
  login(email, password) {
    const user = hs.state().usuarios.find(
      (u) =>
        u.email === String(email).trim().toLowerCase() &&
        u.password === password &&
        u.activo !== false,
    );
    if (!user) throw Error('Correo o contraseña incorrectos.');
    sto.write('sesion', {
      usuarioId: user.id,
      fechaInicio: new Date().toISOString(),
    });
    return user;
  },
  logout() {
    sto.remove('sesion');
  },
  deposit(cuentaId, value) {
    const n = hs.amount(value),
      s = hs.state(),
      c = s.cuentas.find((c) => c.id === cuentaId);
    if (!c || !c.activa) throw Error('La cuenta no existe o está inactiva.');
    c.saldo = Math.round((c.saldo + n) * 100) / 100; //
    hs.record(s, 'DEPOSITO', n, c.id, null, 'Depósito desde interfaz', c.saldo);
    hs.save(s);
    return c;
  },
  transfer(origenId, numeroDestino, value, descripcion = '') {
    const n = hs.amount(value),
      s = hs.state();
    const a = s.cuentas.find((c) => c.id === origenId);
    const b = s.cuentas.find(
      (c) => c.numeroCuenta === String(numeroDestino).replace(/\s/g, ''),
    );
    //Verifica que ambas cuentas existan, esten activas y que no sean iguales entre si.
    if (!a || !b) throw Error('La cuenta origen o destino no existe.');
    if (!a.activa || !b.activa)
      throw Error('Una de las cuentas está inactiva.');
    if (a.id === b.id)
      throw Error('No puedes transferir dinero a la misma cuenta.');
    if (a.saldo < n) throw Error('Saldo insuficiente.');
    a.saldo = Math.round((a.saldo - n) * 100) / 100;
    b.saldo = Math.round((b.saldo + n) * 100) / 100;
    hs.record(s, 'TRANSFERENCIA_ENVIADA', n, a.id, b.id, descripcion, a.saldo);
    hs.record(s, 'TRANSFERENCIA_RECIBIDA', n, a.id, b.id, descripcion, b.saldo);
    hs.save(s);
    return { origen: a, destino: b };
  },
  update(userId, nombre, email, telefono) {
    nombre = hs.required(nombre, 'El nombre');
    telefono = hs.required(telefono, 'El teléfono');
    email = hs.required(email, 'El correo').toLowerCase();
    // Verificar email en formato y que no exista con otro user. Que el user exista
    if (!emailOk(email)) throw Error('Ingresa un correo válido.');
    const s = hs.state()
    const u = s.usuarios.find((u) => u.id === userId);
    if (!u) throw Error('El usuario no existe.');
    if (s.usuarios.some((v) => v.id !== userId && v.email === email))
      throw Error('Ya existe un usuario con este correo.');
    Object.assign(u, { nombre, email, telefono });
    hs.save(s);
    return u;
  },
  changePassword(userId, oldPassword, newPassword) {
    const s = hs.state(),
      u = s.usuarios.find((u) => u.id === userId);
      // Verificar user existe y contraseña correcta y diferente de la anterior
    if (!u || u.password !== oldPassword)
      throw Error('La contraseña actual no es correcta.');
    if (newPassword.length < 6 || newPassword === oldPassword)
      throw Error(
        'La nueva contraseña debe tener al menos 6 caracteres y ser diferente.',
      );
    u.password = newPassword;
    hs.save(s);
  },
  remove(userId) {
    const s = hs.state(),
      accounts = ownAccounts(s, userId);
    if (!s.usuarios.some((u) => u.id === userId))
      throw Error('El usuario no existe.');
    if (accounts.some((c) => c.saldo > 0))
      throw Error(
        'No puedes eliminar tu cuenta mientras tengas saldo disponible.',
      );
      // Crear un conjunto de IDs para filtrar cuentas y movimientos
    const ids = new Set(accounts.map((c) => c.id));
    s.usuarios = s.usuarios.filter((u) => u.id !== userId);
    s.cuentas = s.cuentas.filter((c) => !ids.has(c.id));
    s.movimientos = s.movimientos.filter(
      (m) => !ids.has(m.cuentaOrigen) && !ids.has(m.cuentaDestino),
    );
    hs.save(s);
    this.logout();
  },
};