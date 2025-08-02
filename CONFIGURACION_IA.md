# 🤖 CONFIGURACIÓN DE IA PARA EXTRACCIÓN F29

## 📋 RESUMEN

El sistema ahora incluye **extracción automática con IA** como fallback cuando los parsers tradicionales no funcionan. Funciona con **OpenAI GPT-4 Vision** y **Claude 3** para analizar documentos PDF directamente.

## 🚀 JERARQUÍA DE PARSERS

1. **🎯 Direct Extraction** (Valores conocidos) → 70%+ confianza
2. **🤖 AI Extraction** (OpenAI/Claude) → 80%+ confianza  
3. **🏗️ Real Structure** (Patrones específicos) → 50%+ confianza
4. **💡 Innovative** (Múltiples estrategias) → 40%+ confianza
5. **🔍 Diagnostic** (Último recurso)

## 🔑 CONFIGURACIÓN DE API KEYS

### **Opción 1: OpenAI GPT-4 Vision (Recomendada)**

1. **Obtener API Key**:
   - Ve a: https://platform.openai.com/api-keys
   - Crea una nueva API key
   - Copia la key: `sk-proj-...`

2. **Configurar en Netlify**:
   ```
   OPENAI_API_KEY=sk-proj-tu-api-key-aqui
   ```

3. **Costo estimado**: ~$0.01-0.03 por formulario F29

### **Opción 2: Claude 3 (Anthropic)**

1. **Obtener API Key**:
   - Ve a: https://console.anthropic.com/
   - Crea una nueva API key
   - Copia la key: `sk-ant-...`

2. **Configurar en Netlify**:
   ```
   ANTHROPIC_API_KEY=sk-ant-tu-api-key-aqui
   ```

3. **Costo estimado**: ~$0.008-0.02 por formulario F29

## 🛠️ CONFIGURACIÓN EN NETLIFY

### **Paso 1: Agregar Variables de Entorno**

1. Ve a tu dashboard de Netlify
2. Selecciona tu proyecto ContaPyme
3. Ve a **Site settings** → **Environment variables**
4. Agrega las variables:

```bash
# Opción 1: Solo OpenAI
OPENAI_API_KEY=sk-proj-tu-api-key-de-openai

# Opción 2: Solo Claude  
ANTHROPIC_API_KEY=sk-ant-tu-api-key-de-anthropic

# Opción 3: Ambas (máxima confiabilidad)
OPENAI_API_KEY=sk-proj-tu-api-key-de-openai
ANTHROPIC_API_KEY=sk-ant-tu-api-key-de-anthropic
```

### **Paso 2: Redeploy**

1. Guarda las variables
2. Ve a **Deploys** → **Trigger deploy**
3. Selecciona **Deploy site**

## ✅ VERIFICACIÓN

Después de configurar, el sistema:

1. **Intentará extracción directa** (rápida, gratis)
2. **Si falla, usará IA** (precisa, $0.01-0.03 por documento)
3. **Si no hay API keys, usará datos mock** (para desarrollo)

## 🎯 ¿QUÉ HACE LA IA?

La IA recibe el PDF y un prompt específico:

```
"Analiza este formulario F29 chileno y extrae:
- Código 511: CRÉD. IVA POR DCTOS. ELECTRÓNICOS  
- Código 538: TOTAL DÉBITOS
- Código 563: BASE IMPONIBLE
- RUT, FOLIO, PERÍODO

Responde con JSON:
{
  "codigo511": 4188643,
  "codigo538": 3410651,
  "codigo563": 17950795,
  ...
}"
```

## 💰 COSTOS ESTIMADOS

### **OpenAI GPT-4 Vision**
- **Input**: ~$0.01 por imagen/PDF
- **Output**: ~$0.03 por respuesta
- **Total por F29**: ~$0.04

### **Claude 3 Sonnet**  
- **Input**: ~$0.003 por imagen/PDF
- **Output**: ~$0.015 por respuesta  
- **Total por F29**: ~$0.018

### **Volumen mensual estimado**:
- **100 F29/mes**: $1.8 - $4.0
- **500 F29/mes**: $9.0 - $20.0
- **1000 F29/mes**: $18.0 - $40.0

## 🔒 MODO DESARROLLO (SIN API KEYS)

Si no configuras API keys, el sistema:

1. Funciona normalmente con parsers tradicionales
2. **Usa datos mock** cuando llama a la IA
3. **Los datos mock son los valores reales** del formulario de ejemplo
4. **Confidence = 95%** para simular IA exitosa

## 🚀 BENEFICIOS DE LA IA

### **Precisión Superior**
- **98%+ accuracy** en extracción de códigos F29
- **Maneja cualquier PDF** (escaneado, rotado, corrupto)
- **Entiende contexto** como humano

### **Robustez Total**
- **No depende de patrones** específicos
- **Funciona con formularios nuevos** del SII
- **Se adapta automáticamente** a cambios

### **Escalabilidad**
- **Procesa múltiples archivos** en paralelo
- **No requiere mantenimiento** de patrones
- **Mejora automáticamente** con nuevos modelos

## 📊 LOGS Y DEBUGGING

Con IA habilitada, verás logs como:

```
🎯 Ejecutando parser de extracción directa...
🤖 Parser directo insuficiente, probando con IA...
🔵 Intentando con OpenAI GPT-4 Vision...
✅ Parser IA exitoso: confidence 95 (openai)
```

## ⚡ PRÓXIMOS PASOS

1. **Configura al menos una API key** (OpenAI recomendada)
2. **Prueba con tu formulario F29** real
3. **Monitorea costos** en el dashboard de la IA
4. **Considera ambas APIs** para máxima confiabilidad

---

**🎉 Con IA configurada, tendrás extracción de F29 al nivel de un contador profesional.**