import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { syncService } from '@/lib/sync-service';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, configId, ...configData } = body;

  try {
    if (action === 'create') {
      const { appId, appSecret, folderToken, syncTime, syncRange, syncDays, reportType, topic, enabled } = configData;

      if (!appId || !appSecret) {
        return NextResponse.json({ error: 'appId and appSecret are required' }, { status: 400 });
      }

      const config = await prisma.feishuSyncConfig.create({
        data: {
          appId,
          appSecret,
          folderToken: folderToken || null,
          syncTime: syncTime || '09:00',
          syncRange: syncRange || 'today',
          syncDays: syncDays ? parseInt(syncDays) : 1,
          reportType: reportType || 'day',
          topic: topic || '飞书同步',
          enabled: enabled !== undefined ? enabled : true,
        },
      });

      return NextResponse.json(config, { status: 201 });
    }

    if (action === 'sync') {
      if (!configId) {
        return NextResponse.json({ error: 'configId is required' }, { status: 400 });
      }

      const result = await syncService.syncFeishuDocuments(configId);
      return NextResponse.json(result);
    }

    if (action === 'sync-all') {
      await syncService.syncAllEnabledConfigs();
      return NextResponse.json({ message: 'Sync all configs started' });
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
    // 定时任务触发的接口（可以使用 Vercel Cron 或其他定时服务）
    if (action === 'check-time') {
      await syncService.checkAndSyncTime();
      return NextResponse.json({ message: 'Time check completed' });
    }

    // 获取同步配置列表
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
    const config = await prisma.feishuSyncConfig.update({
      where: { id },
      data,
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
