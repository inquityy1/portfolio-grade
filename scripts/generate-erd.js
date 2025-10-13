#!/usr/bin/env node

/**
 * Custom ERD Generator for Windows
 * Generates Mermaid ERD from Prisma schema without Puppeteer
 */

const fs = require('fs');
const path = require('path');

// Read Prisma schema
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Parse Prisma schema
function parsePrismaSchema(content) {
  const models = [];
  const enums = [];

  // Remove comments and clean up
  const cleanContent = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/^\s*$/gm, ''); // Remove empty lines

  // Extract enums
  const enumMatches = cleanContent.match(/enum\s+(\w+)\s*\{([^}]+)\}/g);
  if (enumMatches) {
    enumMatches.forEach(match => {
      const enumName = match.match(/enum\s+(\w+)/)[1];
      const enumValues = match
        .match(/\{([^}]+)\}/)[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.includes('@'))
        .map(line => line.replace(/,$/, ''));

      enums.push({ name: enumName, values: enumValues });
    });
  }

  // Extract models
  const modelMatches = cleanContent.match(/model\s+(\w+)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g);
  if (modelMatches) {
    modelMatches.forEach(match => {
      const modelName = match.match(/model\s+(\w+)/)[1];
      const modelBody = match.match(/\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/)[1];

      const fields = [];
      const relations = [];

      // Parse fields
      const fieldLines = modelBody
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('@@'));

      fieldLines.forEach(line => {
        if (line.includes('@relation')) {
          // This is a relation field
          const fieldMatch = line.match(/(\w+)\s+(\w+)/);
          if (fieldMatch) {
            const [, fieldName, fieldType] = fieldMatch;
            relations.push({ name: fieldName, type: fieldType });
          }
        } else if (
          line.includes('@id') ||
          line.includes('@unique') ||
          line.includes('@default') ||
          line.includes('@index')
        ) {
          // This is a field with attributes
          const fieldMatch = line.match(/(\w+)\s+(\w+)/);
          if (fieldMatch) {
            const [, fieldName, fieldType] = fieldMatch;
            fields.push({ name: fieldName, type: fieldType, isId: line.includes('@id') });
          }
        } else if (line.match(/^\w+\s+\w+/)) {
          // Simple field
          const fieldMatch = line.match(/(\w+)\s+(\w+)/);
          if (fieldMatch) {
            const [, fieldName, fieldType] = fieldMatch;
            fields.push({ name: fieldName, type: fieldType, isId: false });
          }
        }
      });

      models.push({ name: modelName, fields, relations });
    });
  }

  return { models, enums };
}

// Generate Mermaid ERD
function generateMermaidERD({ models, enums }) {
  let mermaid = 'erDiagram\n';

  // Add models
  models.forEach(model => {
    mermaid += `    ${model.name} {\n`;

    // Add fields
    model.fields.forEach(field => {
      const fieldType =
        field.type === 'String'
          ? 'string'
          : field.type === 'Int'
          ? 'int'
          : field.type === 'DateTime'
          ? 'datetime'
          : field.type === 'Boolean'
          ? 'boolean'
          : field.type === 'Json'
          ? 'json'
          : field.type.toLowerCase();

      const pk = field.isId ? ' PK' : '';
      mermaid += `        ${fieldType} ${field.name}${pk}\n`;
    });

    mermaid += '    }\n\n';
  });

  // Add relationships
  models.forEach(model => {
    model.relations.forEach(relation => {
      // Simple relationship detection
      const targetModel = models.find(m => m.name === relation.type);
      if (targetModel) {
        mermaid += `    ${model.name} ||--o{ ${targetModel.name} : "${relation.name}"\n`;
      }
    });
  });

  return mermaid;
}

// Main execution
try {
  console.log('🔍 Parsing Prisma schema...');
  const parsed = parsePrismaSchema(schemaContent);

  console.log(`📊 Found ${parsed.models.length} models and ${parsed.enums.length} enums`);

  console.log('🎨 Generating Mermaid ERD...');
  const mermaidERD = generateMermaidERD(parsed);

  // Write to file
  const outputPath = path.join(__dirname, '..', 'docs', 'generated-erd.mmd');
  fs.writeFileSync(outputPath, mermaidERD);

  console.log('✅ ERD generated successfully!');
  console.log(`📁 Output: ${outputPath}`);
  console.log('\n📋 Generated ERD:');
  console.log('─'.repeat(50));
  console.log(mermaidERD);
  console.log('─'.repeat(50));
} catch (error) {
  console.error('❌ Error generating ERD:', error.message);
  process.exit(1);
}
