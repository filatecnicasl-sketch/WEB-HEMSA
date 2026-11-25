# Backend del editor definitivo HEMSA

## Objetivo y alcance

Desarrollar un backend real y desplegable para el proyecto frontend React/Vite existente de HEMSA San Fernando. No reconstruir ni redisenar el frontend.

Esta primera iteracion cubre unicamente los contenidos que el editor local ya contempla:

- Cabecera principal de Inicio: texto superior, titular y descripcion.
- Aviso destacado: activacion, etiqueta, texto y enlace interno.
- Datos de contacto: telefono, correo, direccion y horario.
- Flujo editorial: borrador privado, publicacion, historial inmutable y restauracion a borrador.
- Acceso de personal con correo y contrasena, sesiones y autorizacion de administrador.

No incluir todavia biblioteca de imagenes, noticias, editor de otras paginas, registros ciudadanos ni datos del Servicio de Ayuda a Domicilio. No crear cuentas publicas.

## Comportamiento editorial obligatorio

1. El contenido publicado se puede leer anonimamente y es el unico que ve la web publica.
2. Los borradores, historiales y operaciones de escritura son privados.
3. Guardar un borrador no modifica el contenido publico.
4. Publicar copia el borrador validado al contenido publico y crea una revision inmutable con autor y fecha.
5. Antes de cada publicacion se conserva tambien el estado publicado anterior en el historial.
6. Restaurar una revision la copia al borrador, pero no la publica hasta una confirmacion editorial posterior.
7. Descartar un borrador lo devuelve al ultimo contenido publicado.
8. El historial se puede consultar y exportar en JSON como copia de seguridad.
9. Todos los datos deben persistir en almacenamiento duradero del servidor. No usar mocks, arrays en memoria, localStorage ni archivos temporales como sustituto de persistencia.

## Contenido inicial

El estado inicial debe reproducir la portada actual y no activar un aviso nuevo sin accion del editor:

```json
{
  "notice": {
    "enabled": false,
    "label": "Actualidad",
    "text": "Convocatorias 2026 del Servicio de Ayuda a Domicilio",
    "link": "/empleo"
  },
  "hero": {
    "eyebrow": "Tu empresa municipal en La Isla",
    "title": "Cerca de ti, en cada etapa de la vida",
    "text": "Te ayudamos a encontrar casa, a vender la tuya y a cuidar de tus mayores en su hogar. Somos HEMSA, y estamos aqui para las personas de San Fernando."
  },
  "contact": {
    "address": "Avenida San Juan Bosco, 46. 11100 San Fernando (Cádiz)",
    "phone": "956 945 000",
    "email": "correo@hemsasanfernando.es",
    "schedule": "Lunes a viernes, de 9:00 a 13:30 h"
  }
}
```

El frontend conservara el acento tipografico de Cadiz; el servidor debe aceptar y devolver UTF-8 correctamente.

## Validacion

Rechazar claves desconocidas, tipos incorrectos y valores fuera de limite. Recortar espacios exteriores sin alterar los saltos de linea internos del titular.

- `notice.enabled`: booleano obligatorio.
- `notice.label`: texto de 1 a 30 caracteres.
- `notice.text`: texto de 1 a 100 caracteres.
- `notice.link`: uno de `/empleo`, `/vivienda`, `/servicios`, `/contacto`, `/ayudas-y-subvenciones`.
- `hero.eyebrow`: texto de 1 a 70 caracteres.
- `hero.title`: texto de 1 a 100 caracteres.
- `hero.text`: texto de 1 a 240 caracteres.
- `contact.phone`: texto de 7 a 30 caracteres; admitir digitos, espacios y el signo `+` inicial.
- `contact.email`: correo valido, maximo 160 caracteres; normalizar a minusculas.
- `contact.address`: texto de 5 a 160 caracteres.
- `contact.schedule`: texto de 5 a 120 caracteres.

## Autenticacion y autorizacion

- Inicio de sesion con correo y contrasena.
- Contrasenas almacenadas con un hash adaptativo moderno (Argon2id, scrypt o bcrypt), nunca en texto plano.
- Sesion mediante token opaco aleatorio enviado como `Authorization: Bearer <token>`.
- Guardar en el servidor solo el hash del token, con caducidad maxima de 12 horas.
- Logout invalida el token actual.
- Respuesta generica ante credenciales incorrectas y limitacion de intentos por IP y cuenta.
- Rol inicial `admin`; exigirlo en todas las rutas `/api/admin/*`.
- No incluir secretos privilegiados en respuestas, logs ni frontend.
- Configuracion inicial mediante variables de entorno, cuyos valores se configuraran fuera del chat: `HEMSA_ADMIN_EMAIL`, `HEMSA_ADMIN_PASSWORD`, `HEMSA_FRONTEND_ORIGINS`.
- La contrasena de arranque solo se usa para crear el administrador inicial si todavia no existe; documentar el procedimiento de configuracion sin mostrar valores reales.
- No usar cookies de sesion en esta iteracion para evitar dependencia de cookies de terceros entre origenes.

