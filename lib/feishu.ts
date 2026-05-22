interface FeishuTokenResponse {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

interface FeishuListFilesResponse {
  code: number;
  msg: string;
  data?: {
    files: Array<{
      token: string;
      title: string;
      type: string;
      parent_token: string;
      create_time: string;
      update_time: string;
    }>;
    has_more?: boolean;
    page_token?: string;
  };
}

interface FeishuDocxContentResponse {
  code: number;
  msg: string;
  data?: {
    content: string;
  };
}

export class FeishuClient {
  private appId: string;
  private appSecret: string;
  private userAccessToken?: string;
  private tenantAccessToken: string | null = null;
  private tokenExpireTime: number = 0;

  constructor(appId: string, appSecret: string, userAccessToken?: string) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.userAccessToken = userAccessToken;
  }

  getOAuthUrl(redirectUri: string, state: string = ''): string {
    const url = new URL('https://open.feishu.cn/open-apis/authen/v1/authorize');
    url.searchParams.set('app_id', this.appId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'drive:drive docx:document');
    if (state) {
      url.searchParams.set('state', state);
    }
    return url.toString();
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expireTime: Date;
  }> {
    const response = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.appId,
        client_secret: this.appSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const data: FeishuTokenResponse = await response.json();
    if (data.code !== 0) {
      throw new Error(`Failed to exchange code: ${data.msg}`);
    }

    if (!data.access_token || !data.refresh_token || !data.expires_in) {
      throw new Error('Invalid token response');
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expireTime: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async refreshUserToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expireTime: Date;
  }> {
    const response = await fetch('https://open.feishu.cn/open-apis/authen/v1/refresh_access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: this.appId,
        client_secret: this.appSecret,
        refresh_token: refreshToken,
      }),
    });

    const data: FeishuTokenResponse = await response.json();
    if (data.code !== 0) {
      throw new Error(`Failed to refresh token: ${data.msg}`);
    }

    if (!data.access_token || !data.refresh_token || !data.expires_in) {
      throw new Error('Invalid token response');
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expireTime: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  private async getTenantAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.tenantAccessToken && now < this.tokenExpireTime) {
      return this.tenantAccessToken;
    }

    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: this.appId,
        app_secret: this.appSecret,
      }),
    });

    const data: FeishuTokenResponse = await response.json();
    if (data.code !== 0) {
      throw new Error(`Failed to get tenant access token: ${data.msg}`);
    }

    this.tenantAccessToken = data.tenant_access_token || null;
    this.tokenExpireTime = now + (data.expire || 7200) * 1000 - 60000;

    if (!this.tenantAccessToken) {
      throw new Error('No tenant access token received');
    }

    return this.tenantAccessToken;
  }

  private async getAccessToken(): Promise<string> {
    if (this.userAccessToken) {
      return this.userAccessToken;
    }
    return this.getTenantAccessToken();
  }

  async listFiles(folderToken?: string): Promise<Array<{
    token: string;
    title: string;
    type: string;
    updateTime: string;
  }>> {
    const token = await this.getAccessToken();
    const allFiles: Array<{
      token: string;
      title: string;
      type: string;
      updateTime: string;
    }> = [];
    let hasMore = true;
    let pageToken = '';

    while (hasMore) {
      const url = new URL('https://open.feishu.cn/open-apis/drive/v1/files');
      if (folderToken) {
        url.searchParams.set('folder_token', folderToken);
      }
      if (pageToken) {
        url.searchParams.set('page_token', pageToken);
      }
      url.searchParams.set('page_size', '100');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: FeishuListFilesResponse = await response.json();
      if (data.code !== 0) {
        throw new Error(`Failed to list files: ${data.msg}`);
      }

      const files = data.data?.files || [];
      allFiles.push(...files.map(file => ({
        token: file.token,
        title: file.title,
        type: file.type,
        updateTime: file.update_time,
      })));

      hasMore = !!data.data?.has_more;
      pageToken = data.data?.page_token || '';
    }

    return allFiles;
  }

  async getDocxContent(docToken: string): Promise<string> {
    const token = await this.getAccessToken();

    const response = await fetch(`https://open.feishu.cn/open-apis/docx/v1/documents/${docToken}/raw_content`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: FeishuDocxContentResponse = await response.json();
    if (data.code !== 0) {
      throw new Error(`Failed to get document content: ${data.msg}`);
    }

    return data.data?.content || '';
  }
}
