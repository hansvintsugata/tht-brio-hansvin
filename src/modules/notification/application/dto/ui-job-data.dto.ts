/**
 * Data transfer object for UI notification jobs
 * Contains the notification name, subject, content, user ID, and template data for processing
 */
export interface UiJobData {
  notificationName: string;
  subject: string;
  content: string;
  userId: string;
}
