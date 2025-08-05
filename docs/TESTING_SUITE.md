# 🧪 Testing Suite - ContaPYME

## 📋 Resumen Ejecutivo

El **Testing Suite** de ContaPYME proporciona una cobertura completa de pruebas para garantizar la calidad, estabilidad y confiabilidad del sistema. Implementa pruebas unitarias, de integración y de seguridad automatizadas.

## 🏗️ Arquitectura del Testing

### **Stack Tecnológico**
- **Vitest**: Framework de testing principal
- **Testing Library**: Utilidades para testing de React
- **jsdom**: Entorno DOM para testing
- **GitHub Actions**: CI/CD automatizado
- **Codecov**: Cobertura de código

### **Estructura de Directorios**
```
src/test/
├── setup.ts                 # Configuración global
├── utils.tsx               # Utilidades de testing
├── components/             # Tests de componentes
│   └── Dashboard.test.tsx
├── services/              # Tests de servicios
│   └── webhookService.test.ts
└── integration/           # Tests de integración
    └── workflows.test.ts
```

## 🚀 Configuración

### **Instalación de Dependencias**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom @vitest/ui happy-dom
```

### **Scripts Disponibles**
```bash
npm test              # Ejecutar tests en modo watch
npm run test:run      # Ejecutar tests una vez
npm run test:ui       # Interfaz visual de tests
npm run test:coverage # Generar reporte de cobertura
npm run test:watch    # Modo watch para desarrollo
```

### **Configuración de Vite**
```typescript
// vite.config.ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  css: true,
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/test/',
      '**/*.d.ts',
      '**/*.config.*',
      'dist/',
      'coverage/'
    ]
  }
}
```

## 📊 Tipos de Tests

### **1. Tests Unitarios**
**Propósito**: Probar funciones y componentes individuales

**Ejemplo**:
```typescript
describe('WebhookService', () => {
  it('debería retornar éxito cuando el servicio está disponible', async () => {
    const mockResponse = { success: true, message: 'Service healthy' };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await webhookService.healthCheck();
    expect(result.success).toBe(true);
  });
});
```

### **2. Tests de Integración**
**Propósito**: Probar flujos completos entre servicios

**Ejemplo**:
```typescript
describe('Flujo completo de facturación', () => {
  it('debería procesar una factura completa con stock y alertas', async () => {
    // 1. Emitir factura
    const facturaResult = await webhookService.emitirFactura(facturaData);
    expect(facturaResult.success).toBe(true);

    // 2. Actualizar stock
    const stockResult = await webhookService.actualizarStockDesdeFactura(stockData);
    expect(stockResult.success).toBe(true);

    // 3. Procesar alertas
    const alertasResult = await webhookService.procesarAlertasStock(alertaData);
    expect(alertasResult.success).toBe(true);
  });
});
```

### **3. Tests de Componentes**
**Propósito**: Probar renderizado y comportamiento de UI

**Ejemplo**:
```typescript
describe('Dashboard', () => {
  it('debería renderizar el título del dashboard', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
```

## 🔧 Utilidades de Testing

### **Render Helpers**
```typescript
// Render con autenticación
export const renderWithAuth = (ui, user = mockData.user) => {
  localStorage.setItem('user', JSON.stringify(user));
  return customRender(ui);
};

// Render sin autenticación
export const renderWithoutAuth = (ui) => {
  localStorage.clear();
  return customRender(ui);
};
```

### **Mock Data**
```typescript
export const mockData = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    empresa_id: 'test-empresa-id',
    role: 'admin',
  },
  empresa: {
    id: 'test-empresa-id',
    razon_social: 'Empresa Test S.A.',
    cuit: '20304050607',
  },
  // ... más datos de prueba
};
```

### **Mock Services**
```typescript
export const mockSupabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    // ... más mocks
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    // ... más mocks
  }),
};
```

## 🚀 CI/CD Integration

### **GitHub Actions Workflow**
```yaml
name: Test Suite
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 2 * * *'  # Diario a las 2 AM UTC

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm run test:run
    - name: Generate coverage
      run: npm run test:coverage
