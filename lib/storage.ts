import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export function ensureUploadDir(type: string): string {
  const typeDir = path.join(UPLOAD_DIR, type)
  console.log('[Storage] Ensuring upload directory:', typeDir)
  console.log('[Storage] UPLOAD_DIR exists:', fs.existsSync(UPLOAD_DIR))
  
  try {
    if (!fs.existsSync(typeDir)) {
      console.log('[Storage] Creating directory:', typeDir)
      fs.mkdirSync(typeDir, { recursive: true })
      console.log('[Storage] Directory created successfully')
    }
    return typeDir
  } catch (error) {
    console.error('[Storage] Failed to create directory:', typeDir, error)
    throw error
  }
}

export function saveFile(type: string, filename: string, content: string): string {
  console.log('[Storage] Saving file:', { type, filename, contentLength: content.length })
  
  try {
    const dir = ensureUploadDir(type)
    const filePath = path.join(dir, filename)
    console.log('[Storage] File path:', filePath)
    console.log('[Storage] Writing file...')
    
    fs.writeFileSync(filePath, content)
    console.log('[Storage] File saved successfully:', filePath)
    
    const stats = fs.statSync(filePath)
    console.log('[Storage] File stats:', { size: stats.size, createdAt: stats.birthtime })
    
    return filePath
  } catch (error) {
    console.error('[Storage] Failed to save file:', filename, error)
    throw error
  }
}

export function readFile(filePath: string): string {
  console.log('[Storage] Reading file:', filePath)
  return fs.readFileSync(filePath, 'utf-8')
}

export function deleteFile(filePath: string): void {
  console.log('[Storage] Deleting file:', filePath)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    console.log('[Storage] File deleted successfully')
  }
}

export function generateFilename(title: string): string {
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
  const filename = `${Date.now()}_${sanitizedTitle}.html`
  console.log('[Storage] Generated filename:', filename)
  return filename
}
