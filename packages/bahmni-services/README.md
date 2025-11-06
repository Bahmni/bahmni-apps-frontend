# bahmni-services

## Bundler Configuration

When bundling this library in your application, you need to configure your bundler to define the `PUBLIC_URL` environment variable. This is required for the library to correctly resolve API endpoints.

### Example Configurations:

**Vite:**
```typescript
// vite.config.ts
export default defineConfig({
  define: {
    'process.env.PUBLIC_URL': '"/bahmni/"'
  }
});
```

Replace `"/bahmni/"` with your actual Bahmni installation path.