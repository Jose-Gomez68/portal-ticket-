# Core
Servicios globales, guards e interceptors. Se usan una sola vez en toda la app.
No importar componentes de `features` aquí.

La autenticación conserva únicamente los datos del usuario en memoria. El navegador
envía y recibe las cookies HttpOnly de autenticación con `withCredentials`; Angular
no lee ni guarda los tokens. La sesión se comprueba al iniciar la aplicación usando
el endpoint de refresh.