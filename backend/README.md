# Splitwise Clone Backend - Prisma 7

## Configuración de Prisma 7 y Base de Datos

Este proyecto usa **Prisma 7** con la nueva configuración de datasources.

## Configuración de Prisma 7

La configuración de la base de datos se realiza en [prisma.config.js](prisma.config.js) siguiendo las nuevas prácticas de Prisma 7:

```javascript
module.exports = {
  schema: "./prisma/schema.prisma",
  seed: "./prisma/seed.js",
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};
```

En el código de la aplicación, el PrismaClient se inicializa con:

```javascript
const prisma = new PrismaClient({
  adapter: {
    url: process.env.DATABASE_URL,
  },
});
```

## Scripts disponibles

- `npm start` - Ejecuta la aplicación en producción (genera cliente, ejecuta migraciones y inicia servidor)
- `npm run dev` - Ejecuta en modo desarrollo (genera cliente, migraciones, seed y nodemon)
- `npm run db:generate` - Genera el cliente de Prisma
- `npm run db:migrate` - Ejecuta las migraciones
- `npm run db:seed` - Ejecuta el seed de la base de datos
- `npm run db:reset` - Resetea la base de datos

## Uso con Docker

1. **Construir y iniciar los servicios:**

   ```bash
   make build
   make start
   ```

2. **Desarrollo local:**

   ```bash
   # Copiar variables de entorno
   cp .env.example .env

   # Instalar dependencias
   npm install

   # Ejecutar en modo desarrollo
   npm run dev
   ```

## Endpoints disponibles

- `GET /health` - Verificar estado de la aplicación y conexión a la base de datos
- `GET /users` - Listar usuarios
- `GET /groups` - Listar grupos
- `GET /expenses` - Listar gastos

## Estructura de la base de datos

La aplicación incluye los siguientes modelos:

- **User**: Usuarios del sistema
- **Group**: Grupos para compartir gastos
- **Expense**: Gastos individuales

## Configuración de la base de datos

El archivo `.env` debe contener:

```
DATABASE_URL="postgresql://user:password@localhost:5432/splitwise"
```

Para Docker, la URL es:

```
DATABASE_URL="postgresql://user:password@database:5432/splitwise"
```

## Cambios importantes en Prisma 7

- La URL de la base de datos ya no se define en `schema.prisma`
- Se configura en `prisma.config.js` y se pasa al constructor de `PrismaClient`
- Mejor separación de dependencias entre schema y configuración de conexión
