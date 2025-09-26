# GMIEF Dashboard 🚀

¡Bienvenido a **GMIEF Dashboard**! Una plataforma moderna y responsiva para la gestión de zonas, subzonas e iglesias, desarrollada con Next.js, Tailwind CSS y ❤️ por Kodaly para KDK.

---

## ✨ Características principales

- ⚡ **UI moderna y responsiva**: Menús flotantes, tarjetas estilizadas y experiencia mobile-first.
- 🗺️ **Gestión visual**: Selecciona zonas y subzonas, visualiza iglesias y navega fácilmente.
- 🔒 **Seguro para producción**: Variables sensibles protegidas con `.env` y despliegue listo para Vercel.
- 🎨 **Colores corporativos**: Blanco, negro y azul marino, con fuente global Poppins.
- 🌍 **Mapa interactivo**: Visualización de zonas en el mapa de España.

---

## 🚀 Despliegue rápido en Vercel

1. **Haz fork o clona este repo**
2. **Configura las variables de entorno** en Vercel (`.env`):
   - Puedes copiar el contenido de `.env.example` y pegarlo en la sección de Environment Variables de Vercel.
3. **Haz commit y push**
4. ¡Listo! Vercel desplegará automáticamente tu app.

---

## ⚙️ Variables de entorno

Copia `.env.example` como `.env` y completa los valores:

```env
DB_HOST=localhost
DB_USER=usuario
DB_PASSWORD=contraseña
DB_NAME=nombre_db
DB_PORT=3306
```

> **Nota:** Nunca subas tu archivo `.env` al repositorio. `.env` ya está en `.gitignore`.

---

## 🛠️ Instalación local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la app en acción.

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

## 🛡️ Seguridad y buenas prácticas

- Todas las credenciales y datos sensibles van en `.env`.
- `.env.example` te muestra la estructura, pero sin datos reales.
- El archivo `.env` está protegido por `.gitignore`.

---

## 📦 Despliegue seguro en Vercel

1. Ve a tu dashboard de Vercel y selecciona tu proyecto.
2. Entra en **Settings > Environment Variables** y añade las variables de `.env.example`.
3. Haz commit y push a tu rama principal.
4. ¡Tu app se desplegará automáticamente y de forma segura!

---

## 🙌 Créditos

Desarrollado por Kodaly para KDK. Si tienes dudas o sugerencias, ¡abre un issue o contacta al equipo!

---

> Made with ❤️ by Kodaly
