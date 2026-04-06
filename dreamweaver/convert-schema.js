const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Change provider
schema = schema.replace(/provider = "postgresql"/g, 'provider = "sqlite"');
// Change db url
schema = schema.replace(/env\("DATABASE_URL"\)/g, '"file:./dev.db"');

// Remove @db. annotations
schema = schema.replace(/ @db\.[a-zA-Z0-9_()]+/g, '');

// Convert Enums to Strings and remove Enum definitions
const enumRegex = /enum\s+([a-zA-Z0-9_]+)\s*\{([^}]*)\}/g;
let match;
const enums = {};
while ((match = enumRegex.exec(schema)) !== null) {
  enums[match[1]] = true;
}

schema = schema.replace(enumRegex, '');

for (const enumName in enums) {
  // Replace `field EnumName` with `field String`
  const fieldRegex = new RegExp(`(\\s+[a-zA-Z0-9_]+\\s+)${enumName}(\\s|\\?)`, 'g');
  schema = schema.replace(fieldRegex, `$1String$2`);
  
  // Replace `field EnumName[]` with `field String`
  const fieldArrayRegex = new RegExp(`(\\s+[a-zA-Z0-9_]+\\s+)${enumName}\\[\\]`, 'g');
  schema = schema.replace(fieldArrayRegex, `$1String`);
}

// Fix arrays for sqlite (sqlite doesn't support String[])
// e.g. aliases String[] -> aliases String
schema = schema.replace(/(\s+[a-zA-Z0-9_]+\s+)String\[\]/g, '$1String');

// Remove @db.JsonB
schema = schema.replace(/ @db\.JsonB/g, '');
// Change Json to String
schema = schema.replace(/(\s+[a-zA-Z0-9_]+\s+)Json(\?|\s)/g, '$1String$2');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema converted to SQLite');