```

### **Cobertura de Código**
- **Objetivo**: >80% de cobertura
- **Reporte**: HTML, JSON, Text
- **Integración**: Codecov
- **Retención**: 30 días

## 📈 Métricas y Reportes

### **Cobertura de Tests**
```bash
npm run test:coverage
```

**Salida esperada**:
```
 ✓ src/test/components/Dashboard.test.tsx (5 tests) 1.2s
 ✓ src/test/services/webhookService.test.ts (12 tests) 2.1s
 ✓ src/test/integration/workflows.test.ts (8 tests) 3.4s

 Test Files  3 passed (3)
      Tests  25 passed (25)
   Start at  14:30:15
   Duration  6.7s (transform 1.2s, setup 0ms, collect 1.1s, tests 4.4s)

 % Coverage report from v8
----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------------|---------|----------|---------|---------|-------------------
All files            |   85.23 |    78.45 |   82.10 |   85.23 |                  
```

### **Reportes de Seguridad**
- **npm audit**: Vulnerabilidades de dependencias
- **TruffleHog**: Detección de secretos en código
- **audit-ci**: Verificación automática en CI

## 🎯 Mejores Prácticas

### **1. Naming Conventions**
```typescript
// ✅ Correcto
describe('WebhookService', () => {
  it('debería retornar éxito cuando el servicio está disponible', async () => {
    // test implementation
  });
});

// ❌ Incorrecto
describe('test webhook', () => {
  it('should work', async () => {
    // test implementation
  });
});
```

### **2. Arrange-Act-Assert Pattern**
```typescript
it('debería procesar datos correctamente', async () => {
  // Arrange - Preparar datos
  const testData = { id: 'test', value: 100 };
  const mockResponse = { success: true, data: testData };
  
  // Act - Ejecutar acción
  const result = await service.processData(testData);
  
  // Assert - Verificar resultado
  expect(result.success).toBe(true);
  expect(result.data).toEqual(testData);
});
```

### **3. Mock Management**
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});
```

### **4. Async Testing**
```typescript
it('debería manejar operaciones asíncronas', async () => {
  render(<AsyncComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

## 🔍 Debugging de Tests

### **Modo Debug**
```bash
# Ejecutar tests con debug
npm run test:ui

# Ejecutar test específico
npm test -- Dashboard.test.tsx

# Ejecutar con verbose
npm test -- --reporter=verbose
```

### **Logs de Testing**
```typescript
// Agregar logs para debugging
it('debería procesar datos', async () => {
  console.log('Test data:', testData);
  const result = await service.process(testData);
  console.log('Result:', result);
  expect(result.success).toBe(true);
});
```

## 📋 Checklist de Testing

### **Antes de Commit**
- [ ] Todos los tests pasan (`npm run test:run`)
- [ ] Cobertura >80% (`npm run test:coverage`)
- [ ] No hay vulnerabilidades (`npm audit`)
- [ ] Type checking pasa (`npm run type-check`)
- [ ] Linting pasa (`npm run lint`)

### **Para Nuevas Features**
- [ ] Tests unitarios para funciones nuevas
- [ ] Tests de integración para flujos nuevos
- [ ] Tests de componentes para UI nueva
- [ ] Mocks actualizados
- [ ] Documentación actualizada

### **Para Bug Fixes**
- [ ] Test que reproduce el bug
- [ ] Fix implementado
- [ ] Test verifica la solución
- [ ] Tests existentes siguen pasando

## 🚀 Próximos Pasos

### **Fase 1: Testing Básico** ✅
- [x] Configuración de Vitest
- [x] Tests unitarios básicos
- [x] Tests de integración
- [x] CI/CD básico

### **Fase 2: Testing Avanzado** 🔄
- [ ] Tests E2E con Playwright
- [ ] Tests de performance
- [ ] Tests de accesibilidad
- [ ] Tests de seguridad avanzados

### **Fase 3: Testing de Producción** 📋
- [ ] Tests de carga
- [ ] Tests de stress
- [ ] Tests de recuperación
- [ ] Monitoreo de tests en producción

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://react.dev/learn/testing)
- [GitHub Actions Testing](https://docs.github.com/en/actions/automating-builds-and-tests)

---

**🎯 Objetivo**: Garantizar que ContaPYME sea un sistema robusto, confiable y mantenible a través de testing automatizado y completo. 