import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { saveFile, readFile, deleteFile, generateFilename } from '@/lib/storage';

interface MCPRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export async function POST(request: Request) {
  try {
    const body: MCPRequest = await request.json();
    const { method, params, id } = body;

    let result: unknown;
    const typedParams = params as unknown;

    switch (method) {
      case 'reports/list':
        result = await listReports(typedParams as ListReportsParams);
        break;
      case 'reports/get':
        result = await getReport(typedParams as GetReportParams);
        break;
      case 'reports/create':
        result = await createReport(typedParams as CreateReportParams);
        break;
      case 'reports/update':
        result = await updateReport(typedParams as UpdateReportParams);
        break;
      case 'reports/delete':
        result = await deleteReport(typedParams as DeleteReportParams);
        break;
      case 'reports/read_content':
        result = await readReportContent(typedParams as ReadReportContentParams);
        break;
      case 'reports/search':
        result = await searchReports(typedParams as SearchReportsParams);
        break;
      default:
        return NextResponse.json(
          createErrorResponse(id, -32601, 'Method not found'),
          { status: 404 }
        );
    }

    return NextResponse.json(createSuccessResponse(id, result));
  } catch (error) {
    console.error('MCP API error:', error);
    return NextResponse.json(
      createErrorResponse(null, -32603, 'Internal error', error),
      { status: 500 }
    );
  }
}

async function listReports(params?: ListReportsParams) {
  const { type, topic, limit = 50, offset = 0 } = params || {};

  const where: Record<string, unknown> = {};
  if (type && type !== 'all') {
    where.type = type;
  }
  if (topic && topic !== 'all') {
    where.topic = topic;
  }

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createTime: 'desc' },
    take: limit,
    skip: offset,
  });

  const total = await prisma.report.count({ where });

  return {
    reports,
    total,
    limit,
    offset,
  };
}

async function getReport(params: GetReportParams) {
  const { id } = params;
  if (!id) {
    throw new Error('id is required');
  }

  const report = await prisma.report.findUnique({
    where: { id },
  });

  if (!report) {
    throw new Error('Report not found');
  }

  return report;
}

async function createReport(params: CreateReportParams) {
  const { title, type, topic, content, source = 'api', sourceId } = params;

  if (!title || !type || !topic || !content) {
    throw new Error('title, type, topic, and content are required');
  }

  const typeText = type === 'day' ? '日报' : type === 'week' ? '周报' : '月报';
  const filename = generateFilename(title);
  const filePath = await saveFile(type, filename, content);

  const report = await prisma.report.create({
    data: {
      title,
      type,
      typeText,
      topic,
      filePath,
      source,
      sourceId,
    },
  });

  return report;
}

async function updateReport(params: UpdateReportParams) {
  const { id, title, type, topic, content } = params;

  if (!id) {
    throw new Error('id is required');
  }

  const existing = await prisma.report.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Report not found');
  }

  const data: Record<string, unknown> = {};
  if (title) data.title = title;
  if (topic) data.topic = topic;
  if (type) {
    data.type = type;
    data.typeText = type === 'day' ? '日报' : type === 'week' ? '周报' : '月报';
  }
  if (content) {
    const filename = generateFilename(title || existing.title);
    data.filePath = await saveFile(type || existing.type, filename, content);
  }

  const report = await prisma.report.update({
    where: { id },
    data,
  });

  return report;
}

async function deleteReport(params: DeleteReportParams) {
  const { id } = params;

  if (!id) {
    throw new Error('id is required');
  }

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    throw new Error('Report not found');
  }

  // 删除文件
  try {
    await deleteFile(report.filePath);
  } catch (error) {
    console.error('Failed to delete file:', error);
  }

  await prisma.report.delete({ where: { id } });

  return { success: true, message: 'Report deleted' };
}

async function readReportContent(params: ReadReportContentParams) {
  const { id } = params;

  if (!id) {
    throw new Error('id is required');
  }

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    throw new Error('Report not found');
  }

  const content = await readFile(report.filePath);

  return {
    report,
    content,
  };
}

async function searchReports(params: SearchReportsParams) {
  const { keyword, type, topic, limit = 50 } = params || {};

  let reports = await prisma.report.findMany({
    orderBy: { createTime: 'desc' },
  });

  if (type && type !== 'all') {
    reports = reports.filter(r => r.type === type);
  }

  if (topic && topic !== 'all') {
    reports = reports.filter(r => r.topic === topic);
  }

  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    reports = reports.filter(
      r => r.title.toLowerCase().includes(lowerKeyword) || 
           r.topic.toLowerCase().includes(lowerKeyword)
    );
  }

  return {
    reports: reports.slice(0, limit),
    total: reports.length,
  };
}

function createSuccessResponse(id: string | number | null | undefined, result: unknown): MCPResponse {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

function createErrorResponse(
  id: string | number | null | undefined,
  code: number,
  message: string,
  data?: unknown
): MCPResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data,
    },
  };
}

interface ListReportsParams {
  type?: string;
  topic?: string;
  limit?: number;
  offset?: number;
}

interface GetReportParams {
  id: string;
}

interface CreateReportParams {
  title: string;
  type: string;
  topic: string;
  content: string;
  source?: string;
  sourceId?: string;
}

interface UpdateReportParams {
  id: string;
  title?: string;
  type?: string;
  topic?: string;
  content?: string;
}

interface DeleteReportParams {
  id: string;
}

interface ReadReportContentParams {
  id: string;
}

interface SearchReportsParams {
  keyword?: string;
  type?: string;
  topic?: string;
  limit?: number;
}
