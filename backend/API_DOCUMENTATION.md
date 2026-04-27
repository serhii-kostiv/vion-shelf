# API Documentation

## Overview

VionShelf Backend API provides endpoints for user authentication, collection management, and media search functionality.

**Base URL**: `http://localhost:3000`

**Authentication**: Most endpoints require JWT authentication via Bearer token in Authorization header.

## Error Response Format

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-03-03T10:00:00.000Z",
  "path": "/api/collections"
}
```

### Common HTTP Status Codes

- `200 OK` - Successful GET/PATCH request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Validation error or invalid input
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource (e.g., email already exists)
- `500 Internal Server Error` - Server error

## Authentication

### Register

Create a new user account.

**Endpoint**: `POST /auth/register`

**Authentication**: None (public)

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe"
}
```

**Validation Rules**:

- `email`: Valid email format, required
- `password`: Min 8 characters, required
- `username`: Min 3 characters, required

**Response** (201 Created):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

### Login

Authenticate and receive access tokens.

**Endpoint**: `POST /auth/login`

**Authentication**: None (public)

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

### Refresh Token

Get a new access token using refresh token.

**Endpoint**: `POST /auth/refresh`

**Authentication**: Refresh token required

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout

Invalidate refresh token.

**Endpoint**: `POST /auth/logout`

**Authentication**: Required (Bearer token)

**Response** (200 OK):

```json
{
  "message": "Logged out successfully"
}
```

## Users

### Get Current User

Get authenticated user's profile.

**Endpoint**: `GET /users/me`

**Authentication**: Required

**Response** (200 OK):

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### Update User

Update user profile.

**Endpoint**: `PATCH /users/:id`

**Authentication**: Required (must be own profile)

**Request Body**:

