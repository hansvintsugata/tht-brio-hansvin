import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendNotificationRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsNotEmpty()
  notificationName: string;
}

export class SendNotificationResponseDto {
  success: boolean;
  message: string;
}
