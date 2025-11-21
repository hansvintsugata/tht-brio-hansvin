export class NotificationTemplate {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _channelDetails: ChannelConfig,
    private readonly _isActive: boolean,
    private readonly _createdBy: string,
    private readonly _updatedBy?: string,
    private readonly _createdAt?: Date,
    private readonly _updatedAt?: Date,
  ) {}

  /**
   * Factory method to create a new NotificationTemplate
   */
  static create(data: {
    id?: string;
    name: string;
    description: string;
    channelDetails: ChannelConfig;
    isActive: boolean;
    createdBy: string;
    updatedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): NotificationTemplate {
    // Business validation
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    if (!data.channelDetails || Object.keys(data.channelDetails).length === 0) {
      throw new Error('At least one channel must be configured');
    }

    return new NotificationTemplate(
      data.id,
      data.name.trim(),
      data.description.trim(),
      data.channelDetails,
      data.isActive,
      data.createdBy,
      data.updatedBy,
      data.createdAt || new Date(),
      data.updatedAt || new Date(),
    );
  }

  // Getters
  get id(): string {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get description(): string {
    return this._description;
  }
  get channelDetails(): ChannelConfig {
    return this._channelDetails;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get createdBy(): string {
    return this._createdBy;
  }
  get updatedBy(): string | undefined {
    return this._updatedBy;
  }
  get createdAt(): Date | undefined {
    return this._createdAt;
  }
  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }
}

/**
 * Channel detail object structure
 * Each channel can have its own configuration with active status, subject, and body
 */
export interface ChannelDetail {
  active: boolean;
  subject?: string;
  body?: string; // HTML content for the message
}

/**
 * Channel configuration object
 * Key-value pairs where key is the channel name and value is the channel detail
 */
export interface ChannelConfig {
  [channel: string]: ChannelDetail;
}
