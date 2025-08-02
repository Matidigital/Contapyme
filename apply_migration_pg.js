// Script para aplicar migraciones directamente a PostgreSQL
const fs = require('fs');
const path = require('path');

// No podemos usar pg directamente sin instalarlo, pero podemos generar el comando
const connectionString = 'postgresql://postgres.yttdnmokivtayeunlvlk:Matigol1@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

console.log('🔧 Configurando migración PostgreSQL...');

// Leer el archivo SQL
const sqlContent = fs.readFileSync(path.join(__dirname, 'setup_supabase.sql'), 'utf8');

console.log('📄 SQL leído exitosamente');
console.log('📊 Tamaño:', Math.round(sqlContent.length / 1024), 'KB');

// Guardar script para psql
const psqlScript = `-- Aplicar migraciones F29 Contapyme
-- Conexión: ${connectionString}

${sqlContent}`;

fs.writeFileSync(path.join(__dirname, 'migration_psql.sql'), psqlScript);

console.log('✅ Script SQL preparado en: migration_psql.sql');
console.log('');
console.log('🚀 OPCIONES PARA APLICAR:');
console.log('');
console.log('OPCIÓN 1 - Supabase SQL Editor (RECOMENDADO):');
console.log('1. Ve a: https://supabase.com/dashboard/project/yttdnmokivtayeunlvlk/sql');
console.log('2. Copia todo el contenido de setup_supabase.sql');
console.log('3. Pega en el editor y ejecuta');
console.log('');
console.log('OPCIÓN 2 - Comando psql (si tienes PostgreSQL instalado):');
console.log(`psql "${connectionString}" -f setup_supabase.sql`);
console.log('');
console.log('OPCIÓN 3 - Usar herramienta online:');
console.log('1. Ve a: https://www.pgadmin.org/download/');
console.log('2. O usa cualquier cliente PostgreSQL');
console.log(`3. Conecta con: ${connectionString}`);
console.log('4. Ejecuta el contenido de setup_supabase.sql');

// Intentar crear una versión simplificada para copy-paste manual
const statements = sqlContent
  .split(';')
  .filter(stmt => stmt.trim().length > 0)
  .map(stmt => stmt.trim());

console.log('');
console.log('📋 RESUMEN DE LO QUE SE VA A CREAR:');
console.log('- Tabla: f29_forms (formularios F29)');
console.log('- Tabla: f29_comparative_analysis (análisis comparativos)');
console.log('- Tabla: f29_insights_notifications (notificaciones)');
console.log('- Índices optimizados para performance');
console.log('- Triggers automáticos para cálculos');
console.log('- Funciones auxiliares');
console.log('');
console.log(`📊 Total: ${statements.length} comandos SQL`);