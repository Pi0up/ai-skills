#!/usr/bin/env node
/**
 * Release preparation script called by semantic-release (@semantic-release/exec).
 *
 * Responsibilities:
 * 1. Synchronize version in plugin.json
 * 2. Synchronize version in pyproject.toml
 * 3. Package information-architecture-v<version>.zip containing the plugin suite
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const version = process.argv[2];
if (!version) {
  console.error('❌ Error: No version specified. Usage: node prepare-release.js <version>');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
console.log(`\n🚀 Preparing release for information-architecture v${version}...`);

// 1. Update plugin.json
const pluginJsonPath = path.join(rootDir, 'plugin.json');
if (fs.existsSync(pluginJsonPath)) {
  const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
  plugin.version = version;
  fs.writeFileSync(pluginJsonPath, JSON.stringify(plugin, null, 2) + '\n', 'utf8');
  console.log(`  ✅ Updated plugin.json -> version ${version}`);
}

// 2. Update pyproject.toml
const pyprojectPath = path.join(rootDir, 'pyproject.toml');
if (fs.existsSync(pyprojectPath)) {
  let pyproject = fs.readFileSync(pyprojectPath, 'utf8');
  pyproject = pyproject.replace(/(\bversion\s*=\s*")[^"]+(")/, `$1${version}$2`);
  fs.writeFileSync(pyprojectPath, pyproject, 'utf8');
  console.log(`  ✅ Updated pyproject.toml -> version ${version}`);
}

// 3. Package information-architecture-v<version>.zip
const zipName = `information-architecture-v${version}.zip`;
const zipPath = path.join(rootDir, zipName);
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

const itemsToZip = [
  'plugin.json',
  'pyproject.toml',
  'README.md',
  'LICENSE',
  'AGENTS.md',
  'skills',
  'ia_tools',
  'installer',
  'templates',
  'specs'
].filter(item => fs.existsSync(path.join(rootDir, item)));

console.log(`  📦 Packaging ${zipName}...`);

if (process.platform === 'win32') {
  const fileList = itemsToZip.map(item => `"${item}"`).join(', ');
  const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path ${fileList} -DestinationPath '${zipName}' -Force"`;
  cp.execSync(psCmd, { cwd: rootDir, stdio: 'inherit' });
} else {
  const fileList = itemsToZip.join(' ');
  cp.execSync(`zip -r "${zipName}" ${fileList}`, { cwd: rootDir, stdio: 'inherit' });
}

console.log(`  ✅ Successfully created ${zipName}`);
