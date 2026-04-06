const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Fix Decimals
schema = schema.replace(/Decimal\s*, \d+\)/g, 'Decimal');
schema = schema.replace(/@default\(\d+\) @map\("[^"]+"\), \d+\)/g, '@default(0) @map("total_companion_hours")');

// Fix Enum Defaults
schema = schema.replace(/@default\((free|trialing|draft|outline|active|planted|medium|pending|system)\)/g, '@default("$1")');

// Replace Decimal with Float (since sqlite doesn't support Decimal)
schema = schema.replace(/Decimal/g, 'Float');

// Fix any other trailing `, 2)`
schema = schema.replace(/,\s*\d+\)/g, '');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Fixed syntax errors');
