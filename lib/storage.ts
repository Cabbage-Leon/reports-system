import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export function ensureUploadDir(type: string): string {
  const typeDir = path.join(UPLOAD_DIR, type)
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true })
  }
  return typeDir
}

export function saveFile(type: string, filename: string, content: string): string {
  const dir = ensureUploadDir(type)
  const filePath = path.join(dir, filename)
  fs.writeFileSync(filePath, content)
  return filePath
}

export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

export function generateFilename(title: string): string {
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
  return `${Date.now()}_${sanitizedTitle}.html`
}