## CORS y seguridad HTTP

Permitir los origenes de desarrollo:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:4173`
- `http://127.0.0.1:4173`
- `http://localhost:7100`
- `http://127.0.0.1:7100`

Permitir anadir el origen publico definitivo mediante `HEMSA_FRONTEND_ORIGINS` (lista separada por comas). No usar `*` como unico origen permitido.

Permitir `GET`, `POST`, `OPTIONS` y las cabeceras `Content-Type`, `Authorization`. Responder OPTIONS antes de la autenticacion. Las respuestas privadas deben incluir `Cache-Control: no-store`. Anadir cabeceras basicas de seguridad y limite razonable de cuerpo JSON.

## Persistencia y concurrencia

Entidades minimas:

- Administrador: id, correo, hash de contrasena, rol, activo, fechas.
- Sesion: id, hash de token, administrador, caducidad, fechas.
- Estado de contenido: borrador, publicado, version numerica, autor y fechas.
- Revision: id, instantanea completa validada, accion, autor, fecha y metadatos.

Cada escritura de borrador incluye `baseVersion`. Si otro usuario modifico el estado antes, responder `409 Conflict` y no sobrescribir. Publicar tambien valida `baseVersion` para impedir publicaciones cruzadas accidentales. Las operaciones de publicacion deben ser atomicas junto con la creacion de revisiones.

## Contrato de errores

Todas las respuestas de error de la API usan JSON UTF-8:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensaje legible sin revelar datos sensibles",
    "fields": {
      "contact.email": "Introduce un correo electronico valido"
    }
  }
}
```

`fields` es opcional. Codigos esperados: 400 validacion, 401 no autenticado, 403 sin permisos, 404 recurso inexistente, 409 conflicto de version, 413 cuerpo excesivo, 429 demasiados intentos y 500 error generico sin detalles internos.

## Casos de aceptacion obligatorios

1. `GET /api/health` devuelve 200 JSON y no es una pagina HTML.
2. `GET /api/public/content` devuelve 200 con el contenido inicial publicado.
3. `GET /api/admin/content` sin token devuelve 401 JSON.
4. Login incorrecto devuelve 401 generico; login valido devuelve token y datos no sensibles del administrador.
5. `GET /api/auth/me` con token valido devuelve el administrador; sin token devuelve 401.
6. Un borrador con correo invalido devuelve 400 y no se persiste.
7. Un borrador valido con marcador de prueba se guarda y se relee, pero no aparece en `/api/public/content`.
8. Publicar con la version correcta hace visible el marcador y crea revision.
9. Una segunda escritura con una version obsoleta devuelve 409 y no pisa cambios.
10. Restaurar la revision anterior devuelve ese contenido al borrador sin cambiar todavia el publicado.
11. Descartar borrador devuelve el borrador al contenido publicado.
12. Logout invalida la sesion y `/api/auth/me` deja de aceptar ese token.
13. OPTIONS desde `http://localhost:5173` con metodo POST y cabeceras `content-type, authorization` devuelve CORS correcto.
14. Todas las operaciones de prueba dejan el contenido inicial restaurado y no conservan el marcador de prueba.

## Entrega tecnica

- Implementar el contrato OpenAPI adjunto sin cambiar rutas, metodos ni esquemas.
- Ejecutar los casos de aceptacion en el backend desarrollado.
- Guardar una version publicable y devolver su identificador.
- Devolver tambien rutas, ejemplos, configuracion requerida por nombre, mecanismo de gestion de secretos y cualquier limitacion real.
- No publicar el servicio: el agente local lo publicara despues con la autorizacion ya obtenida del usuario y verificara las API desplegadas.

## Ampliacion obligatoria: Ayudas, Empleo y documentos

Esta ampliacion sustituye la limitacion inicial de no editar noticias u otras paginas. Debe implementarse en la misma version del backend, conservando intactos todos los contratos y casos de aceptacion anteriores.

### Alcance editorial

- CRUD editorial de ayudas y convocatorias de empleo con borrador privado, publicacion, archivo y versiones inmutables.
- Una ayuda incluye categoria, titulo, resumen, fechas de publicacion y vencimiento, etiqueta del vencimiento, nota, actualizacion opcional, fuente oficial opcional, icono y documentos.
- Una convocatoria incluye titulo, descripcion, fecha de publicacion y vencimiento opcionales, etiqueta visible, agrupacion publica `current` o `archive` y documentos.
- `Archivar` en el editor retira un elemento de la API publica sin borrar su historial. La agrupacion `archive` de Empleo significa historico visible; no debe confundirse con el archivado editorial privado.
- Crear o editar guarda un borrador y nunca cambia por si solo el contenido publico.
- Publicar crea una revision inmutable con autor y fecha. Antes de publicar se conserva tambien la version publicada anterior.
- Restaurar copia una revision al borrador, sin publicarla automaticamente.
- Las rutas publicas solo devuelven elementos publicados no archivados editorialmente.
- Cada elemento tiene un `id` slug estable. Anadir listados, resoluciones o resultados a Empleo modifica el mismo proceso y conserva su URL y ancla; nunca crea otra convocatoria.
- Toda escritura de un elemento existente exige su `baseVersion`; una version obsoleta devuelve `409 Conflict` y no pisa cambios.

