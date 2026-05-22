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
      console.error('Config not found for state:', state);
      return NextResponse.redirect(`${request.nextUrl.origin}/admin?auth=error`);
    }

    const feishuClient = new FeishuClient(config.appId, config.appSecret);
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/api/feishu/callback`;
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
