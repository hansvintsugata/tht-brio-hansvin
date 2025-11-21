/**
 * Data transfer object for email notification jobs
 * Contains the notification name, subject, content, user ID, and template data for processing
 */
export interface EmailJobData {
  notificationName: string;
  subject: string;
  content: string;
  userId: string;
  templateData?: Record<string, any>;
}
