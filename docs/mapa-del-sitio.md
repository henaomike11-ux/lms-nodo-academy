# Mapa del sitio · 13 pantallas

```mermaid
flowchart TD
  I[1. Inicio<br>index.html] --> C[2. Catálogo<br>cursos.html]
  I --> L[4. Registro / Login<br>login.html]
  I --> LEG[13. Legales<br>legales.html]
  I -->|formulario| CRM[(leads · CRM)]
  C --> D[3. Detalle del curso<br>curso.html?id=]
  D -->|Comprar| L
  D -->|Comprar con sesión| P[5. Pago y confirmación<br>pago.html?curso=]
  P -->|pasarela → webhook| INS[(enrollments)]
  L --> MC[6. Mis cursos<br>mis-cursos.html]
  INS --> MC
  MC --> LE[7. Lección / aula<br>leccion.html?curso=&leccion=]
  LE -->|Marcar completada| PR[(progress)]
  L --> PF[8. Mi perfil<br>perfil.html]
  L -->|role: admin| A[Panel · admin.html]
  A --> A1[9. Administrar cursos y lecciones]
  A --> A2[10. CRM: contactos y embudo]
  A --> A3[11. Recursos e instructores]
  A --> A4[12. Reportes]
```

| # | Pantalla | Archivo | Quién | Sprint |
|---|---|---|---|---|
| 1 | Inicio | `index.html` | Visitante | 1 |
| 2 | Catálogo | `cursos.html` | Visitante | 1 |
| 3 | Detalle del curso | `curso.html?id=` | Visitante | 1 y 4 |
| 4 | Registro e inicio de sesión | `login.html` | Visitante | 2 |
| 5 | Pago y confirmación | `pago.html` | Estudiante | 4 |
| 6 | Mis cursos | `mis-cursos.html` | Estudiante | 3 |
| 7 | Lección (aula) | `leccion.html` | Estudiante | 3 |
| 8 | Mi perfil | `perfil.html` | Estudiante | 3 |
| 9 | Administrar cursos | `admin.html#cursos` / `#lecciones` | Administrador | 3 |
| 10 | CRM: contactos y embudo | `admin.html#crm` | Administrador | 4 |
| 11 | Recursos | `admin.html#recursos` / `#instructores` | Administrador | 5 |
| 12 | Reportes | `admin.html#reportes` | Administrador | 5 |
| 13 | Legales | `legales.html` | Visitante | 5 |

## Wireframes

Los bocetos de las 5 pantallas clave (inicio, catálogo, detalle, mis cursos y lección) se guardan en `docs/wireframes/` como imágenes (foto del boceto a mano o exportación de Figma). *Pendiente: subir las fotos.*
