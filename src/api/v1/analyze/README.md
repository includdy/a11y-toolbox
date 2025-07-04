# Code Analysis Module

This module provides comprehensive code analysis functionality for the a11y-toolbox API. It analyzes source code snippets and returns basic metrics including line counts, character counts, and emptiness checks.

## 🚀 Features

- **Multi-language Support**: Works with any programming language or text content
- **Comprehensive Metrics**: Line count, character count, and emptiness detection
- **Type Safety**: Full TypeScript support with runtime validation
- **OpenAPI Integration**: Automatic API documentation generation
- **Error Handling**: Robust error handling with detailed error messages
- **Size Limits**: Configurable size limits to prevent abuse

## 📁 Module Structure

```
src/modules/analyze/
├── analyze.schema.ts    # TypeBox schemas and TypeScript types
├── analyze.service.ts   # Business logic and analysis functions
├── analyze.route.ts     # Fastify route definitions
├── analyze.test.ts      # Test documentation and examples
└── README.md           # This documentation
```

## 🔧 API Endpoint

### POST `/api/v1/analyze`

Analyzes source code and returns basic metrics.

#### Request Body

```json
{
  "code": "function hello() { return 'Hello, World!'; }"
}
```

#### Response

```json
{
  "lines": 1,
  "chars": 47,
  "is_empty": false
}
```

#### Error Responses

- **400 Bad Request**: Invalid input (missing or empty code)
- **413 Payload Too Large**: Code exceeds 100KB limit
- **500 Internal Server Error**: Server-side processing error

## 📊 Metrics Explained

### `lines`
- **Type**: Integer
- **Description**: Total number of lines in the code snippet
- **Includes**: Empty lines
- **Example**: `3` for a 3-line function

### `chars`
- **Type**: Integer
- **Description**: Total number of characters in the code snippet
- **Includes**: Whitespace characters
- **Example**: `47` for "function hello() { return 'Hello, World!'; }"

### `is_empty`
- **Type**: Boolean
- **Description**: Whether the code contains only whitespace characters
- **Example**: `true` for "   \n  \n  "

## 🛠️ Usage Examples

### JavaScript Function
```json
{
  "code": "function greet(name) {\n  return `Hello, ${name}!`;\n}"
}
```
**Response:**
```json
{
  "lines": 3,
  "chars": 52,
  "is_empty": false
}
```

### Python Code
```json
{
  "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)"
}
```
**Response:**
```json
{
  "lines": 4,
  "chars": 89,
  "is_empty": false
}
```

### Empty Code
```json
{
  "code": ""
}
```
**Response:**
```json
{
  "lines": 1,
  "chars": 0,
  "is_empty": true
}
```

## 🔍 OpenAPI Documentation

The module is fully integrated with Fastify's Swagger/OpenAPI documentation. Visit `/docs` in your browser to see:

- Interactive API documentation
- Request/response examples
- Schema validation rules
- Error response formats
- Try-it-out functionality

### Schema Features

- **Input Validation**: Ensures code is provided and within size limits
- **Type Safety**: Full TypeScript integration
- **Examples**: Multiple examples for different use cases
- **Error Handling**: Comprehensive error response schemas

## 🧪 Testing

The module includes comprehensive test documentation in `analyze.test.ts`:

- **Unit Tests**: Individual function testing
- **Schema Validation**: Input/output validation testing
- **Integration Tests**: End-to-end API testing
- **Edge Cases**: Empty code, whitespace-only, large inputs

### Running Tests

```bash
# Run manual tests
node src/modules/analyze/analyze.test.ts

# Or import and use the test functions
import { runManualTests } from './analyze.test.js';
runManualTests();
```

## 🔧 Development

### Adding New Metrics

1. Update `AnalyzeCodeOutSchema` in `analyze.schema.ts`
2. Implement calculation logic in `analyzeSnippet()` in `analyze.service.ts`
3. Add test cases in `analyze.test.ts`
4. Update this README with new metric documentation

### Extending Functionality

The service includes utility functions for future enhancements:

- `validateCodeSize()`: Custom size validation
- `getCodeStatistics()`: Detailed code statistics
- HTML tokenization support for advanced analysis

## 📋 API Specification

### Request Schema
```typescript
{
  code: string; // Required, 1-100000 characters
}
```

### Response Schema
```typescript
{
  lines: number;    // >= 0
  chars: number;    // >= 0
  is_empty: boolean;
}
```

### Error Schema
```typescript
{
  error: string;      // Human-readable error message
  statusCode: number; // HTTP status code (400-599)
}
```

## 🌐 Integration

This module is automatically loaded by Fastify's autoload plugin and integrates seamlessly with:

- **Fastify**: Route handling and validation
- **TypeBox**: Schema definition and validation
- **Swagger**: API documentation generation
- **TypeScript**: Type safety and IntelliSense

## 📝 Notes

- Maximum code size is 100KB to prevent abuse
- Line counting handles both Windows (`\r\n`) and Unix (`\n`) line endings
- Character counting includes all whitespace characters
- Empty detection considers only non-whitespace characters
- HTML tokenization is performed for future advanced features

## 🔗 Related

- [Fastify Documentation](https://fastify.dev/)
- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/) 