import { API_AUTH_LOGIN, API_BASE, API_REPORTES, API_URL } from "./config.js";

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const auth = getAuth();
const functions = getFunctions();

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('codeInput').value;

  const authenticateUser = httpsCallable(functions, 'authenticateUser');

  try {
    const result = await authenticateUser({ code: code });
    const token = result.data.token;

    // Inicia sesión con el token personalizado
    const userCredential = await signInWithCustomToken(auth, token);
    const user = userCredential.user;

    // Obtén los datos del token para determinar el rol
    const idTokenResult = await user.getIdTokenResult();
    const role = idTokenResult.claims.role;

    // Redirige al usuario según su rol
    if (role === 'caja') {
      window.location.href = './admin.html';
    } else if (role === 'mesero') {
      window.location.href = './mesero.html';
    }
  } catch (error) {
    console.error('Error de autenticación:', error.message);
    alert('Código incorrecto. Por favor, inténtalo de nuevo.');
  }
});