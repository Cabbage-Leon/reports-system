import { FeishuClient } from './feishu';
import prisma from './prisma';
import { saveFile } from './storage';

type ReportTypeKey = 'day' | 'week' | 'month';

export class SyncService {
  private getChinaDate(): { year: number; month: number; date: number; day: number } {
    const now = new Date();
    const offset = 8;
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const chinaTime = new Date(utc + offset * 3600000);
    
    return {
      year: chinaTime.getFullYear(),
      month: chinaTime.getMonth(),
      date: chinaTime.getDate(),
      day: chinaTime.getDay(),
    };
  }

  private getDateRange(range: string, days?: number, customStartDate?: Date | null, customEndDate?: Date | null): { start: Date; end: Date } {
    const chinaDate = this.getChinaDate();
    let start: Date;
    let end: Date;

    switch (range) {
      case 'today':
        start = new Date(chinaDate.year, chinaDate.month, chinaDate.date);
        end = new Date(chinaDate.year, chinaDate.month, chinaDate.date, 23, 59, 59, 999);
        break;
      case 'this_week':
        const diff = chinaDate.date - chinaDate.day + (chinaDate.day === 0 ? -6 : 1);
        start = new Date(chinaDate.year, chinaDate.month, diff);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        break;
      case 'custom':
        if (days) {
          const customDate = new Date(chinaDate.year, chinaDate.month, chinaDate.date - days);
          start = customDate;
          start.setHours(0, 0, 0, 0);
        } else {
          start = new Date(chinaDate.year, chinaDate.month, chinaDate.date);
        }
        end = new Date();
        break;
      case 'date_range':
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
        } else {
          start = new Date(chinaDate.year, chinaDate.month, chinaDate.date);
          end = new Date(chinaDate.year, chinaDate.month, chinaDate.date, 23, 59, 59, 999);
        }
        break;
      default:
        start = new Date(chinaDate.year, chinaDate.month, chinaDate.date);
        end = new Date(chinaDate.year, chinaDate.month, chinaDate.date, 23, 59, 59, 999);
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

  private isFeishuFileTypeMatch(fileName: string, fileType: string, allowedTypes: string[]): boolean {
    if (!allowedTypes || allowedTypes.length === 0) {
      return true;
    }

    // 1. 首先根据文件名后缀判断
    const lowerFileName = fileName.toLowerCase();
    const fileNameMatch = allowedTypes.some(type => lowerFileName.endsWith(`.${type.toLowerCase()}`));
    
    if (fileNameMatch) {
      return true;
    }

    // 2. 如果文件名没有后缀，根据飞书文件类型判断
    const typeMapping: Record<string, string[]> = {
      'docx': ['docx', 'md'],
      'sheet': ['xlsx', 'csv'],
      'bitable': ['bitable'],
      'doc': ['doc'],
      'pdf': ['pdf'],
      'file': allowedTypes,
    };

    const mappedTypes = typeMapping[fileType] || typeMapping['file'];
    return mappedTypes.some(type => allowedTypes.includes(type));
  }

  private getFileFormatFromType(fileType: string, fileName: string): string {
    const lowerFileName = fileName.toLowerCase();
    
    // 根据文件名后缀判断
    if (lowerFileName.endsWith('.html')) return 'html';
    if (lowerFileName.endsWith('.md')) return 'markdown';
    if (lowerFileName.endsWith('.pdf')) return 'pdf';
    if (lowerFileName.endsWith('.docx')) return 'docx';
    if (lowerFileName.endsWith('.doc')) return 'doc';
    if (lowerFileName.endsWith('.txt')) return 'text';
    if (lowerFileName.endsWith('.xlsx') || lowerFileName.endsWith('.csv')) return 'spreadsheet';
    
    // 根据飞书文件类型判断
    const typeMapping: Record<string, string> = {
      'docx': 'docx',
      'sheet': 'spreadsheet',
      'bitable': 'bitable',
      'doc': 'doc',
      'pdf': 'pdf',
      'file': 'text',
    };
    
    return typeMapping[fileType] || 'text';
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
        customStartDate: config.customStartDate,
        customEndDate: config.customEndDate,
        fileTypes: config.fileTypes,
        hasUserToken: !!accessToken,
      });

