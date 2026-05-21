import prisma from '@/lib/prisma';
import { FeishuClient } from '@/lib/feishu';
import { saveFile, generateFilename } from '@/lib/storage';

export class SyncService {
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
      
      // 获取今天的日期字符串
      const today = new Date().toISOString().split('T')[0];
      
      // 过滤今天更新的文档
      const todayFiles = files.filter(file => {
        const updateDate = new Date(file.updateTime).toISOString().split('T')[0];
        return updateDate === today;
      });

      for (const file of todayFiles) {
        try {
          // 检查文档已存在则跳过
          const existingReport = await prisma.report.findFirst({
            where: {
              source: 'feishu',
              sourceId: file.token,
            },
          });

          if (existingReport) {
            console.log(`Document already synced, skipping:', file.title);
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
