const { execSync } = require('child_process');
const fs = require('fs');

try {
  const commitHash = execSync('git rev-parse --short HEAD 2>/dev/null || echo "unknown"').toString().trim();
  const commitDate = execSync('git log -1 --format=%cd 2>/dev/null || echo "unknown"').toString().trim();
  const branch = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"').toString().trim();

  const versionInfo = {
    commitHash,
    commitDate,
    branch,
    buildTime: new Date().toISOString(),
    version: '1.0.0'
  };

  if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public', { recursive: true });
  }
  fs.writeFileSync('./public/version.json', JSON.stringify(versionInfo, null, 2));
  console.log('Version info generated:', versionInfo);
} catch (error) {
  console.error('Failed to generate version info:', error);
  const fallbackInfo = {
    commitHash: 'unknown',
    commitDate: 'unknown',
    branch: 'unknown',
    buildTime: new Date().toISOString(),
    version: '1.0.0'
  };
  if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public', { recursive: true });
  }
  fs.writeFileSync('./public/version.json', JSON.stringify(fallbackInfo, null, 2));
}
