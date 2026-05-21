import { put, get, del, list } from '@vercel/blob';

const BLOB_STORE_NAME = 'reports-system';

export async function saveFile(type: string, filename: string, content: string): Promise<string> {
  console.log('[Storage] Saving file to Vercel Blob:', { type, filename, contentLength: content.length });
  
  const blobPath = `${type}/${filename}`;
  
  try {
    const result = await put(blobPath, content, {
      access: 'public',
      contentType: 'text/html',
    });
    
    console.log('[Storage] File saved successfully:', result.url);
    return result.url;
  } catch (error) {
    console.error('[Storage] Failed to save file:', filename, error);
    throw error;
  }
}

export async function readFile(filePath: string): Promise<string> {
  console.log('[Storage] Reading file:', filePath);
  
  try {
    const result = await get(filePath, { access: 'public' });
    if (!result || !result.stream) {
      throw new Error('File not found');
    }
    const buffer = await new Response(result.stream).arrayBuffer();
    return Buffer.from(buffer).toString('utf-8');
  } catch (error) {
    console.error('[Storage] Failed to read file:', filePath, error);
    throw error;
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  console.log('[Storage] Deleting file:', filePath);
  
  try {
    await del(filePath);
    console.log('[Storage] File deleted successfully');
  } catch (error) {
    console.error('[Storage] Failed to delete file:', filePath, error);
    throw error;
  }
}

export async function listFiles(type?: string): Promise<string[]> {
  console.log('[Storage] Listing files:', type);
  
  try {
    const prefix = type ? `${type}/` : '';
    const result = await list({ prefix });
    return result.blobs.map(blob => blob.url);
  } catch (error) {
    console.error('[Storage] Failed to list files:', error);
    throw error;
  }
}

export function generateFilename(title: string): string {
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
  const filename = `${Date.now()}_${sanitizedTitle}.html`;
  console.log('[Storage] Generated filename:', filename);
  return filename;
}