# Nestral Backend API Reference

Base URL: `/api/v1`

**Auth**
- **POST /auth/register**: Register a user. Auth: no. Body: `{ name, email, phone?, password }`. Response: created user + tokens.
- **POST /auth/login**: Login. Auth: no. Body: `{ emailOrPhone, password }`. Response: access + refresh tokens.
- **POST /auth/refresh**: Refresh tokens. Auth: yes (uses `authMiddleware`). Body: `{ refreshToken }`.
- **POST /auth/logout**: Logout current session. Auth: yes.
- **POST /auth/logout-all**: Logout all sessions. Auth: yes.

**Properties** (all routes require authentication)
- **POST /properties/**: Create property. Body: form-data fields for property metadata; files: `images` (up to 10). Response: created property.
- **GET /properties/**: List properties. Query: `status` optional (`active|inactive|rented|archived|pending`). Response: array of properties.
- **GET /properties/:id/details**: Get property with inspections. Response: property + inspections.
- **GET /properties/:id**: Get single property by id.
- **PUT /properties/:id**: Update property. Body: form-data; files: `images` (up to 10). Optional `imagesToDelete` (JSON stringified array) to remove images.
- **PUT /properties/:id/primary-image**: Set primary image. Body: `{ imageId }`.
- **PUT /properties/:id/reorder-images**: Reorder images. Body: `{ imageOrder: string[] }`.
- **DELETE /properties/:id**: Delete property.

**Inspections** (all routes require authentication)
- **GET /inspections/form-data**: Get data needed to create inspection (properties, types).
- **GET /inspections/form-data/inspectors?propertyId=...**: Get inspectors for a property.
- **POST /inspections/**: Create inspection. Body: inspection payload (see service for schema).
- **GET /inspections/**: List inspections (supports query filters via `req.query`).
- **GET /inspections/property/:propertyId**: Get inspections for a property. Query: `limit` optional.
- **GET /inspections/:id**: Get inspection by id.
- **PUT /inspections/:id**: Update inspection.
- **PATCH /inspections/:id/cancel**: Cancel inspection.
- **PATCH /inspections/:id/complete**: Mark inspection complete.
- **DELETE /inspections/:id**: Delete inspection.

Inspection element / photos (under `/inspections`)
- **GET /inspections/:inspectionId/checklist**: Get checklist for inspection.
- **GET /inspections/:inspectionId/progress**: Get inspection progress summary.
- **GET /inspections/:inspectionId/spaces/:spaceId/elements**: Get elements for a space within an inspection.
- **PATCH /inspections/:inspectionId/elements/:elementId**: Update an inspection element. Body: element update payload.
- **GET /inspections/:inspectionId/elements/:elementId/photos**: List photos for element.
- **POST /inspections/:inspectionId/elements/:elementId/photos**: Upload photos. files: `photos` (up to 10). Optional `comment` in body.
- **POST /inspections/photos/:photoId/self-comment**: Add a self comment to a specific photo. Body: `{ selfComment }`.
- **DELETE /inspections/:inspectionId/elements/:elementId/photos/:photoId**: Delete a photo.

**Layouts & Elements**
- **GET /layouts/:propertyId**: Get property layout for `propertyId`. Auth: yes.

Element routes (mounted under `/api/v1`)
- **GET /properties/:propertyId/elements**: Get elements by property.
- **GET /spaces/:spaceId/elements**: Get elements by space.
- **POST /spaces/:spaceId/elements**: Add element to space. Body: `{ name }`. files: `photos` (up to 10).
- **PUT /elements/:elementId**: Update element. Body: `{ name }`. files: `photos` (up to 10).
- **DELETE /elements/:elementId**: Delete element.
- **POST /elements/:elementId/reference-photos**: Upload reference photos. files: `photos` (up to 10).
- **DELETE /elements/:elementId/reference-photos/:photoId**: Delete reference photo.

**Spaces** (routes under `/api/v1/properties`)
- **POST /properties/:propertyId/spaces**: Create space. Body: `{ name, layoutId }`.
- **GET /properties/:propertyId/spaces**: List spaces for a property.
- **GET /properties/:propertyId/spaces/:spaceId**: Get space by id.
- **PATCH /properties/:propertyId/spaces/:spaceId**: Update space. Body: fields to update.
- **DELETE /properties/:propertyId/spaces/:spaceId**: Delete space.

---
Notes
- Auth middleware is applied on most non-auth routes; supply `Authorization: Bearer <accessToken>` header.
- Static file access: `/uploads/*` and `/reports/*` are served publicly.
- See route mounts in `src/app.ts` for exact prefixes: [src/app.ts](src/app.ts)
- For implementation details and request/response shapes, see controllers in `src/modules/*` (e.g. [src/modules/properties/property.controller.ts](src/modules/properties/property.controller.ts)).

If you want, I can:
- Generate example request bodies for each endpoint.
- Create a Postman collection or OpenAPI (swagger) spec from these routes.
