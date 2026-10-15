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

### Claves de cifrado de DNI/NIE

Configura `ENCRYPTION_KEY` como secreto de entorno en el despliegue. Si hay registros
cifrados con una clave anterior, configura también esa clave como
`ENCRYPTION_KEY_PREVIOUS`. Los nuevos datos se cifran con `ENCRYPTION_KEY`, mientras
que la aplicación intenta ambas claves al descifrar. Mantén la clave anterior hasta
que todos los registros cifrados con ella se hayan vuelto a cifrar.

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
