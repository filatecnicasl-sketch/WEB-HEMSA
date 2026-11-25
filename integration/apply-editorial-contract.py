from pathlib import Path

root = Path(__file__).resolve().parent
requirements_path = root / "backend-requirements.md"
openapi_path = root / "openapi.yaml"

expansion = r'''

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
'''

paths = r'''  /api/public/grants:
    get:
      tags: [Public]
      summary: Lista las ayudas publicadas
      responses:
        '200':
          description: Ayudas publicas
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GrantPublicList'
  /api/public/grants/{id}:
    get:
      tags: [Public]
      summary: Obtiene una ayuda publicada
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      responses:
        '200':
          description: Ayuda publica
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GrantPublicDetail'
        '404':
          $ref: '#/components/responses/Error'
  /api/public/jobs:
    get:
      tags: [Public]
      summary: Lista los procesos de empleo publicados
      responses:
        '200':
          description: Procesos publicos
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JobPublicList'
  /api/public/jobs/{id}:
    get:
      tags: [Public]
      summary: Obtiene un proceso de empleo publicado
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      responses:
        '200':
          description: Proceso publico
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JobPublicDetail'
        '404':
          $ref: '#/components/responses/Error'
  /api/public/documents/{documentId}:
    get:
      tags: [Public]
      summary: Descarga un PDF perteneciente a contenido publicado
      parameters:
        - $ref: '#/components/parameters/DocumentId'
      responses:
        '200':
          description: PDF publico
          content:
            application/pdf:
              schema:
                type: string
                format: binary
        '404':
          $ref: '#/components/responses/Error'
  /api/admin/grants:
    get:
      tags: [Admin]
      summary: Lista todos los estados editoriales de ayudas
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Ayudas editoriales
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GrantEditorialList'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
    post:
      tags: [Admin]
      summary: Crea una ayuda como borrador privado
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GrantCreate'
      responses:
        '200':
          description: Borrador creado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GrantEditorialDetail'
        '400':
          $ref: '#/components/responses/Error'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '409':
          $ref: '#/components/responses/Error'
  /api/admin/grants/{id}:
    get:
      tags: [Admin]
      summary: Obtiene el estado editorial de una ayuda
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      responses:
        '200':
          description: Estado editorial
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GrantEditorialDetail'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
    post:
      tags: [Admin]
      summary: Guarda el borrador de una ayuda
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GrantWrite'
      responses:
        '200':
          description: Borrador guardado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GrantEditorialDetail'
        '400':
          $ref: '#/components/responses/Error'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
        '409':
          $ref: '#/components/responses/Error'
  /api/admin/grants/{id}/publish:
    post:
      tags: [Admin]
      summary: Publica el borrador de una ayuda
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VersionWrite'
      responses:
        '200':
          description: Ayuda publicada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GrantEditorialDetail'
        '400':
          $ref: '#/components/responses/Error'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
        '409':
          $ref: '#/components/responses/Error'
  /api/admin/grants/{id}/archive:
    post:
      tags: [Admin]
      summary: Archiva editorialmente una ayuda y la oculta al publico
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VersionWrite'
      responses:
        '200':
          description: Ayuda archivada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GrantEditorialDetail'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
        '409':
          $ref: '#/components/responses/Error'
  /api/admin/grants/{id}/revisions:
    get:
      tags: [Admin]
      summary: Lista las revisiones de una ayuda
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      responses:
        '200':
          description: Revisiones editoriales
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EditorialRevisionList'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
  /api/admin/grants/{id}/restore:
    post:
      tags: [Admin]
      summary: Restaura una revision de ayuda al borrador
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EditorialRestore'
      responses:
        '200':
          description: Revision copiada al borrador
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GrantEditorialDetail'
        '400':
          $ref: '#/components/responses/Error'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
        '409':
          $ref: '#/components/responses/Error'
  /api/admin/jobs:
    get:
      tags: [Admin]
      summary: Lista todos los estados editoriales de empleo
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Procesos editoriales
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JobEditorialList'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
    post:
      tags: [Admin]
      summary: Crea un proceso de empleo como borrador privado
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JobCreate'
      responses:
        '200':
          description: Borrador creado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JobEditorialDetail'
        '400':
          $ref: '#/components/responses/Error'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '409':
          $ref: '#/components/responses/Error'
  /api/admin/jobs/{id}:
    get:
      tags: [Admin]
      summary: Obtiene el estado editorial de un proceso
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      responses:
        '200':
          description: Estado editorial
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JobEditorialDetail'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
    post:
      tags: [Admin]
      summary: Guarda el borrador de un proceso
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JobWrite'
      responses:
        '200':
          description: Borrador guardado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JobEditorialDetail'
        '400':
          $ref: '#/components/responses/Error'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
        '409':
          $ref: '#/components/responses/Error'
  /api/admin/jobs/{id}/publish:
    post:
      tags: [Admin]
      summary: Publica el borrador de un proceso
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VersionWrite'
      responses:
        '200':
          description: Proceso publicado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JobEditorialDetail'
        '400':
          $ref: '#/components/responses/Error'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
        '409':
          $ref: '#/components/responses/Error'
  /api/admin/jobs/{id}/archive:
    post:
      tags: [Admin]
      summary: Archiva editorialmente un proceso y lo oculta al publico
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VersionWrite'
      responses:
        '200':
          description: Proceso archivado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JobEditorialDetail'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
        '409':
          $ref: '#/components/responses/Error'
  /api/admin/jobs/{id}/revisions:
    get:
      tags: [Admin]
      summary: Lista las revisiones de un proceso
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      responses:
        '200':
          description: Revisiones editoriales
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EditorialRevisionList'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
  /api/admin/jobs/{id}/restore:
    post:
      tags: [Admin]
      summary: Restaura una revision de empleo al borrador
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/EditorialId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EditorialRestore'
      responses:
        '200':
          description: Revision copiada al borrador
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JobEditorialDetail'
        '400':
          $ref: '#/components/responses/Error'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
        '409':
          $ref: '#/components/responses/Error'
  /api/admin/documents:
    post:
      tags: [Admin]
      summary: Sube un PDF real y lo asocia al borrador indicado
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/DocumentUpload'
            encoding:
              file:
                contentType: application/pdf
      responses:
        '200':
          description: PDF privado asociado al borrador
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DocumentUploadResult'
        '400':
          $ref: '#/components/responses/Error'
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
        '409':
          $ref: '#/components/responses/Error'
        '413':
          $ref: '#/components/responses/Error'
  /api/admin/documents/{documentId}:
    get:
      tags: [Admin]
      summary: Descarga un PDF privado para revision
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/DocumentId'
      responses:
        '200':
          description: PDF privado
          content:
            application/pdf:
              schema:
                type: string
                format: binary
        '401':
          $ref: '#/components/responses/Error'
        '403':
          $ref: '#/components/responses/Error'
        '404':
          $ref: '#/components/responses/Error'
'''

