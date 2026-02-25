# Servicio Producer

Microservicio Producer para el Sistema de Gestión de Incidentes de un ISP. Expone una API HTTP para crear y consultar tickets de soporte, valida requests, persiste datos en memoria y publica eventos a RabbitMQ.

## Prerrequisitos

- Node.js 20+
- RabbitMQ corriendo en `localhost:5672` (o configurar vía variables de entorno)

## Instalación

```bash
cd backend/producer
npm install
```

## Configuración

Copiá `.env.example` a `.env` y ajustá los valores:

```bash
cp .env.example .env
```

| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `PORT` | 3000 | Puerto del servidor |
| `NODE_ENV` | development | Ambiente |
| `RABBITMQ_URL` | amqp://localhost:5672 | URL de conexión a RabbitMQ |
| `RABBITMQ_EXCHANGE` | complaints.exchange | Nombre del exchange |
| `RABBITMQ_ROUTING_KEY` | complaint.received | Routing key |

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t producer-service .
docker run -p 3000:3000 --env-file .env producer-service
```

## Endpoints de la API

### Crear Queja
```bash
POST /complaints
Content-Type: application/json

{
  "lineNumber": "555-1234",
  "email": "usuario@ejemplo.com",
  "incidentType": "SLOW_CONNECTION",
  "description": "Descripción opcional"
}
```

**Respuesta (201):**
```json
{
  "ticketId": "uuid",
  "lineNumber": "555-1234",
  "email": "usuario@ejemplo.com",
  "incidentType": "SLOW_CONNECTION",
  "description": null,
  "status": "RECEIVED",
  "priority": "PENDING",
  "createdAt": "2026-02-05T18:00:00.000Z"
}
```

### Obtener Queja
```bash
GET /complaints/:ticketId
```

### Health Check
```bash
GET /health
```

## Tipos de Incidente

- `NO_SERVICE` - Sin servicio
- `SLOW_CONNECTION` - Conexión lenta
- `INTERMITTENT_SERVICE` - Servicio intermitente
- `OTHER` - Otro (requiere descripción)

## Evento RabbitMQ

Se publica al exchange `complaints.exchange` con routing key `complaint.received`:

```json
{
  "ticketId": "uuid",
  "lineNumber": "555-1234",
  "incidentType": "SLOW_CONNECTION",
  "description": null,
  "createdAt": "2026-02-05T18:00:00.000Z"
}
```
