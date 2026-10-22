// Dinamic displays

//IMPORTS
import { helpers as hs, ownAccounts } from "./utils.js"; 

// Formatos de renderizado dinamico
const card = (title, content) =>
  `<section class="card"><h2>${title}</h2>${content}</section>`;
const input = (name, label, type = 'text', value = '', extra = '') =>
  `<label>${label}<input name="${name}" type="${type}" value="${value}" ${extra}></label>`;
const form = (action, content, button) =>
  `<form data-action="${action}" novalidate>${content}<button>${button}</button></form>`;
const accountSelect = (accounts, name) =>
  `<label>Cuenta<select name="${name}">${accounts.map((c) => `<option value="${c.id}">${hs.spaced(c.numeroCuenta)} — ${hs.money(c.saldo)}</option>`).join('')}</select></label>`;
const main = (html) => {
  hs.$('#app').innerHTML = html;
};


export function render(page) {
  const s = hs.state(),
    user = hs.getUser(s),
    accounts = ownAccounts(s, user.id),
    movements = hs.history(s, accounts);
  const total = accounts.reduce((n, c) => n + c.saldo, 0);
  if (page === 'dashboard')
    main(
      card(
        `Bienvenido, ${user.nombre}`,
        `<p>Consulta el estado actual de tus cuentas.</p><div class="stats"><article>Saldo total<strong>${hs.money(total)}</strong></article><article>Cuentas<strong>${accounts.length}</strong></article><article>Movimientos<strong>${movements.length}</strong></article></div>`,
      ) +
        card(
          'Cuenta principal',
          accounts[0]
            ? `<p>Número: ${hs.spaced(accounts[0].numeroCuenta)}</p><p>Tipo: ${accounts[0].tipo}</p><p>Saldo: ${hs.money(accounts[0].saldo)}</p>`
            : '<p>No tienes cuentas bancarias registradas.</p>',
        ),
    );
  if (page === 'cuenta')
    main(
      card(
        'Mi cuenta',
        `<p><strong>${user.nombre}</strong></p><p>Correo: ${user.email}</p><p>Teléfono: ${user.telefono}</p>${accounts[0] ? `<p>Cuenta: ${hs.spaced(accounts[0].numeroCuenta)} (${accounts[0].activa ? 'Activa' : 'Inactiva'})</p><p>Saldo: ${hs.money(accounts[0].saldo)}</p><p>Apertura: ${hs.date(accounts[0].fechaApertura)}</p>` : ''}`,
      ) +
        card(
          'Información personal',
          form(
            'update',
            input('nombre', 'Nombre completo', 'text', user.nombre) +
              input('email', 'Correo electrónico', 'email', user.email) +
              input('telefono', 'Teléfono', 'tel', user.telefono),
            'Guardar cambios',
          ),
        ) +
        card(
          'Seguridad',
          form(
            'password',
            input('actual', 'Contraseña actual', 'password') +
              input('nueva', 'Nueva contraseña', 'password') +
              input('confirmar', 'Confirmar contraseña', 'password'),
            'Cambiar contraseña',
          ),
        ) +
        card(
          'Zona peligrosa',
          '<p>Eliminar tu cuenta es irreversible y requiere saldo cero.</p><button data-action="remove" class="danger">Eliminar mi cuenta</button>',
        ),
    );
  if (page === 'transferencia')
    main(
      card(
        'Operaciones bancarias',
        `<p>Saldo disponible: <strong>${hs.money(total)}</strong></p>`,
      ) +
        (accounts.length
          ? card(
              'Nueva transferencia',
              form(
                'transfer',
                accountSelect(accounts, 'origen') +
                  input(
                    'destino',
                    'Número de cuenta destino',
                    'text',
                    '',
                    'maxlength="14"',
                  ) +
                  input('monto', 'Monto', 'number', '', 'min="0" step="0.01"') +
                  input('descripcion', 'Descripción'),
                'Confirmar transferencia',
              ),
            ) +
            card(
              'Depositar saldo',
              '<p>Operación de práctica para cargar saldo.</p>' +
                form(
                  'deposit',
                  accountSelect(accounts, 'cuenta') +
                    input(
                      'monto',
                      'Monto',
                      'number',
                      '',
                      'min="0" step="0.01"',
                    ),
                  'Realizar depósito',
                ),
            )
          : card('Sin cuentas', 'No tienes cuentas disponibles.')),
    );
  if (page === 'movimientos') {
    const filter = hs.$('#app').dataset.filter || 'TODOS';
    const types = {
      DEPOSITO: 'Depósito',
      TRANSFERENCIA_ENVIADA: 'Transferencia enviada',
      TRANSFERENCIA_RECIBIDA: 'Transferencia recibida',
    };
    const shown = movements
      .filter((m) => filter === 'TODOS' || m.tipo === filter)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const counts = ['TODOS', ...Object.keys(types)]
      .map(
        (t) =>
          `<button class="filter ${filter === t ? 'active' : ''}" data-filter="${t}">${t === 'TODOS' ? 'Todos' : types[t]} (${t === 'TODOS' ? movements.length : movements.filter((m) => m.tipo === t).length})</button>`,
      )
      .join('');
    main(
      card(
        'Historial de movimientos',
        `<p>Consulta las operaciones realizadas en tus cuentas.</p><div class="filters">${counts}</div>${shown.length ? `<div class="table-scroll"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Monto</th><th>Saldo</th></tr></thead><tbody>${shown.map((m) => `<tr><td>${hs.date(m.fecha)}</td><td>${types[m.tipo] ?? m.tipo}</td><td>${m.descripcion || 'Sin descripción'}</td><td class="${m.tipo === 'TRANSFERENCIA_ENVIADA' ? 'negative' : 'positive'}">${m.tipo === 'TRANSFERENCIA_ENVIADA' ? '−' : '+'}${hs.money(m.monto)}</td><td>${hs.money(m.saldoResultante)}</td></tr>`).join('')}</tbody></table></div>` : '<p>No hay movimientos para mostrar.</p>'}`,
      ),
    );
  }
}