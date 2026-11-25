# Integracion del backend HEMSA

- Chat de desarrollo: `1a2101dc-b6d2-83bc-8000-09fe5a9c4c69`
- Contratos enviados: `integration/backend-requirements.md`, `integration/openapi.yaml`
- Autorizacion del usuario: backend publico a nivel de red, con autenticacion y autorizacion para todas las operaciones privadas.
- Estado inicial: el primer intento no encontro los adjuntos en el entorno remoto; se reenvian en la misma conversacion.
- Frontend: proyecto React/Vite local existente. No se envia ni se reconstruye.
- Secretos: ningun valor real incluido en los adjuntos ni en el chat.
- Ampliacion preparada: OpenAPI 1.1.0, 31 rutas y 36 esquemas; ayudas, empleo, PDF, revisiones y concurrencia.
- Datos iniciales: 4 ayudas con 13 documentos y 7 procesos de empleo con 49 documentos; 62 rutas `/documents/...` conservadas.
- Seed generado: `integration/editorial-seed.json`.
- Pruebas preparadas: `integration/api-acceptance.mjs` y `integration/editorial-api-acceptance.mjs`; todavia no ejecutadas contra un servidor real.
- Envio de ampliacion: primer intento rechazado porque el chat seguia procesando el contrato original. Reanudar `integration/send-editorial-expansion.py` cuando finalice; no crear otro chat.
