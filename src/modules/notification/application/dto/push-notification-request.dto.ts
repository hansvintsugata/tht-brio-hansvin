/**
 * Data transfer object for push notification requests
 * Contains user ID, company ID, notification name, and optional template data
 */
export interface PushNotificationRequestDto {
  userId: string;
  companyId: string;
  notificationName: string;
  templateData?: Record<string, any>;
}
