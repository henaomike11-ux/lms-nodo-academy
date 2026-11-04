/* ============================================================
   Nodo Academy · Datos de ejemplo (Sprint 1)
   Inventario de cursos del documento "Marca, cursos, identidad y equipo".
   En el Sprint 2 estos mismos datos se cargan a Firestore (ver
   docs/cargar-cursos.md) y las páginas leen desde la base de datos.
   ============================================================ */

window.DATOS = {
  courses: [
    {
      id: "desarrollo-web-desde-cero",
      title: "Desarrollo Web desde Cero",
      description: "Aprende a construir páginas web reales con HTML, CSS y JavaScript, sin conocimientos previos. Terminas con tu primer sitio publicado en internet.",
      promise: "Publica tu primera página web profesional en 4 semanas.",
      audience: "Personas sin experiencia en programación que quieren crear su propio sitio web.",
      category: "Desarrollo web",
      level: "Principiante",
      duration: "12 horas",
      price: 149000,
      currency: "COP",
      imageUrl: "",
      instructorId: "jose-garcia",
      published: true,
      featured: true,
      requirements: ["Un computador con internet", "Ganas de aprender; no necesitas saber programar"],
      outcomes: [
        "Estructurar una página con HTML semántico",
        "Dar estilo y diseño responsive con CSS y Flexbox",
        "Agregar interacción con JavaScript y el DOM",
        "Publicar tu sitio en GitHub Pages"
      ]
    },
    {
      id: "git-github-para-equipos",
      title: "Git y GitHub para Equipos",
      description: "Domina el control de versiones y el trabajo colaborativo con GitHub: ramas, pull requests, resolución de conflictos y flujo Scrum con tableros.",
      promise: "Trabaja en equipo sin pisar el código de nadie.",
      audience: "Estudiantes y equipos pequeños que empiezan a desarrollar software juntos.",
      category: "Herramientas",
      level: "Principiante",
      duration: "8 horas",
      price: 99000,
      currency: "COP",
      imageUrl: "",
      instructorId: "juan-oduber",
      published: true,
      featured: true,
      requirements: ["Cuenta gratuita de GitHub", "Conocimientos básicos de computación"],
      outcomes: [
        "Entender commits, historial y ramas",
        "Colaborar con repositorios remotos y pull requests",
        "Resolver conflictos con confianza",
        "Organizar el trabajo con Issues, tableros y releases"
      ]
    }
  ],

  lessons: [
    // ---- Curso 1: Desarrollo Web desde Cero ----
    { id: "dw-1-1", courseId: "desarrollo-web-desde-cero", moduleNumber: 1, moduleName: "Fundamentos de HTML", order: 1, title: "Estructura de una página", videoUrl: "", content: "Qué es HTML, la estructura básica de un documento (doctype, head, body) y cómo abrir tu primer archivo en el navegador.", materialUrl: "" },
    { id: "dw-1-2", courseId: "desarrollo-web-desde-cero", moduleNumber: 1, moduleName: "Fundamentos de HTML", order: 2, title: "Textos, enlaces e imágenes", videoUrl: "", content: "Encabezados, párrafos, listas, enlaces e imágenes: las etiquetas que usarás todos los días.", materialUrl: "" },
    { id: "dw-1-3", courseId: "desarrollo-web-desde-cero", moduleNumber: 1, moduleName: "Fundamentos de HTML", order: 3, title: "Formularios", videoUrl: "", content: "Campos de texto, botones y validación básica: así capturas datos de tus usuarios.", materialUrl: "" },
    { id: "dw-2-1", courseId: "desarrollo-web-desde-cero", moduleNumber: 2, moduleName: "CSS y diseño", order: 4, title: "Selectores y colores", videoUrl: "", content: "Cómo seleccionar elementos y aplicar colores, tipografías y espacios.", materialUrl: "" },
    { id: "dw-2-2", courseId: "desarrollo-web-desde-cero", moduleNumber: 2, moduleName: "CSS y diseño", order: 5, title: "Flexbox", videoUrl: "", content: "Organiza elementos en filas y columnas con Flexbox.", materialUrl: "" },
    { id: "dw-2-3", courseId: "desarrollo-web-desde-cero", moduleNumber: 2, moduleName: "CSS y diseño", order: 6, title: "Diseño responsive", videoUrl: "", content: "Media queries y diseño celular primero para que tu página se vea bien en cualquier pantalla.", materialUrl: "" },
    { id: "dw-3-1", courseId: "desarrollo-web-desde-cero", moduleNumber: 3, moduleName: "JavaScript básico", order: 7, title: "Variables y tipos", videoUrl: "", content: "Guarda información y trabaja con números, textos y listas.", materialUrl: "" },
    { id: "dw-3-2", courseId: "desarrollo-web-desde-cero", moduleNumber: 3, moduleName: "JavaScript básico", order: 8, title: "Funciones", videoUrl: "", content: "Agrupa instrucciones reutilizables y entiende parámetros y retornos.", materialUrl: "" },
    { id: "dw-3-3", courseId: "desarrollo-web-desde-cero", moduleNumber: 3, moduleName: "JavaScript básico", order: 9, title: "Manipulación del DOM", videoUrl: "", content: "Haz que la página reaccione: cambia textos, muestra y oculta elementos, responde a clics.", materialUrl: "" },

    // ---- Curso 2: Git y GitHub para Equipos ----
    { id: "gh-1-1", courseId: "git-github-para-equipos", moduleNumber: 1, moduleName: "Introducción a Git", order: 1, title: "Qué es el control de versiones", videoUrl: "", content: "Por qué existe Git y qué problemas resuelve cuando varias personas tocan el mismo código.", materialUrl: "" },
    { id: "gh-1-2", courseId: "git-github-para-equipos", moduleNumber: 1, moduleName: "Introducción a Git", order: 2, title: "Commits y historial", videoUrl: "", content: "Guarda puntos en el tiempo con mensajes claros y recorre el historial.", materialUrl: "" },
    { id: "gh-1-3", courseId: "git-github-para-equipos", moduleNumber: 1, moduleName: "Introducción a Git", order: 3, title: "Ramas", videoUrl: "", content: "Trabaja en paralelo sin afectar la versión principal.", materialUrl: "" },
    { id: "gh-2-1", courseId: "git-github-para-equipos", moduleNumber: 2, moduleName: "Trabajo con GitHub", order: 4, title: "Repositorios remotos", videoUrl: "", content: "Sube tu proyecto a GitHub y sincroniza cambios con push y pull.", materialUrl: "" },
    { id: "gh-2-2", courseId: "git-github-para-equipos", moduleNumber: 2, moduleName: "Trabajo con GitHub", order: 5, title: "Pull requests", videoUrl: "", content: "Propón cambios, pide revisión y únelos a la rama principal.", materialUrl: "" },
    { id: "gh-2-3", courseId: "git-github-para-equipos", moduleNumber: 2, moduleName: "Trabajo con GitHub", order: 6, title: "Resolución de conflictos", videoUrl: "", content: "Qué es un conflicto, cómo leerlo y cómo resolverlo sin perder trabajo.", materialUrl: "" },
    { id: "gh-3-1", courseId: "git-github-para-equipos", moduleNumber: 3, moduleName: "Flujo Scrum con GitHub", order: 7, title: "Issues y tableros", videoUrl: "", content: "Convierte tareas en Issues y organízalas en un tablero de GitHub Projects.", materialUrl: "" },
    { id: "gh-3-2", courseId: "git-github-para-equipos", moduleNumber: 3, moduleName: "Flujo Scrum con GitHub", order: 8, title: "Revisión de código", videoUrl: "", content: "Buenas prácticas para revisar y aprobar el trabajo de un compañero.", materialUrl: "" },
    { id: "gh-3-3", courseId: "git-github-para-equipos", moduleNumber: 3, moduleName: "Flujo Scrum con GitHub", order: 9, title: "Releases", videoUrl: "", content: "Publica versiones estables y documenta qué cambió en cada una.", materialUrl: "" }
  ],

  instructors: [
    { id: "mike-henao", name: "Mike Henao", email: "henaomike11@gmail.com", specialty: "Desarrollo web y producto", hourlyRate: 0, bio: "Product Owner de Nodo Academy. Lidera el diseño de los cursos y la experiencia del estudiante." },
    { id: "juan-oduber", name: "Juan Oduber", email: "", specialty: "Git, GitHub y trabajo en equipo", hourlyRate: 0, bio: "Scrum Master de Nodo Academy. Enseña a trabajar en equipo con control de versiones y tableros." },
    { id: "jose-garcia", name: "Jose García", email: "", specialty: "HTML, CSS y JavaScript", hourlyRate: 0, bio: "Developer de Nodo Academy. Construye las pantallas y la lógica de la plataforma." }
  ],

  faq: [
    { q: "¿Necesito saber programar para empezar?", a: "No. Los cursos están pensados para principiantes y explican cada concepto desde cero." },
    { q: "¿Por cuánto tiempo tengo acceso?", a: "El acceso es de por vida: puedes volver a ver las lecciones cuando quieras." },
    { q: "¿Recibo un certificado?", a: "Sí. Al completar el 100 % de las lecciones obtienes un certificado de finalización." },
    { q: "¿Cómo pago?", a: "Con tarjeta, PSE u otros medios disponibles en nuestra pasarela de pago. Al aprobarse el pago, el curso se activa automáticamente." },
    { q: "¿Puedo pedir reembolso?", a: "Sí, dentro de los 7 días siguientes a la compra si no has completado más del 20 % del curso. Consulta la política de reembolso." }
  ]
};