### Documentos y PDF

- Cada documento tiene id, titulo, descripcion opcional, numero de paginas opcional, bytes opcional, tipo y URL.
- Tipos permitidos: `bases`, `formulario`, `listado`, `resolucion`, `resultado`, `otro`.
- Los 13 documentos actuales de Ayudas y todos los documentos actuales de Empleo conservan exactamente sus rutas `/documents/...` y metadatos migrados.
- `POST /api/admin/documents` admite `multipart/form-data` con PDF y metadatos, asocia el archivo al borrador del propietario indicado y devuelve el documento y el elemento editorial actualizado.
- Validar `application/pdf`, firma binaria `%PDF-`, nombre de archivo seguro y limite de 15 MB. Rechazar contenido que solo finja ser PDF por su extension.
- Almacenamiento binario real y duradero. No usar memoria, localStorage, URLs temporales ni almacenamiento efimero.
- Un PDF nuevo recibe un id opaco estable y la URL `/api/public/documents/{documentId}`.
- `GET /api/public/documents/{documentId}` solo sirve un PDF si esta asociado a la version publicada de una ayuda o convocatoria no archivada editorialmente. En cualquier otro caso devuelve 404, sin revelar si existe un borrador.
- `GET /api/admin/documents/{documentId}` requiere administrador y permite revisar el PDF privado.
- Quitar un documento de un borrador no lo retira de la version publicada hasta publicar. Las revisiones conservan sus referencias documentales y los binarios necesarios para restaurar.
- No permitir reutilizar el id de un documento privado en otro elemento ni enlazar arbitrariamente documentos ajenos.
- La carga de un PDF tambien comprueba `baseVersion` del propietario y devuelve 409 si esta obsoleta.
- Si la plataforma no permite persistencia binaria duradera, detener la entrega de esta parte e informar explicitamente de la limitacion; no simularla.

### Datos iniciales

Migrar como contenido publicado inicial los datos de `integration/editorial-seed.json`:

- Las cuatro ayudas actuales, con sus 13 documentos, textos, fechas ISO y fuentes.
- Los siete procesos de Empleo actuales: dos en `current` y cinco en `archive`, con todos sus documentos.
- Mantener los ids exactos del seed, incluidos los anclajes existentes con caracteres Unicode.
- Crear una revision inicial por elemento. No cambiar los textos ni inventar fechas que no existan en el seed.
- Los documentos heredados usan `source: legacy`; los nuevos usan `source: uploaded` y almacenamiento del backend.

### Casos de aceptacion adicionales

15. La lista publica inicial contiene cuatro ayudas y siete procesos de Empleo, con 13 documentos de ayudas y los documentos migrados de Empleo.
16. Crear una ayuda como borrador no la muestra publicamente; publicarla la hace visible con sus fechas.
17. Actualizar una ayuda con una `baseVersion` obsoleta devuelve 409 y conserva el borrador anterior.
18. Subir un PDF real a una ayuda publicada no lo expone antes de publicar; despues de publicar puede descargarse anonimamente y su contenido empieza por `%PDF-`.
19. Un falso PDF o un archivo de mas de 15 MB se rechaza sin quedar accesible.
20. Un documento solo asociado a un borrador devuelve 404 en la ruta publica y 200 con administrador en la ruta privada.
21. Anadir un documento de tipo `resultado` a una convocatoria conserva exactamente el mismo id de proceso y no aumenta el numero de procesos tras publicar.
22. Archivar editorialmente una ayuda o convocatoria la retira de la API publica y deja de servir sus PDF subidos; sus rutas heredadas `/documents/...` se mantienen como recursos estaticos existentes fuera de este backend.
23. Restaurar una revision devuelve textos y documentos al borrador sin alterar lo publicado hasta una nueva publicacion.
24. Las pruebas eliminan o archivan sus marcadores y restauran el contenido inicial publicado; no dejan PDF de prueba publicos.

### Entrega de la ampliacion

- Mantener todas las rutas anteriores y añadir exactamente las rutas y esquemas del OpenAPI ampliado.
- Ejecutar tambien los casos 15 a 24 contra almacenamiento real.
- Guardar una unica version publicable que incluya todo lo anterior; devolver su id, configuracion y limitaciones reales.
- No publicar el servicio.
