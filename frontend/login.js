import { API_AUTH_LOGIN, API_URL, API_BASE, API_REPORTES, API_URL } from "./config.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const code = document.getElementById("code").value;
  const errorBox = document.getElementById("error");
  errorBox.textContent = ""; // limpiar errores

  try {
    const res = await fetch(API_AUTH_LOGIN, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code })
})


    const data = await res.json();

    if (!res.ok) {
      errorBox.textContent = data.message || "Error al iniciar sesión";
      return;
    }

    // ✅ Guardar token y rol
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);

    // Redirigir según el rol
    if (data.role === "caja") {
      window.location.href = "admin.html";
    } else if (data.role === "mesero") {
      window.location.href = "mesero.html";
    } else {
      window.location.href = "index.html";
    }

  } catch (err) {
    errorBox.textContent = "Error de conexión con el servidor";
  }
});