schemas = r'''    EditorialDocument:
      type: object
      additionalProperties: false
      required: [id, title, description, pages, bytes, kind, source, url]
      properties:
        id:
          type: string
          minLength: 1
          maxLength: 180
        title:
          type: string
          minLength: 1
          maxLength: 220
        description:
          type: string
          maxLength: 600
        pages:
          type: integer
          minimum: 1
          maximum: 10000
          nullable: true
        bytes:
          type: integer
          minimum: 1
          maximum: 15728640
          nullable: true
        kind:
          type: string
          enum: [bases, formulario, listado, resolucion, resultado, otro]
        source:
          type: string
          enum: [legacy, uploaded]
        url:
          type: string
          minLength: 1
          maxLength: 500
    GrantInput:
      type: object
      additionalProperties: false
      required: [id, category, title, summary, publicationDate, deadlineDate, deadlineLabel, note, contentUpdatedAt, sourceUrl, sourceLabel, icon, documents]
      properties:
        id:
          type: string
          minLength: 1
          maxLength: 160
        category:
          type: string
          minLength: 1
          maxLength: 120
        title:
          type: string
          minLength: 1
          maxLength: 240
        summary:
          type: string
          minLength: 1
          maxLength: 1200
        publicationDate:
          type: string
          format: date
        deadlineDate:
          type: string
          format: date
          nullable: true
        deadlineLabel:
          type: string
          minLength: 1
          maxLength: 100
        note:
          type: string
          maxLength: 2400
        contentUpdatedAt:
          type: string
          format: date
          nullable: true
        sourceUrl:
          type: string
          format: uri
          maxLength: 1000
          nullable: true
        sourceLabel:
          type: string
          maxLength: 180
        icon:
          type: string
          enum: [Accessibility, HeartHandshake, KeyRound, Building2, Megaphone]
        documents:
          type: array
          maxItems: 100
          items:
            $ref: '#/components/schemas/EditorialDocument'
    JobInput:
      type: object
      additionalProperties: false
      required: [id, title, description, publicationDate, deadlineDate, statusLabel, displayGroup, documents]
      properties:
        id:
          type: string
          minLength: 1
          maxLength: 160
        title:
          type: string
          minLength: 1
          maxLength: 240
        description:
          type: string
          minLength: 1
          maxLength: 1200
        publicationDate:
          type: string
          format: date
          nullable: true
        deadlineDate:
          type: string
          format: date
          nullable: true
        statusLabel:
          type: string
          minLength: 1
          maxLength: 100
        displayGroup:
          type: string
          enum: [current, archive]
        documents:
          type: array
          maxItems: 150
          items:
            $ref: '#/components/schemas/EditorialDocument'
    EditorialMetadata:
      type: object
      required: [version, status, hasUnpublishedChanges, createdAt, updatedAt, firstPublishedAt, lastPublishedAt, archivedAt]
      properties:
        version:
          type: integer
          minimum: 1
        status:
          type: string
          enum: [draft, published, archived]
        hasUnpublishedChanges:
          type: boolean
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        firstPublishedAt:
          type: string
          format: date-time
          nullable: true
        lastPublishedAt:
          type: string
          format: date-time
          nullable: true
        archivedAt:
          type: string
          format: date-time
          nullable: true
    GrantEditorialItem:
      allOf:
        - $ref: '#/components/schemas/EditorialMetadata'
        - type: object
          required: [draft, published]
          properties:
            draft:
              $ref: '#/components/schemas/GrantInput'
            published:
              $ref: '#/components/schemas/GrantInput'
              nullable: true
    JobEditorialItem:
      allOf:
        - $ref: '#/components/schemas/EditorialMetadata'
        - type: object
          required: [draft, published]
          properties:
            draft:
              $ref: '#/components/schemas/JobInput'
            published:
              $ref: '#/components/schemas/JobInput'
              nullable: true
    GrantPublicList:
      type: object
      required: [items]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/GrantInput'
    GrantPublicDetail:
      type: object
      required: [item]
      properties:
        item:
          $ref: '#/components/schemas/GrantInput'
    JobPublicList:
      type: object
      required: [items]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/JobInput'
    JobPublicDetail:
      type: object
      required: [item]
      properties:
        item:
          $ref: '#/components/schemas/JobInput'
    GrantEditorialList:
      type: object
      required: [items]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/GrantEditorialItem'
    GrantEditorialDetail:
      type: object
      required: [item]
      properties:
        item:
          $ref: '#/components/schemas/GrantEditorialItem'
    JobEditorialList:
      type: object
      required: [items]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/JobEditorialItem'
    JobEditorialDetail:
      type: object
      required: [item]
      properties:
        item:
          $ref: '#/components/schemas/JobEditorialItem'
    GrantCreate:
      type: object
      additionalProperties: false
      required: [item]
      properties:
        item:
          $ref: '#/components/schemas/GrantInput'
    GrantWrite:
      type: object
      additionalProperties: false
      required: [item, baseVersion]
      properties:
        item:
          $ref: '#/components/schemas/GrantInput'
        baseVersion:
          type: integer
          minimum: 1
    JobCreate:
      type: object
      additionalProperties: false
      required: [item]
      properties:
        item:
          $ref: '#/components/schemas/JobInput'
    JobWrite:
      type: object
      additionalProperties: false
      required: [item, baseVersion]
      properties:
        item:
          $ref: '#/components/schemas/JobInput'
        baseVersion:
          type: integer
          minimum: 1
    VersionWrite:
      type: object
      additionalProperties: false
      required: [baseVersion]
      properties:
        baseVersion:
          type: integer
          minimum: 1
    EditorialRestore:
      type: object
      additionalProperties: false
      required: [revisionId, baseVersion]
      properties:
        revisionId:
          type: string
          minLength: 1
        baseVersion:
          type: integer
          minimum: 1
    EditorialRevisionSummary:
      type: object
      required: [id, action, createdAt, createdBy]
      properties:
        id:
          type: string
        action:
          type: string
          enum: [initial, publish, backup, archive]
        createdAt:
          type: string
          format: date-time
        createdBy:
          $ref: '#/components/schemas/AdminUser'
    EditorialRevisionList:
      type: object
      required: [revisions]
      properties:
        revisions:
          type: array
          items:
            $ref: '#/components/schemas/EditorialRevisionSummary'
    DocumentUpload:
      type: object
      additionalProperties: false
      required: [ownerType, ownerId, baseVersion, title, description, pages, kind, file]
      properties:
        ownerType:
          type: string
          enum: [grants, jobs]
        ownerId:
          type: string
          minLength: 1
          maxLength: 160
        baseVersion:
          type: integer
          minimum: 1
        title:
          type: string
          minLength: 1
          maxLength: 220
        description:
          type: string
          maxLength: 600
        pages:
          type: integer
          minimum: 1
          maximum: 10000
          nullable: true
        kind:
          type: string
          enum: [bases, formulario, listado, resolucion, resultado, otro]
        file:
          type: string
          format: binary
    DocumentUploadResult:
      type: object
      required: [document, item]
      properties:
        document:
          $ref: '#/components/schemas/EditorialDocument'
        item:
          oneOf:
            - $ref: '#/components/schemas/GrantEditorialItem'
            - $ref: '#/components/schemas/JobEditorialItem'
'''

