// Aquí se inicia la app.

//IMPORTS
import { helpers as hs } from './utils.js';
import { bank } from './bank.js';
import { render } from './ui.js';

async function handle(action, form) {
  const s = hs.state();
  const user = hs.getUser(s);
  if (!user) return hs.redirect('index.html');
  // v obtiene el valor de un campo, a diferencia de field que necesita el form, v lo recibe de la funcion madre.
  const v = key => hs.field(form, key);
  if (action === 'update') {
    if (await hs.run(() => bank.update(user.id, v('nombre'), v('email'), v('telefono')), 'Datos actualizados')) render('cuenta');
  } else if (action === 'password') {
    await hs.run(() => {
      if (v('nueva') !== v('confirmar')) throw Error('Las contraseñas no coinciden.');
      bank.changePassword(user.id, v('actual'), v('nueva'));
      form.reset();
    }, 'Contraseña actualizada');
  } else if (action === 'remove') {
    if (await hs.confirmUser('Eliminar cuenta', '¿Seguro que deseas eliminar tu cuenta?')) {
      if (await hs.run(() => bank.remove(user.id))) hs.redirect('index.html');
    }
  } else if (action === 'deposit') {
    if (await hs.run(() => bank.deposit(v('cuenta'), v('monto')), 'Depósito exitoso')) render('transferencia');
  } else if (action === 'transfer') {
    if (await hs.confirmUser('Confirmar transferencia', `Transferir ${hs.money(Number(v('monto')))} a ${v('destino')}?`)) {
      if (await hs.run(() => bank.transfer(v('origen'), hs.required(v('destino'), 'La cuenta destino'), v('monto'), v('descripcion')), 'Transferencia exitosa')) render('transferencia');
    }
  }
}

// Inicia la app.
function init() {
  //Pagina cargada {data-page} para saber que renderizar
  const page = document.body.dataset.page;
  if (page === 'login') {
    if (hs.getUser(hs.state())) return hs.redirect('dashboard.html');
    document.addEventListener('submit', async event => {
      const form = event.target;
      if (!['login', 'register'].includes(form.dataset.action)) return;
      event.preventDefault();
      if (form.dataset.action === 'login') {
        if (await hs.run(() => bank.login(hs.field(form, 'email'), hs.field(form, 'password')))) hs.redirect('dashboard.html');
      } else {
        if (await hs.run(() => bank.register(hs.field(form, 'nombre'), hs.field(form, 'email'), hs.field(form, 'telefono'), hs.field(form, 'password')), 'Cuenta creada. Ahora puedes iniciar sesión.')) form.reset();
      }
    });
    return;
  }
  // Si no hay user logeado, redirecciona al inicio.
  if (!hs.getUser(hs.state())) return hs.redirect('index.html');
  render(page);
  document.addEventListener('submit', event => {
    if (!event.target.dataset.action) return;
    event.preventDefault();
    void handle(event.target.dataset.action, event.target);
  });
  document.addEventListener('click', async event => {
    // const filter = event.target.closest('[data-filter]');
    // if (filter) { hs.$('#app').dataset.filter = filter.dataset.filter; render(page); }
    if (event.target.closest('[data-action="remove"]')) await handle('remove');
    if (event.target.closest('#logoutBtn') && await hs.confirmUser('Cerrar sesión', '¿Seguro que deseas salir?')) {
      bank.logout(); hs.redirect('index.html');
    }
  });
}
init();
