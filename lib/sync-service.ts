import { FeishuClient } from './feishu';
import prisma from './prisma';
import { saveFile } from './storage';

type ReportTypeKey = 'day' | 'week' | 'month';

export class SyncService {
  private getDateRange(range: string, days?: number): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (range) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'this_week':
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        end = new Date();
        break;
      case 'custom':
        if (days) {
          const customDate = new Date();
          customDate.setDate(customDate.getDate() - days);
          start = customDate;
          start.setHours(0, 0, 0, 0);
        } else {
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        end = new Date();
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    return { start, end };
  }

  private isFileInRange(updateTime: string | undefined, startDate: Date, endDate: Date): boolean {
    if (!updateTime) {
      return false;
    }
    const fileUpdateTime = new Date(parseInt(updateTime) * 1000);
    return fileUpdateTime >= startDate && fileUpdateTime <= endDate;
  }

  private isFileTypeMatch(fileName: string | undefined, allowedTypes: string[]): boolean {
    if (!allowedTypes || allowedTypes.length === 0) {
      return true;
    }
    if (!fileName) {
      return false;
    }
    const lowerFileName = fileName.toLowerCase();
    return allowedTypes.some(type => lowerFileName.endsWith(`.${type.toLowerCase()}`));
  }

  async syncFromFeishu(configId: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const config = await prisma.feishuSyncConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      throw new Error('Sync config not found');
    }

    let accessToken: string | undefined = config.userAccessToken ?? undefined;
    if (accessToken && config.tokenExpireTime && new Date() > config.tokenExpireTime) {
      const feishuClient = new FeishuClient(config.appId, config.appSecret);
      if (config.refreshToken) {
        try {
          const newTokens = await feishuClient.refreshUserToken(config.refreshToken);
          await prisma.feishuSyncConfig.update({
            where: { id: configId },
            data: {
              userAccessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
              tokenExpireTime: newTokens.expireTime,
            },
          });
          accessToken = newTokens.accessToken;
        } catch (error) {
          console.error('Failed to refresh token:', error);
          accessToken = undefined;
        }
      }
    }

    const feishuClient = new FeishuClient(config.appId, config.appSecret, accessToken);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      console.log('开始同步，配置信息:', {
        folderToken: config.folderToken || '(未设置，获取所有文件)',
        syncRange: config.syncRange,
        syncDays: config.syncDays,
        fileTypes: config.fileTypes,
        hasUserToken: !!accessToken,
      });

      const files = await feishuClient.listFiles(config.folderToken || undefined);
      console.log(`从飞书获取到 ${files.length} 个文件`);

      const dateRange = this.getDateRange(config.syncRange, config.syncDays);
      console.log(`同步时间范围: ${dateRange.start.toLocaleString()} 至 ${dateRange.end.toLocaleString()}`);

      console.log('文件数据样本 (前3个):', files.slice(0, 3));
      
      const filteredFiles = files.filter(file => {
        const inRange = this.isFileInRange(file.updateTime, dateRange.start, dateRange.end);
        
        if (!inRange) {
          console.log(`跳过文件 "${file.title || 'unnamed'}": 不在时间范围内`);
        }

        return inRange;
      });

      console.log(`经过过滤，剩余 ${filteredFiles.length} 个文件待同步`);

      const existingReports = await prisma.report.findMany({
        where: {
          source: 'feishu',
          sourceId: { in: filteredFiles.map(f => f.token) },
        },
        select: { sourceId: true },
      });
      const existingSourceIds = new Set(existingReports.map(r => r.sourceId));

      for (const file of filteredFiles) {
        try {
          if (existingSourceIds.has(file.token)) {
            console.log(`文档已同步过，跳过: ${file.title}`);
            continue;
          }

          console.log(`正在同步: ${file.title}`);

          let content = '';
          if (file.type === 'docx') {
            content = await feishuClient.getDocxContent(file.token);
          } else {
            console.log(`跳过非 docx 类型文件: ${file.title} (type: ${file.type})`);
            continue;
          }

          if (!content) {
            console.log(`文档内容为空，跳过: ${file.title}`);
            continue;
          }

          const fileName = `${file.title}.md`;
          const filePath = await saveFile('reports', fileName, content, 'text/markdown');

          await prisma.report.create({
            data: {
              title: file.title,
              type: config.reportType as ReportTypeKey,
              typeText: config.reportType === 'day' ? '日报' : config.reportType === 'week' ? '周报' : '月报',
              topic: config.topic,
              filePath: filePath,
              source: 'feishu',
              sourceId: file.token,
              syncTime: new Date(),
            },
          });

          success++;
          console.log(`同步成功: ${file.title}`);
        } catch (error) {
          failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to sync ${file.title}: ${errorMsg}`);
          console.error('Failed to sync document:', file.title, error);
        }
      }

      await prisma.feishuSyncConfig.update({
        where: { id: configId },
        data: { lastSyncTime: new Date() },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to list files: ${errorMsg}`);
      console.error('Failed to sync:', error);
    }

    return {
      success,
      failed,
      errors,
    };
  }
}

export const syncService = new SyncService();
