import { put, get, del, list }import { put, get, del, list } from '@vercel/blob';

export async functionimport { put, get, del, list } from '@vercel/blob';

export async function saveFileToBlob(type: string, filename:import { put, get, del, list } from '@vercel/blob';

export async function saveFileToBlob(type: string, filename: string, content: string): Promise<string> {
  const blobPath = `${type}/${filename