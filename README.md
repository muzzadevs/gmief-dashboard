# GMIEF Dashboard 🚀

¡Bienvenido a **GMIEF**! Una plataforma para la gestión de zonas, subzonas, iglesias y ministerios de la Iglesia Evangélica Filadélfica de España.

---

## ✨ Características principales

- ⚡ **UI moderna y responsiva**: Menús flotantes, tarjetas estilizadas y experiencia mobile-first.
- 🗺️ **Gestión visual**: Selecciona zonas y subzonas, visualiza iglesias, sus ministerios y navega fácilmente.
- 🌍 **Mapa interactivo**: Visualización de zonas en el mapa de España.

---

## 🛠️ Instalación local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la app en acción.

## 🚀 Despliegue con Docker

1. Crea `.env` a partir de `.env.example` y configura contraseñas seguras para
   MariaDB, `ENCRYPTION_KEY` y `JWT_SECRET`. Genera las claves con:

   ```bash
   # ENCRYPTION_KEY
   openssl rand -hex 32
   # JWT_SECRET
   openssl rand -hex 48
   ```

2. Inicia o actualiza los servicios:

   ```bash
   docker compose up -d --build
   ```

   El contenedor de la aplicación espera a que MariaDB esté saludable, aplica las
   migraciones pendientes con `prisma migrate deploy`, ejecuta el seed idempotente
   de autenticación y después inicia Next.js como usuario no privilegiado. Para
   revisar el resultado, usa `docker compose logs -f app`. El puerto `3000` queda
   enlazado solo a `127.0.0.1`; publica el sitio mediante Nginx con HTTPS y accede
   por `https://filadelfiaconecta.com`, no por `:3000`. Las solicitudes HTTP se
   redirigen a HTTPS, excepto la ruta ACME para renovar certificados.

### Claves de cifrado de DNI/NIE

Configura `ENCRYPTION_KEY` como secreto de entorno en el despliegue. Si hay registros
cifrados con una clave anterior, configura también esa clave como
`ENCRYPTION_KEY_PREVIOUS`. Los nuevos datos se cifran con `ENCRYPTION_KEY`, mientras
que la aplicación intenta ambas claves al descifrar. Mantén la clave anterior hasta
que todos los registros cifrados con ella se hayan vuelto a cifrar.

`JWT_SECRET` debe ser una clave aleatoria y mantenerse estable entre reinicios; si
se cambia, los tokens de sesión emitidos previamente dejan de ser válidos.

---

## 📁 Estructura principal

- `app/` — Páginas y componentes principales
- `store/` — Estado global (Zustand)
- `lib/` — Conexión a base de datos
- `public/` — Imágenes y assets
- `types/` — Tipos TypeScript

---

## 👨‍💻 Tecnologías usadas

- [Next.js](https://nextjs.org/) 15+
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Poppins Font](https://fonts.google.com/specimen/Poppins)

---

## 🙌 Créditos

Desarrollado por David Muza para KDK. Si tienes dudas o sugerencias, ¡abre un issue o contacta al equipo!

---
