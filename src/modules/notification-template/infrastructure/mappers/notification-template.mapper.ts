import { NotificationTemplate } from '../../domain/entities/notification-template.entity';
import { NotificationTemplateResponseDto } from '../../application/dto/notification-template-response.dto';
import { NotificationTemplatePersistenceModel } from '../persistence/notification-template-persistence.model';
import { Types } from 'mongoose';

export class NotificationTemplateMapper {
  /**
   * Map MongoDB document to domain entity
   */
  static toDomain(document: any): NotificationTemplate {
    return NotificationTemplate.create({
      id: document._id.toString(),
      name: document.name,
      description: document.description,
      channelDetails: document.channelDetails,
      isActive: document.isActive,
      createdBy: document.createdBy.toString(),
      updatedBy: document.updatedBy?.toString(),
      createdAt: document.createdAt || new Date(),
      updatedAt: document.updatedAt || new Date(),
    });
  }

  /**
   * Map multiple MongoDB documents to domain entities
   */
  static toDomainList(documents: any[]): NotificationTemplate[] {
    return documents.map((doc) => this.toDomain(doc));
  }

  /**
   * Map domain entity to MongoDB persistence format
   */
  static toPersistence(
    template: NotificationTemplate,
  ): Partial<NotificationTemplatePersistenceModel> {
    return {
      name: template.name,
      description: template.description,
      channelDetails: template.channelDetails,
      isActive: template.isActive,
      createdBy: new Types.ObjectId(template.createdBy),
      updatedBy: template.updatedBy
        ? new Types.ObjectId(template.updatedBy)
        : undefined,
    };
  }

  /**
   * Map domain entity to response DTO
   */
  static toResponseDto(
    entity: NotificationTemplate,
  ): NotificationTemplateResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      channelDetails: entity.channelDetails,
      isActive: entity.isActive,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Map multiple domain entities to response DTOs
   */
  static toResponseDtoList(
    entities: NotificationTemplate[],
  ): NotificationTemplateResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
