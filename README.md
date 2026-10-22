# Banco Digital

Proyecto de demostración en HTML/CSS/JavaScript.

## app.js

- js principal, inicia la app.
- Handle: gestiona las acciones de una cuenta logeada.

## bank.js 

- Contiene todas las operaciones bancarias en un objeto.
- Operaciones guardadas como métodos:
    - register: Registrar usuario nuevo
    - login: Inicial sesión.
    - logout: Cerrar sesión.
    - deposit: Deposito desde interfaz.
    - transfer: Mover monto de una cuenta a otra.
    - update: Cambiar datos de usuario.
    - changePassword: Cambiar la contraseña.
    - remove: Eliminar una cuenta.

## storageService.js

- Contiene métodos para leer, almacenary remover datos en el localStorage.
    - read
    - write

# ui.js

- Contiene la función render, y funciones adicionles con estructuras definidas para usar en render. 
    - render: Función principal que llama a las funciones auxiliares.
    - card
    - input
    - form
    - accountSelect
    - main

## utils.js
- Contiene todas las funcioens auxiliares y compartidas.
- Contiene el array KEYS, que se utilizan para el almacenamiento y lectura de datos del local storage.