parameters = r'''    EditorialId:
      name: id
      in: path
      required: true
      schema:
        type: string
        minLength: 1
        maxLength: 160
    DocumentId:
      name: documentId
      in: path
      required: true
      schema:
        type: string
        minLength: 1
        maxLength: 180
'''

requirements = requirements_path.read_text(encoding="utf-8")
marker = "\n## Ampliacion obligatoria: Ayudas, Empleo y documentos\n"
if marker in requirements:
    requirements = requirements.split(marker)[0].rstrip() + expansion
else:
    requirements = requirements.rstrip() + expansion
requirements_path.write_text(requirements, encoding="utf-8")

spec = openapi_path.read_text(encoding="utf-8")
start = spec.find("  /api/public/grants:\n")
if start >= 0:
    spec = spec[:start].rstrip() + "\n" + spec[spec.index("components:\n", start):]
spec = spec.replace("components:\n  securitySchemes:", paths + "components:\n  securitySchemes:", 1)
if "\n  parameters:\n    EditorialId:" not in spec:
    spec = spec.replace("  responses:\n    Error:", "  parameters:\n" + parameters + "  responses:\n    Error:", 1)
schema_start = spec.find("    EditorialDocument:\n")
if schema_start >= 0:
    spec = spec[:schema_start].rstrip() + "\n"
spec = spec.rstrip() + "\n" + schemas
spec = spec.replace("version: 1.0.0", "version: 1.1.0", 1)
openapi_path.write_text(spec, encoding="utf-8")
print("Contrato ampliado aplicado correctamente")
