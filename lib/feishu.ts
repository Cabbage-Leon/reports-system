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
    console.log('FeishuClient exchangeCodeForToken called:', {
      hasAppId: !!this.appId,
      hasAppSecret: !!this.appSecret,
      appIdLength: this.appId?.length,
      codeLength: code?.length,
      redirectUri
    });

    if (!this.appId || !this.appSecret) {
      throw new Error('Missing app id or app secret');
    }

    const tenantAccessToken = await this.getTenantAccessToken();
    console.log('Got tenant access token successfully');

    const response = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tenantAccessToken}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const data: any = await response.json();
    console.log('Feishu exchange code response:', data);
    
    if (data.code !== 0) {
      console.error('Feishu exchange code failed:', data);
      throw new Error(`Failed to exchange code: ${data.msg}`);
    }

    const tokenData = data.data;
    console.log('Token data:', tokenData);
    
    if (!tokenData?.access_token || !tokenData?.refresh_token || !tokenData?.expires_in) {
      throw new Error('Invalid token response');
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expireTime: new Date(Date.now() + tokenData.expires_in * 1000),
    };
  }

  async refreshUserToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expireTime: Date;
  }> {
    const tenantAccessToken = await this.getTenantAccessToken();
    console.log('Got tenant access token for refresh');

    const response = await fetch('https://open.feishu.cn/open-apis/authen/v1/refresh_access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tenantAccessToken}`,
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data: any = await response.json();
    console.log('Feishu refresh token response:', data);
    
    if (data.code !== 0) {
      console.error('Feishu refresh token failed:', data);
      throw new Error(`Failed to refresh token: ${data.msg}`);
    }

    const tokenData = data.data;
    console.log('Refresh token data:', tokenData);
    
    if (!tokenData?.access_token || !tokenData?.refresh_token || !tokenData?.expires_in) {
      throw new Error('Invalid token response');
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expireTime: new Date(Date.now() + tokenData.expires_in * 1000),
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
      console.log('Raw files from Feishu API (first 5):', files.slice(0, 5));
      
      const filteredFiles = files.filter(file => file.type !== 'folder');
      console.log('Filtered files (excluding folders):', filteredFiles.length);
      
      allFiles.push(...filteredFiles.map(file => ({
        token: file.token,
        title: file.name || file.title || 'Untitled',
        type: file.type,
        updateTime: file.modified_time || file.update_time || file.create_time || '',
      })));

      hasMore = !!data.data?.has_more;
      pageToken = data.data?.page_token || '';
    }

    console.log('Total files returned:', allFiles.length);
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
