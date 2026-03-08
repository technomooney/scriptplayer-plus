const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const glob = require('path')

// Find rcedit in electron-builder cache
const cacheDir = path.join(process.env.LOCALAPPDATA || '', 'electron-builder', 'Cache', 'winCodeSign')
let rceditPath = null

if (fs.existsSync(cacheDir)) {
  for (const entry of fs.readdirSync(cacheDir)) {
    const candidate = path.join(cacheDir, entry, 'rcedit-x64.exe')
    if (fs.existsSync(candidate)) {
      rceditPath = candidate
      break
    }
  }
}

if (!rceditPath) {
  console.log('[set-icon] rcedit not found, skipping icon update')
  process.exit(0)
}

const exe = path.join(__dirname, '..', 'release', 'win-unpacked', 'ScriptPlayerPlus.exe')
const ico = path.join(__dirname, '..', 'public', 'icon.ico')

if (!fs.existsSync(exe)) {
  console.log('[set-icon] exe not found:', exe)
  process.exit(0)
}

console.log('[set-icon] Applying icon to', exe)
execSync(`"${rceditPath}" "${exe}" --set-icon "${ico}"`, { stdio: 'inherit' })
console.log('[set-icon] Done!')
