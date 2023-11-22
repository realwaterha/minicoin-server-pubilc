const fs = require('fs');

function loadQueries(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const queries = content.split(';').map(query => query.trim()).filter(Boolean);
  const namedQueries = {};
  queries.forEach(query => {
    const match = query.match(/--\s*name:\s*(\S+)/);
    if (match) {
      const name = match[1];
      namedQueries[name] = query.replace(/--\s*name:\s*(\S+)/, '').trim();
    }
  });
  return namedQueries;
}

module.exports = loadQueries;