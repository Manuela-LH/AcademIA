# AcademIA 
### Tu Tutor Personal Inteligente con RAG y Gemini 2.5 Flash

**AcademIA** es una plataforma educativa de vanguardia que transforma tus documentos de estudio (PDF, DOCX, TXT) en una base de conocimientos interactiva. Utilizando técnicas de **RAG (Retrieval-Augmented Generation)** y los modelos más avanzados de **Google Gemini**, AcademIA actúa como un tutor socrático que te ayuda a aprender, no solo a obtener respuestas.

---

## Características Principales

- **Tutor IA Socrático**: Chatea con tus documentos. La IA utiliza solo tu material de estudio para responder, citando fuentes y utilizando técnicas pedagógicas (Feynman, Active Recall, etc.).
- **Gestión de Materias**: Organiza tu estudio por asignaturas con dashboards personalizados.
- **Generador de Quizzes**: Crea cuestionarios automáticos basados en tus documentos para poner a prueba tus conocimientos.
- **Seguridad y Privacidad**: Cada usuario maneja su propia clave de Gemini API, la cual se guarda cifrada en la base de datos.
- **Métricas de Estudio**: Visualiza tu progreso y tiempo dedicado a cada materia.

---

## Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: JavaScript / Node.js
- **Base de Datos**: Supabase
- **IA/ML**: 
  - **Generación**: Google Gemini 2.5 Flash (Streaming)
- **Estilos**: Tailwind CSS v4 + Lucide React
- **Notificaciones**: Sonner

---

## Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/Manuela-LH/AcademIA.git
cd AcademIA
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de Entorno
Crea un archivo `.env.local` en la raíz con las siguientes variables:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 4. Configurar la Base de Datos
Ejecuta el contenido del archivo `supabase-master-schema.sql` en el **SQL Editor** de tu panel de Supabase para crear las tablas, funciones vectoriales y políticas RLS necesarias.

### 5. Iniciar el proyecto
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Cómo funciona el Long Context RAG en AcademIA

1. **Ingesta**: El texto de tus archivos se divide en fragmentos (*chunks*) y se almacena en la base de datos.
2. **Contexto Masivo**: Cuando haces una pregunta, el sistema carga **TODO** el material de la materia activa.
3. **Razonamiento Profundo**: Gracias a los **1.0M de tokens de contexto de Gemini 2.5 Flash**, la IA lee todos tus documentos simultáneamente para responder con una precisión superior, sin perder detalles por filtros de búsqueda.

---

## Contribuciones

Las contribuciones son bienvenidas. Siéntete libre de abrir un *issue* o enviar un *pull request*.

## Licencia

Este proyecto es para fines académicos. Desarrollado por [Manuela-LH](https://github.com/Manuela-LH).