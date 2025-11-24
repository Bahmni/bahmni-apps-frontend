
# @bahmni/services

## Description

A set of service utilities and API integration helpers that act as an abstraction layer for communicating with OpenMRS backend APIs.

## Bundler Configuration

When bundling this library in your application, you need to configure your bundler to define the `process.env` environment variable. 

### Example Configurations:

**Vite:**

```typescript
// vite.config.ts
  define: {
    'process.env': {}
  }
```