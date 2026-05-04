# Consultorio Odontológico La 92

Sistema de gestión integral para consultorios odontológicos.

## Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Estado**: TanStack Query (React Query)
- **Backend**: PostgreSQL + PostgREST
- **Autenticación**: JWT personalizado

## Configuración

### Variables de entorno

```bash
# Desarrollo
VITE_API_URL="http://localhost:3001"

# Producción
VITE_API_URL="https://clinident.trycompany.es/api"
```

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Despliegue

El frontend compilado se despliega en `clinident.trycompany.es`.

```bash
# Compilar
npm run build

# El directorio dist/ contiene los archivos para desplegar
```

## Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── contexts/       # Contextos de React (Auth, Theme)
├── hooks/          # Hooks personalizados
├── lib/            # Utilidades y cliente API
├── pages/          # Páginas de la aplicación
└── assets/         # Recursos estáticos
```

## Características

- Gestión de pacientes
- Agenda y citas
- Odontograma digital
- Facturación
- Inventario
- Chat interno
- Reportes y estadísticas
