interface FeishuTokenResponse {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
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
  };
}

interface FeishuDocumentContentResponse {
  code: number;
  msg: string;
  data?: {
    content: string;
  };
}

export class FeishuClient {
  private appId: string;
  private appSecret: string;
  private tenantAccessToken: string | null = null;
  private tokenExpireTime: number = 0;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
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
    this.tokenExpireTime = now + (data.expire || 7200) * 1000 - 60000; // 提前 1 分钟刷新

    if (!this.tenantAccessToken) {
      throw new Error('No tenant access token received');
    }

    return this.tenantAccessToken;
  }

  async listFiles(folderToken?: string): Promise<Array<{
    token: string;
    title: string;
    type: string;
    updateTime: string;
  }>> {
    const token = await this.getTenantAccessToken();
    
    let url = 'https://open.feishu.cn/open-apis/drive/v1/files';
    if (folderToken) {
      url += `?folder_token=${folderToken}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: FeishuListFilesResponse = await response.json();
    if (data.code !== 0) {
      throw new Error(`Failed to list files: ${data.msg}`);
    }

    return (data.data?.files || []).map(file => ({
      token: file.token,
      title: file.title,
      type: file.type,
      updateTime: file.update_time,
    }));
  }

  async getDocumentContent(docToken: string): Promise<string> {
    const token = await this.getTenantAccessToken();

    const response = await fetch(`https://open.feishu.cn/open-apis/docx/v1/documents/${docToken}/raw_content`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: FeishuDocumentContentResponse = await response.json();
    if (data.code !== 0) {
      throw new Error(`Failed to get document content: ${data.msg}`);
    }

    return data.data?.content || '';
  }

  async getDocumentHtml(docToken: string): Promise<string> {
    const rawContent = await this.getDocumentContent(docToken);
    
    // 简单转换：将文本转换为 HTML
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    p { margin-bottom: 16px; }
  </style>
</head>
<body>
  <pre style="white-space: pre-wrap; word-wrap: break-word;">${rawContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;

    return htmlContent;
  }
}
