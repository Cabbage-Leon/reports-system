interface FeishuTokenResponse {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

interface FeishuFile {
  token: string;
  title?: string;
  name?: string;
  type: string;
  parent_token: string;
  create_time?: string;
  update_time?: string;
  modified_time?: string;
}

interface FeishuListFilesResponse {
  code: number;
  msg: string;
  data?: {
    files: FeishuFile[];
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

    const processFolder = async (currentFolderToken?: string) => {
      let hasMore = true;
      let pageToken = '';

      while (hasMore) {
        const url = new URL('https://open.feishu.cn/open-apis/drive/v1/files');
        if (currentFolderToken) {
          url.searchParams.set('folder_token', currentFolderToken);
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
        
        for (const file of files) {
          if (file.type === 'folder') {
            console.log(`递归遍历文件夹: ${file.name || file.title || 'Unnamed Folder'}`);
            await processFolder(file.token);
          } else {
            allFiles.push({
              token: file.token,
              title: file.name || file.title || 'Untitled',
              type: file.type,
              updateTime: file.modified_time || file.update_time || file.create_time || '',
            });
          }
        }

        hasMore = !!data.data?.has_more;
        pageToken = data.data?.page_token || '';
      }
    };

    await processFolder(folderToken);
    console.log('Total files found (including subfolders):', allFiles.length);
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

  async getFileContent(fileToken: string, fileType: string, fileName?: string): Promise<{ content: string; format: string }> {
    const token = await this.getAccessToken();
    const lowerFileName = (fileName || '').toLowerCase();

    // 根据文件名后缀判断格式
    if (lowerFileName.endsWith('.html') || lowerFileName.endsWith('.htm')) {
      return this.downloadFileAsText(fileToken, 'html');
    }
    
    if (lowerFileName.endsWith('.md') || lowerFileName.endsWith('.markdown')) {
      return this.downloadFileAsText(fileToken, 'markdown');
    }
    
    if (lowerFileName.endsWith('.txt')) {
      return this.downloadFileAsText(fileToken, 'text');
    }
    
    if (lowerFileName.endsWith('.pdf')) {
      return this.downloadFileAsBase64(fileToken, 'pdf');
    }
    
    if (lowerFileName.endsWith('.docx')) {
      try {
        const content = await this.getDocxContent(fileToken);
        return { content, format: 'markdown' };
      } catch (error) {
        console.error(`Failed to get docx content:`, error);
        return this.downloadFileAsText(fileToken, 'text');
      }
    }
    
    if (lowerFileName.endsWith('.doc')) {
      return this.downloadFileAsBase64(fileToken, 'doc');
    }
    
    if (lowerFileName.endsWith('.xlsx') || lowerFileName.endsWith('.xls') || lowerFileName.endsWith('.csv')) {
      return this.downloadFileAsText(fileToken, 'spreadsheet');
    }

    // 如果文件名没有后缀，根据飞书文件类型判断
    switch (fileType) {
      case 'docx':
        try {
          const content = await this.getDocxContent(fileToken);
          return { content, format: 'markdown' };
        } catch (error) {
          console.error(`Failed to get docx content:`, error);
          return { content: '', format: 'text' };
        }
      
      case 'sheet':
        return this.downloadFileAsText(fileToken, 'spreadsheet');
      
      case 'pdf':
        return this.downloadFileAsBase64(fileToken, 'pdf');
      
      case 'doc':
        return this.downloadFileAsBase64(fileToken, 'doc');
      
      case 'bitable':
      case 'mindnote':
        return { content: `不支持预览 ${fileType} 类型的文件`, format: 'text' };
      
      case 'file':
      default:
        return this.downloadFileAsText(fileToken, 'text');
    }
  }

  private async downloadFileAsText(fileToken: string, format: string): Promise<{ content: string; format: string }> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(
        `https://open.feishu.cn/open-apis/drive/v1/files/${fileToken}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      return { content: text, format };
    } catch (error) {
      console.error(`Failed to download file as text:`, error);
      return { content: '', format };
    }
  }

  private async downloadFileAsBase64(fileToken: string, format: string): Promise<{ content: string; format: string }> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(
        `https://open.feishu.cn/open-apis/drive/v1/files/${fileToken}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return { content: base64, format };
    } catch (error) {
      console.error(`Failed to download file as base64:`, error);
      return { content: '', format };
    }
  }
}
