import { NotificationTemplate } from '../entities/notification-template.entity';

/**
 * Repository interface for NotificationTemplate
 * Defines the contract for data access operations
 */
export interface INotificationTemplateRepository {
  /**
   * Find template by name
   */
  findByName(name: string): Promise<NotificationTemplate | null>;
}
