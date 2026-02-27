# Cambios de arquitectura: manejo de conexión a RabbitMQ

Resumen
- Se modificó el comportamiento de arranque para que el servicio HTTP levante aunque RabbitMQ no esté disponible.
- Se añadió un modo de conexión en segundo plano que reintenta la conexión con backoff.
- Se cambió la lógica de publicación para devolver HTTP 503 cuando el broker no esté conectado.

Ficheros modificados
- semana_03/Semana-3-microservicio-Producer/src/messaging/RabbitMQConnectionManager.ts
  - Añadido `connectInBackground()` que intenta la conexión en bucle con backoff exponencial.
  - Permite que la app arranque aunque `connect()` falle inicialmente.

- semana_03/Semana-3-microservicio-Producer/src/app.ts
  - Ahora llama a `connectionManager.connectInBackground()` y arranca el servidor inmediatamente (no bloqueante).

- semana_03/Semana-3-microservicio-Producer/src/services/complaints.service.ts
  - `createTicket` comprueba `isConnected()` y lanza `MessagingError` (HTTP 503) si el broker no está disponible.
  - Si hay conexión, publica de forma asíncrona (fire-and-forget) para mantener baja latencia en la API.

- semana_03/Semana-3-microservicio-Producer/src/messaging/MessagingFacade.ts
  - Ya existe la comprobación del canal (`getChannel()`) que lanza `MessagingError` si no hay canal.

- semana_03/Semana-3-microservicio-Producer/src/errors/messaging.error.ts
  - `MessagingError` hereda `HttpError(503)` para centralizar la respuesta HTTP adecuada.

- semana_03/Semana-3-microservicio-Producer/src/middlewares/errorHandlers/messagingErrorHandler.ts
  - Maneja `MessagingError` y responde con 503 Service Unavailable.

Razonamiento / motivación
- Levantar el contenedor aunque RabbitMQ no esté listo permite flujos de despliegue más resilientes: el servicio HTTP puede recibir tráfico, exponer health checks y volver a intentar la conexión en segundo plano.
- Evitar bloquear el arranque mejora la observabilidad y permite ejecutar migraciones o endpoints que no dependan del broker.
- Sin embargo, las rutas que dependen de publicar mensajes deben fallar con un código claro cuando el broker no está disponible: HTTP 503 (Service Unavailable) es la semántica correcta para indicar que el servicio no puede procesar la petición por una dependencia temporalmente inalcanzable.

Detalles operativos y recomendaciones
- Cuando se recibe 503, es recomendable incluir una cabecera `Retry-After` si se conoce un tiempo de reintento, o un cuerpo JSON con un código interno (`messaging_unavailable`) para que los clientes sepan reintentar.
- Mantener publicación asíncrona (fire-and-forget) cuando el broker está conectado reduce latencia de la API; se registran errores de publish para observabilidad.
- Tests: añadir pruebas que simulen `RabbitMQConnectionManager.isConnected() === false` y validen que POST /complaints devuelve 503.

Alternativas consideradas
- Hacer que el servidor espere indefinidamente por RabbitMQ hasta conectar: se descartó porque impide despliegues paralelos y reduce observabilidad.
- Encolar localmente en disco cuando RabbitMQ no está disponible (fallback persistente): solución más compleja, útil si se requiere alta durabilidad offline.

Próximos pasos sugeridos
- Añadir tests unitarios/integración que verifiquen el comportamiento 503.
- Documentar en el README del microservicio el comportamiento de arranque y cómo usar las health checks.

Fecha: 2026-02-27
