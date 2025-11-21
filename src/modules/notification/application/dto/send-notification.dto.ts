export class SendNotificationRequestDto {
  userId?: string;
  companyId?: string;
  notificationName: string;
}

export class SendNotificationResponseDto {
  success: boolean;
  message: string;
}
