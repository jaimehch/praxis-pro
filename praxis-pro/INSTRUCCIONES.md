# PRAXIS Pro — Instrucciones de instalación
*Lee esto de arriba a abajo antes de empezar. Toma unos 20 minutos.*

---

## ¿Qué es esto?
Una plataforma web profesional de prevención de riesgos con:
- **FUF DS N°44** completo (60 preguntas con scoring automático)
- **Motor IA con Claude** — análisis ejecutivo, plan de cierre, evidencias
- **Generación de documentos Word** — MIPER, RIHS, Programa Preventivo en .docx real
- **API key segura** — Claude se llama desde el servidor, nunca desde el navegador del cliente
- **Streaming real** — ves los tokens de Claude aparecer mientras piensa

---

## Lo que necesitas (todo gratuito)

| Cuenta | Para qué | Costo |
|--------|----------|-------|
| [GitHub](https://github.com) | Guardar el código | Gratis |
| [Vercel](https://vercel.com) | Publicar en internet | Gratis |
| [Anthropic](https://console.anthropic.com) | API de Claude | ~5 USD de crédito inicial |

---

## Paso 1 — Sube el código a GitHub

1. Entra a **github.com** e inicia sesión (o crea una cuenta si no tienes)
2. Haz clic en el botón verde **"New"** (arriba a la izquierda)
3. Nombre del repositorio: `praxis-pro`
4. Deja todo lo demás como está → clic en **"Create repository"**
5. Haz clic en **"uploading an existing file"**
6. Arrastra **TODA la carpeta praxis-pro** (con su contenido) a la zona de upload
7. Abajo, donde dice "Commit changes", haz clic en **"Commit changes"**
8. ✅ Tu código ya está en GitHub

---

## Paso 2 — Conecta con Vercel

1. Ve a **vercel.com** y haz clic en **"Sign Up"**
2. Elige **"Continue with GitHub"** — esto conecta las dos cuentas
3. Haz clic en **"Add New Project"**
4. Busca tu repositorio **praxis-pro** y haz clic en **"Import"**
5. Deja todo como está → clic en **"Deploy"**
6. Espera 1-2 minutos → Vercel te dará una URL como `praxis-pro-tunombre.vercel.app`
7. ✅ Tu app está publicada (pero Claude aún no funciona — falta el Paso 3)

---

## Paso 3 — Configura tu API key de Claude

1. Ve a **console.anthropic.com** y crea una cuenta
2. En el menú izquierdo → **"API Keys"**
3. Haz clic en **"Create Key"** → copia la clave (empieza con `sk-ant-...`)
4. Vuelve a **Vercel** → entra a tu proyecto `praxis-pro`
5. Menú superior → **"Settings"** → **"Environment Variables"**
6. Agrega estas variables:

   | Variable | Valor |
   |----------|-------|
   | `ANTHROPIC_API_KEY` | Tu clave `sk-ant-...` |
   | `CLAUDE_MODEL` | `claude-sonnet-4-6` |

7. Haz clic en **"Save"**
8. Ve a **"Deployments"** → haz clic en los tres puntos del último deployment → **"Redeploy"**
9. ✅ Todo funciona

---

## Cómo usar la herramienta

### Análisis IA
1. Abre tu URL de Vercel en cualquier navegador
2. Completa la pestaña **"FUF DS N°44"** con las 60 preguntas
3. Completa la pestaña **"Scoping Inicial"** con las instalaciones del centro
4. Ve a la pestaña **"IA Diagnóstico"**
5. Pulsa **"Diagnóstico ejecutivo"** — Claude comenzará a responder en tiempo real
6. Pulsa **"Generar informe de brechas"** para ver el informe completo

### Documentos Word
1. Con el FUF y Scoping completados, ve a **"Documentos Word"**
2. Pulsa **"Generar MIPER (.docx)"** — espera 30-60 segundos
3. El archivo Word se descarga automáticamente
4. Repite para **RIHS** y **Programa Preventivo**

---

## Problemas frecuentes

**"Error de API"** → Verifica que configuraste bien `ANTHROPIC_API_KEY` en Vercel y que hiciste Redeploy.

**"La IA no responde"** → Tu saldo en Anthropic se puede haber agotado. Recarga en console.anthropic.com.

**"El archivo Word no se descarga"** → Asegúrate de no tener un bloqueador de popups activo en el navegador.

**"La URL no funciona"** → Verifica en Vercel que el último deployment está en estado "Ready" (punto verde).

---

## Costos aproximados

- **Vercel**: Gratis para uso personal/pequeño equipo
- **Claude por análisis**: ~0.01-0.05 USD por análisis completo
- **Claude por documento Word**: ~0.05-0.15 USD por documento (más contexto)
- **Anthropic da $5 USD de crédito inicial** — suficiente para 50-100 análisis

---

*PRAXIS Pro · DS N°44/2024 · Ley 16.744 · Chile*
