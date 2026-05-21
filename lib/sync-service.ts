import prisma from '@/lib/prisma';
import { FeishuClient } from '@/lib/feishu';
import { saveFile, generateFilename } from '@/lib/storage';

export class SyncService {
  // 计算日期范围的起始日期
  private getStartDate(syncRange: string, syncDays: number): Date {
    const now = new Date();
    let startDate = new Date(now);

    if (syncRange === 'today') {
      // 今天
      startDate.setHours(0, 0, 0, 0);
    } else if (syncRange === 'this_week') {
      // 本周一
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(startDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else if (syncRange === 'custom') {
      // 自定义天数
      startDate.setDate(startDate.getDate() - syncDays + 1);
      startDate.setHours(0, 0, 0, 0);
    }

    return startDate;
  }

  // 检查文件是否在同步范围内
  private isFileInRange(fileUpdateTime: string, startDate: Date): boolean {
    const fileDate = new Date(fileUpdateTime);
    const startOfDay = new Date(startDate);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return fileDate >= startOfDay && fileDate <= endOfDay;
  }

  // 检查文件类型是否匹配（忽略大小写）
  private isFileTypeMatch(fileName: string, allowedTypes: string[]): boolean {
    if (!fileName || allowedTypes.length === 0) {
      return true;
    }

    const lowerFileName = fileName.toLowerCase();
    
    for (const type of allowedTypes) {
      const lowerType = type.toLowerCase().trim();
      if (lowerType === '') continue;
      
      // 检查文件名是否以指定后缀结尾
      if (lowerFileName.endsWith(`.${lowerType}`)) {
        return true;
      }
    }
    
    return false;
  }

  // 获取文件扩展名（忽略大小写）
  private getFileExtension(fileName: string): string {
    if (!fileName) return '';
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return fileName.substring(lastDotIndex + 1).toLowerCase();
  }

  async syncFeishuDocuments(configId: string): Promise<{
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

    if (!config.enabled) {
      return { success: 0, failed: 0, errors: ['Sync config is disabled'] };
    }

    const feishuClient = new FeishuClient(config.appId, config.appSecret);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      // 获取飞书文件列表
      const files = await feishuClient.listFiles(config.folderToken || undefined);
      
      // 计算起始日期
      const startDate = this.getStartDate(config.syncRange, config.syncDays);
      
      // 获取允许的文件类型
      const allowedFileTypes = config.fileTypes || ['html', 'md'];
      
      // 过滤时间范围和文件类型的文档
      const filteredFiles = files.filter(file => {
        const inRange = this.isFileInRange(file.updateTime, startDate);
        const typeMatch = this.isFileTypeMatch(file.title, allowedFileTypes);
        return inRange && typeMatch;
      });

      // 获取已同步的文件 token 列表（用于去重）
      const existingTokens = await prisma.report.findMany({
        where: { source: 'feishu' },
        select: { sourceId: true },
      });
      const syncedTokens = new Set(existingTokens.map(r => r.sourceId));

      for (const file of filteredFiles) {
        try {
          // 检查文档已存在则跳过（去重）
          if (syncedTokens.has(file.token)) {
            console.log(`Document already synced (duplicate), skipping: ${file.title}`);
            continue;
          }

          // 检查是否已同步过相同文件名（另一种去重方式）
          const existingByTitle = await prisma.report.findFirst({
            where: {
              title: file.title,
              source: 'feishu',
            },
          });

          if (existingByTitle) {
            console.log(`Document with same title already exists, skipping: ${file.title}`);
            continue;
          }

          // 获取文档内容
          const htmlContent = await feishuClient.getDocumentHtml(file.token);
          
          // 保存文件
          const typeText = config.reportType === 'day' ? '日报' : 
                         config.reportType === 'week' ? '周报' : '月报';
          const filename = generateFilename(file.title);
          const filePath = await saveFile(config.reportType, filename, htmlContent);

          // 创建报告记录
          await prisma.report.create({
            data: {
            title: file.title,
            type: config.reportType,
            typeText,
            topic: config.topic,
            filePath,
            source: 'feishu',
            sourceId: file.token,
            syncTime: new Date(),
          },
          });

          successCount++;
          console.log('Successfully synced document:', file.title);
        } catch (error) {
          failedCount++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to sync ${file.title}: ${errorMsg}`);
          console.error('Failed to sync document:', file.title, error);
        }
      }

      // 更新最后同步时间
      await prisma.feishuSyncConfig.update({
        where: { id: configId },
        data: { lastSyncTime: new Date() },
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Sync failed: ${errorMsg}`);
      console.error('Sync failed:', error);
    }

    return {
      success: successCount,
      failed: failedCount,
      errors,
    };
  }

  async syncAllEnabledConfigs(): Promise<void> {
    const configs = await prisma.feishuSyncConfig.findMany({
      where: { enabled: true },
    });

    for (const config of configs) {
      try {
        await this.syncFeishuDocuments(config.id);
      } catch (error) {
        console.error(`Failed to sync config ${config.id}:`, error);
      }
    }
  }

  async checkAndSyncTime(): Promise<void> {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const configs = await prisma.feishuSyncConfig.findMany({
      where: { enabled: true },
    });

    for (const config of configs) {
      if (config.syncTime === currentTime) {
        console.log('Starting scheduled sync for config:', config.id);
        try {
          await this.syncFeishuDocuments(config.id);
        } catch (error) {
          console.error('Scheduled sync failed:', error);
        }
      }
    }
  }
}

export const syncService = new SyncService();
