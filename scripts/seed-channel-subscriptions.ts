#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { NotificationChannel } from '../src/common/enums/notification-channel.enum';
import { SubscriberType } from '../src/common/enums/subscriber-types.enum';

// Load environment variables
config();

// MongoDB connection URI from environment variable
const MONGODB_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/notification-service';

// Channel subscription schema
const channelSubscriptionSchema = new mongoose.Schema({
  subscriberId: { 
    type: String, 
    required: true,
    description: 'ID of the subscriber (user, employee, company, etc.)'
  },
  subscriberType: { 
    type: String, 
    required: true,
    enum: Object.values(SubscriberType),
    description: 'Type of subscriber'
  },
  channel: { 
    type: String, 
    required: true,
    enum: Object.values(NotificationChannel),
    description: 'Notification channel type'
  },
  isActive: { 
    type: Boolean, 
    required: true, 
    default: true,
    description: 'Whether this subscription is active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'channel_subscriptions',
  timestamps: true
});

// Add compound indexes for efficient querying
channelSubscriptionSchema.index({ subscriberId: 1, subscriberType: 1 });
channelSubscriptionSchema.index({ isActive: 1 });
channelSubscriptionSchema.index(
  { subscriberId: 1, subscriberType: 1, channel: 1 }, 
  { unique: true }
);

const ChannelSubscriptionModel = mongoose.model('ChannelSubscription', channelSubscriptionSchema);

// Sample data for seeding
const CHANNEL_SUBSCRIPTIONS = [
  // User subscriptions
  {
    subscriberId: 'user-001',
    subscriberType: SubscriberType.USER,
    channel: NotificationChannel.EMAIL,
    isActive: true,
  },
  {
    subscriberId: 'user-001',
    subscriberType: SubscriberType.USER,
    channel: NotificationChannel.UI,
    isActive: true,
  },
  {
    subscriberId: 'user-002',
    subscriberType: SubscriberType.USER,
    channel: NotificationChannel.EMAIL,
    isActive: true,
  },
  {
    subscriberId: 'user-002',
    subscriberType: SubscriberType.USER,
    channel: NotificationChannel.SMS,
    isActive: false, // Inactive subscription
  },
  {
    subscriberId: 'user-003',
    subscriberType: SubscriberType.USER,
    channel: NotificationChannel.EMAIL,
    isActive: true,
  },
  {
    subscriberId: 'user-003',
    subscriberType: SubscriberType.USER,
    channel: NotificationChannel.MOBILE_PUSH,
    isActive: true,
  },
  {
    subscriberId: 'user-004',
    subscriberType: SubscriberType.USER,
    channel: NotificationChannel.WHATSAPP,
    isActive: true,
  },
  {
    subscriberId: 'user-005',
    subscriberType: SubscriberType.USER,
    channel: NotificationChannel.EMAIL,
    isActive: true,
  },
  {
    subscriberId: 'user-005',
    subscriberType: SubscriberType.USER,
    channel: NotificationChannel.UI,
    isActive: true,
  },
  {
    subscriberId: 'user-006',
    subscriberType: SubscriberType.USER,
    channel: NotificationChannel.EMAIL,
    isActive: false, // Inactive
  },

  // Company subscriptions
  {
    subscriberId: 'company-001',
    subscriberType: SubscriberType.COMPANY,
    channel: NotificationChannel.EMAIL,
    isActive: true,
  },
   {
    subscriberId: 'company-001',
    subscriberType: SubscriberType.COMPANY,
    channel: NotificationChannel.UI,
    isActive: true,
  },
  {
    subscriberId: 'company-002',
    subscriberType: SubscriberType.COMPANY,
    channel: NotificationChannel.EMAIL,
    isActive: true,
  },
  {
    subscriberId: 'company-002',
    subscriberType: SubscriberType.COMPANY,
    channel: NotificationChannel.SMS,
    isActive: true,
  },
  {
    subscriberId: 'company-003',
    subscriberType: SubscriberType.COMPANY,
    channel: NotificationChannel.EMAIL,
    isActive: false, // Inactive company subscription
  },
];

class ChannelSubscriptionDataSeeder {
  constructor(private channelSubscriptionModel: typeof ChannelSubscriptionModel) {}

  async connectToDatabase(): Promise<void> {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  async disconnectFromDatabase(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB successfully');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  async seedChannelSubscriptions(): Promise<void> {
    console.log('Seeding channel subscriptions...');
    
    try {
      // Use insertMany with ordered: false to continue even if some documents fail
      const result = await this.channelSubscriptionModel.insertMany(CHANNEL_SUBSCRIPTIONS, { ordered: false });
      console.log(`Successfully seeded ${result.length} channel subscriptions`);
      
      // Log the names of seeded subscriptions
      result.forEach(subscription => {
        console.log(`- ${subscription.subscriberType} ${subscription.subscriberId}: ${subscription.channel} (${subscription.isActive ? 'active' : 'inactive'})`);
      });
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error - some subscriptions already exist
        console.log('Some channel subscriptions already exist. Skipping duplicates.');
      } else {
        console.error('Error seeding channel subscriptions:', error);
        throw error;
      }
    }
  }

  async clearAllChannelSubscriptions(): Promise<void> {
    console.log('Clearing all channel subscriptions...');
    
    try {
      const result = await this.channelSubscriptionModel.deleteMany({});
      console.log(`Cleared ${result.deletedCount} channel subscriptions`);
    } catch (error) {
      console.error('Error clearing channel subscriptions:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<any> {
    try {
      const totalCount = await this.channelSubscriptionModel.countDocuments();
      const activeCount = await this.channelSubscriptionModel.countDocuments({ isActive: true });
      const inactiveCount = await this.channelSubscriptionModel.countDocuments({ isActive: false });
      
      // Get count by subscriber type
      const subscriberTypeStats = await this.channelSubscriptionModel.aggregate([
        { $group: { _id: '$subscriberType', count: { $sum: 1 } } }
      ]);

      // Get count by channel
      const channelStats = await this.channelSubscriptionModel.aggregate([
        { $group: { _id: '$channel', count: { $sum: 1 } } }
      ]);

      // Get active vs inactive by subscriber type
      const activeInactiveStats = await this.channelSubscriptionModel.aggregate([
        { $group: { 
          _id: { subscriberType: '$subscriberType', isActive: '$isActive' }, 
          count: { $sum: 1 } 
        } }
      ]);

      return {
        totalSubscriptions: totalCount,
        activeSubscriptions: activeCount,
        inactiveSubscriptions: inactiveCount,
        subscriptionsBySubscriberType: subscriberTypeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {} as Record<string, number>),
        subscriptionsByChannel: channelStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {} as Record<string, number>),
        activeInactiveBreakdown: activeInactiveStats.reduce((acc, stat) => {
          const key = `${stat._id.subscriberType}_${stat._id.isActive ? 'active' : 'inactive'}`;
          acc[key] = stat.count;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const seeder = new ChannelSubscriptionDataSeeder(ChannelSubscriptionModel);

  try {
    await seeder.connectToDatabase();

    switch (command) {
      case 'seed':
        await seeder.seedChannelSubscriptions();
        break;
      case 'clear':
        await seeder.clearAllChannelSubscriptions();
        break;
      case 'stats':
        const stats = await seeder.getStatistics();
        console.log('Channel Subscription Statistics:', stats);
        break;
      default:
        console.log('Usage: ts-node seed-channel-subscriptions.ts [seed|clear|stats]');
        console.log('  seed  - Seed channel subscriptions');
        console.log('  clear - Clear all channel subscriptions');
        console.log('  stats - Show statistics');
        process.exit(1);
    }

    console.log('Operation completed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await seeder.disconnectFromDatabase();
  }
}

// Run the CLI
if (require.main === module) {
  main().catch(console.error);
}

export { ChannelSubscriptionDataSeeder, NotificationChannel, SubscriberType };