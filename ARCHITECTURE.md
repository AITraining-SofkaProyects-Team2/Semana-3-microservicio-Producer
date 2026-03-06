# ARCHITECTURE.md — Producer Microservice (API Gateway)

**Proyecto:** Gestión de Quejas ISP — Microservicio Producer  
**Fecha:** 1 de marzo de 2026  
**Analizado por:** Antigravity (AI Coding Assistant)

---

## 1. Resumen Ejecutivo

El **Producer** actúa como la puerta de entrada (API Gateway) para la creación de tickets de soporte técnico. Su función principal es validar las peticiones de los clientes finales (frontend), generar un identificador único para el ticket y encolar el evento en RabbitMQ para su posterior procesamiento por el microservicio Consumer.

---

## 2. Endpoints y Contratos

### 2.1 POST `/complaints`
Este es el único endpoint de dominio del microservicio. Sigue una semántica de **petición asincrónica** (fire-and-forget).

*   **Verbo**: `POST`
*   **Ruta**: `/complaints` (o `/api/v1/tickets` según alias)
*   **Códigos de Respuesta**:
    *   `202 Accepted`: El ticket ha sido validado y aceptado para procesamiento. Se retorna un objeto con el `ticketId` generado.
    *   `400 Bad Request`: Error de validación en el cuerpo de la petición.
    *   `503 Service Unavailable`: El broker de mensajería (RabbitMQ) no está disponible para encolar el ticket.
    *   `500 Internal Server Error`: Errores no controlados del servidor.

**Ejemplo de Petición (JSON):**
```json
{
  "lineNumber": "099123456",
  "email": "usuario@ejemplo.com",
  "incidentType": "NO_SERVICE",
  "description": "No tengo internet desde hace 2 horas"
}
```

**Ejemplo de Respuesta (JSON):**
```json
{
  "ticketId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "RECEIVED",
  "message": "Accepted for processing",
  "createdAt": "2026-03-01T20:00:00.000Z"
}
```

---

## 3. Manejo de Conexión y Resiliencia

### 3.1 Conexión a RabbitMQ
El microservicio es resiliente a fallos temporales en el broker de mensajes:
*   **Arranque en Segundo Plano**: El servidor HTTP levanta inmediatamente sin bloquearse por la conexión a RabbitMQ.
*   **Backoff Exponencial**: Si RabbitMQ no está disponible, el `RabbitMQConnectionManager` intentará reconectarse indefinidamente con tiempos de espera crecientes.
*   **Fallo Controlado con 503**: Cuando se intenta crear un ticket y el broker no está conectado, el servicio responde con HTTP 503 para indicar al cliente que reintente más tarde.

---

## 4. Validaciones (SRP §3.1)

Las validaciones han sido extraídas de la capa de servicio a un **middleware dedicado** (`validateComplaintRequest.ts`) para respetar el principio de Responsabilidad Única.

*   **lineNumber**: Requerido, debe ser un string de 10 dígitos.
*   **email**: Requerido, formato de correo válido.
*   **incidentType**: Requerido, debe pertenecer a los tipos conocidos (`NO_SERVICE`, `INTERMITTENT_SERVICE`, etc.).
*   **description**: **Obligatoria** solo si `incidentType` es `OTHER`. Para otros tipos es opcional.

---

## 5. Patrones Aplicados

| Patrón | Implementación | Propósito |
| :--- | :--- | :--- |
| **Facade** | `MessagingFacade` | Abstrae la complejidad de la publicación de mensajes en RabbitMQ (interfaz simplificada para el servicio). |
| **Singleton** | `RabbitMQConnectionManager` | Gestiona una única instancia de conexión compartida. |
| **Dependency Injection** | `createComplaintsService(messaging)` | Facilita el testing mockeando la capa de mensajería. |
| **Chain of Responsibility** | Middlewares de Express | Procesa validaciones y errores en cadena. |

---

## 6. Observabilidad

El microservicio utiliza un logger estructurado y expone métricas básicas mediante una interfaz de salud para monitorear el estado de la conexión con RabbitMQ.

---

