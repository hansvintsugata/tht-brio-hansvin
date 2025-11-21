/**
 * Data transfer object for push notification responses
 * Contains success status, notified channels, errors, and job creation statistics
 */
export interface PushNotificationResponseDto {
  success: boolean;
  notifiedChannels: string[];
  errors: Array<{
    channel: string;
    error: string;
  }>;
  totalJobsCreated: number;
}