      const files = await feishuClient.listFiles(config.folderToken || undefined);
      console.log(`从飞书获取到 ${files.length} 个文件`);

      const dateRange = this.getDateRange(config.syncRange, config.syncDays, config.customStartDate, config.customEndDate);
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
      
      const fileTypeStats = filteredFiles.reduce((acc, file) => {
        acc[file.type] = (acc[file.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('文件类型统计:', fileTypeStats);

      // 查询已同步的文件，结合文件名和文件类型进行去重
      const existingReports = await prisma.report.findMany({
        where: {
          source: 'feishu',
        },
        select: { 
          sourceId: true,
          sourceTitle: true,
          sourceFileType: true,
        },
      });
      
      // 创建去重集合：key = "title|fileType"
      const existingKeys = new Set(
        existingReports
          .filter(r => r.sourceTitle && r.sourceFileType)
          .map(r => `${r.sourceTitle}|${r.sourceFileType}`)
      );
      
      // 保留基于 token 的去重（用于兼容旧数据）
      const existingTokenIds = new Set(
        existingReports
          .filter(r => r.sourceId)
          .map(r => r.sourceId)
      );

      for (const file of filteredFiles) {
        try {
          // 检查文件名和文件类型组合是否已同步
          const fileKey = `${file.title}|${file.type}`;
          if (existingKeys.has(fileKey)) {
            console.log(`文档已同步过（按文件名+类型），跳过: ${file.title} (type: ${file.type})`);
            continue;
          }
          
          // 保留基于 token 的去重检查
          if (existingTokenIds.has(file.token)) {
            console.log(`文档已同步过（按token），跳过: ${file.title}`);
            continue;
          }

          console.log(`正在同步: ${file.title} (type: ${file.type})`);

          if (!this.isFeishuFileTypeMatch(file.title, file.type, config.fileTypes)) {
            console.log(`跳过不支持的文件类型: ${file.title} (type: ${file.type})`);
            continue;
          }

          // 获取文件内容
          const fileResult = await feishuClient.getFileContent(file.token, file.type, file.title);
          let { content, format } = fileResult;
          let fileExtension = '.txt';
          
          // 根据格式确定文件扩展名
          switch (format) {
            case 'html':
              fileExtension = '.html';
              break;
            case 'markdown':
              fileExtension = '.md';
              break;
            case 'pdf':
              fileExtension = '.pdf';
              break;
            case 'docx':
              fileExtension = '.docx';
              break;
            case 'doc':
              fileExtension = '.doc';
              break;
            case 'spreadsheet':
              fileExtension = '.csv';
              break;
            default:
              fileExtension = '.txt';
          }

          if (!content) {
            console.log(`文档内容为空，跳过: ${file.title}`);
            continue;
          }

          const fileName = `${file.title}${fileExtension}`;
          let contentType = 'text/plain';
          
          switch (format) {
            case 'html':
              contentType = 'text/html';
              break;
            case 'markdown':
              contentType = 'text/markdown';
              break;
            case 'pdf':
              contentType = 'application/pdf';
              break;
            case 'docx':
              contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
              break;
            case 'doc':
              contentType = 'application/msword';
              break;
            case 'spreadsheet':
              contentType = 'text/csv';
              break;
          }

          const filePath = await saveFile('reports', fileName, content, contentType);

          await prisma.report.create({
            data: {
              title: file.title,
              type: config.reportType as ReportTypeKey,
              typeText: config.reportType === 'day' ? '日报' : config.reportType === 'week' ? '周报' : '月报',
              topic: config.topic,
              filePath: filePath,
              fileFormat: format,
              source: 'feishu',
              sourceId: file.token,
              sourceTitle: file.title,
              sourceFileType: file.type,
              syncTime: new Date(),
            },
          });

          success++;
          console.log(`同步成功: ${file.title} (format: ${format})`);
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
