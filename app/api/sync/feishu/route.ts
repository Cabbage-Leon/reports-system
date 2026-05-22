import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { syncService } from '@/lib/sync-service';
import { FeishuClient } from '@/lib/feishu';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, configId, ...configData } = body;

  try {
    if (action === 'create') {
      const { appId, appSecret, folderToken, syncTime, syncRange, syncDays, fileTypes, reportType, topic, enabled } = configData;

      if (!appId || !appSecret) {
        return NextResponse.json({ error: 'appId and appSecret are required' }, { status: 400 });
      }

      let parsedFileTypes: string[] = ['html', 'md'];
      if (fileTypes) {
        if (Array.isArray(fileTypes)) {
          parsedFileTypes = fileTypes.filter(t => t && typeof t === 'string');
        } else if (typeof fileTypes === 'string') {
          parsedFileTypes = fileTypes.split(',').map(t => t.trim()).filter(t => t);
        }
      }

      const createData: any = {
        appId,
        appSecret,
        folderToken: folderToken || null,
        syncTime: syncTime || '09:00',
        syncRange: syncRange || 'today',
        syncDays: syncDays ? parseInt(syncDays) : 1,
        fileTypes: parsedFileTypes.length > 0 ? parsedFileTypes : ['html', 'md'],
        reportType: reportType || 'day',
        topic: topic || '飞书同步',
        enabled: enabled !== undefined ? enabled : true,
      };

      if (configData.customStartDate) {
        createData.customStartDate = new Date(configData.customStartDate);
      }
      if (configData.customEndDate) {
        createData.customEndDate = new Date(configData.customEndDate);
      }

      const config = await prisma.feishuSyncConfig.create({
        data: createData,
      });

      return NextResponse.json(config, { status: 201 });
    }

    if (action === 'get-auth-url') {
      if (!configId) {
        return NextResponse.json({ error: 'configId is required' }, { status: 400 });
      }
      const config = await prisma.feishuSyncConfig.findUnique({ where: { id: configId } });
      if (!config) {
        return NextResponse.json({ error: 'Config not found' }, { status: 404 });
      }
      const feishuClient = new FeishuClient(config.appId, config.appSecret);
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;
      const redirectUri = `${baseUrl}/api/feishu/callback`;
      const authUrl = feishuClient.getOAuthUrl(redirectUri, configId);
      return NextResponse.json({ url: authUrl });
    }

    if (action === 'sync') {
      if (!configId) {
        return NextResponse.json({ error: 'configId is required' }, { status: 400 });
      }
      const result = await syncService.syncFromFeishu(configId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const configs = await prisma.feishuSyncConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Sync GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const updateData: any = { ...data };
    if (updateData.syncDays !== undefined) {
      updateData.syncDays = parseInt(updateData.syncDays as string, 10);
    }

    if (updateData.customStartDate) {
      updateData.customStartDate = new Date(updateData.customStartDate);
    }
    if (updateData.customEndDate) {
      updateData.customEndDate = new Date(updateData.customEndDate);
    }

    const config = await prisma.feishuSyncConfig.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(config);
  } catch (error) {
    console.error('Update config error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    await prisma.feishuSyncConfig.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Config deleted' });
  } catch (error) {
    console.error('Delete config error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