```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

**Response** (200 OK):

```json
{
  "id": "uuid",
  "email": "newemail@example.com",
  "username": "newusername",
  "updatedAt": "2026-03-03T10:00:00.000Z"
}
```

## Collections

### List Collections

Get paginated list of user's collections.

**Endpoint**: `GET /collections`

**Authentication**: Required

**Query Parameters**:

- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10, max 100

**Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "My Favorite Movies",
      "slug": "my-favorite-movies",
      "description": "Collection of my all-time favorite films",
      "isPublic": true,
      "itemsCount": 15,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Get Collection

Get single collection with items.

**Endpoint**: `GET /collections/:id`

**Authentication**: Required (public collections) or Owner (private collections)

**Response** (200 OK):

```json
{
  "id": "uuid",
  "name": "My Favorite Movies",
  "slug": "my-favorite-movies",
  "description": "Collection of my all-time favorite films",
  "isPublic": true,
  "itemsCount": 2,
  "items": [
    {
      "id": "uuid",
      "position": 1,
      "notes": "Amazing cinematography",
      "media": {
        "id": "uuid",
        "externalId": "tt0111161",
        "type": "MOVIE",
        "title": "The Shawshank Redemption",
        "posterUrl": "https://..."
      }
    }
  ],
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### Create Collection

Create a new collection.

**Endpoint**: `POST /collections`

**Authentication**: Required

**Request Body**:

```json
{
  "name": "My Favorite Movies",
  "description": "Collection of my all-time favorite films",
  "isPublic": true
}
```

**Validation Rules**:

- `name`: Required, min 1 character
- `description`: Optional, string
- `isPublic`: Optional, boolean, default false

**Response** (201 Created):

```json
{
  "id": "uuid",
  "name": "My Favorite Movies",
  "slug": "my-favorite-movies",
  "description": "Collection of my all-time favorite films",
  "isPublic": true,
  "itemsCount": 0,
  "createdAt": "2026-03-03T10:00:00.000Z",
  "updatedAt": "2026-03-03T10:00:00.000Z"
}
```

### Update Collection

Update collection details.

**Endpoint**: `PATCH /collections/:id`

**Authentication**: Required (must be owner)

**Request Body**:

```json
{
  "name": "Updated Collection Name",
  "description": "Updated description",
  "isPublic": false
}
```

**Response** (200 OK):

```json
{
  "id": "uuid",
  "name": "Updated Collection Name",
  "slug": "updated-collection-name",
  "description": "Updated description",
  "isPublic": false,
  "itemsCount": 15,
  "updatedAt": "2026-03-03T10:00:00.000Z"
}
```

### Delete Collection

Delete a collection and all its items.

**Endpoint**: `DELETE /collections/:id`

**Authentication**: Required (must be owner)

**Response** (204 No Content)

### Add Item to Collection

Add a media item to collection.

**Endpoint**: `POST /collections/:id/items`

**Authentication**: Required (must be owner)

**Request Body**:

```json
{
  "media": {
    "externalId": "tt0111161",
    "type": "MOVIE",
    "title": "The Shawshank Redemption",
    "posterUrl": "https://...",
    "metadata": {
      "year": 1994,
      "director": "Frank Darabont"
    }
  },
  "notes": "Amazing cinematography",
  "position": 1
}
```

**Validation Rules**:

- `media.externalId`: Required, string
- `media.type`: Required, enum (MOVIE, TV_SHOW, BOOK, GAME)
- `media.title`: Required, string
- `media.posterUrl`: Optional, string
- `media.metadata`: Optional, object
- `notes`: Optional, string
- `position`: Optional, number

**Response** (201 Created):

```json
{
  "id": "uuid",
  "collectionId": "uuid",
  "mediaId": "uuid",
  "position": 1,
  "notes": "Amazing cinematography",
  "createdAt": "2026-03-03T10:00:00.000Z"
}
```

### Update Collection Item

Update item notes or position.

**Endpoint**: `PATCH /collections/:collectionId/items/:itemId`

**Authentication**: Required (must be owner)

**Request Body**:

```json
{
  "notes": "Updated notes",
  "position": 2
}
```

**Response** (200 OK):

```json
{
  "id": "uuid",
  "notes": "Updated notes",
  "position": 2,
  "updatedAt": "2026-03-03T10:00:00.000Z"
}
```

### Remove Item from Collection

Remove an item from collection.

**Endpoint**: `DELETE /collections/:collectionId/items/:itemId`

**Authentication**: Required (must be owner)

**Response** (204 No Content)

## Search

### Search Media

Search for movies, TV shows, books, or games.

**Endpoint**: `GET /search`

**Authentication**: Required

**Query Parameters**:

- `query` (required): Search term
- `type` (optional): Media type (MOVIE, TV_SHOW, BOOK, GAME)
- `limit` (optional): Results limit, default 10, max 40
- `provider` (optional): Provider name, default 'default'

**Response** (200 OK):

```json
[
  {
    "externalId": "tt0111161",
    "type": "MOVIE",
    "title": "The Shawshank Redemption",
    "posterUrl": "https://image.tmdb.org/t/p/w500/...",
    "metadata": {
      "year": 1994,
      "overview": "Two imprisoned men bond over...",
      "rating": 9.3
    }
  }
]
```

## Health Checks

### Basic Health Check

Check if API is running.

**Endpoint**: `GET /health`

**Authentication**: None (public)

**Response** (200 OK):

```json
{
  "status": "ok",
  "timestamp": "2026-03-03T10:00:00.000Z",
  "uptime": 3600.5
}
```

### Database Health Check

Check database connectivity.

**Endpoint**: `GET /health/db`

**Authentication**: None (public)

**Response** (200 OK):

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-03-03T10:00:00.000Z"
}
```

### External APIs Health Check

Check external API providers status.

**Endpoint**: `GET /health/external`

**Authentication**: None (public)

**Response** (200 OK):

```json
{
  "status": "ok",
  "apis": {
    "tmdb": {
      "status": "ok"
    },
    "googleBooks": {
      "status": "ok"
    }
  },
  "timestamp": "2026-03-03T10:00:00.000Z"
}
```

## Rate Limiting

Currently no rate limiting is implemented. This may be added in future versions.

## Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Paginated responses include:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```
