import { NextResponse, NextRequest } from 'next/server';
import { FeishuClient } from '@/lib/feishu';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json(
      { error: 'Invalid request, missing code or state' },
      { status: 400 }
    );
  }

  try {
    const config = await prisma.feishuSyncConfig.findUnique({
      where: { id: state },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Config not found' },
        { status: 404 }
      );
    }

    const feishuClient = new FeishuClient(config.appId, config.appSecret);
    const redirectUri = `${request.nextUrl.origin}/api/feishu/callback`;
    const tokens = await feishuClient.exchangeCodeForToken(code, redirectUri);

    await prisma.feishuSyncConfig.update({
      where: { id: state },
      data: {
        userAccessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpireTime: tokens.expireTime,
      },
    });

    return NextResponse.redirect(`${request.nextUrl.origin}/admin?auth=success`);
  } catch (error) {
    console.error('Error in Feishu OAuth callback:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/admin?auth=error`);
  }
}
