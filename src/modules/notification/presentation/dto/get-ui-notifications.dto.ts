import {
  PaginationRequestDto,
  PaginationResponseDto,
} from '../../../../common/dto/pagination.dto';

export class GetUiNotificationsRequestDto extends PaginationRequestDto {
  userId: string;
}

export class GetUiNotificationsResponseDto extends PaginationResponseDto {
  notifications: Array<{
    notificationName: string;
    subject: string;
    content: string;
    userId: string;
    notificationChannel: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}
