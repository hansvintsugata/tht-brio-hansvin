#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { NotificationChannel } from '../src/common/enums/notification-channel.enum';

// Load environment variables
config();

// MongoDB connection URI from environment variable
const MONGODB_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/notification-service';

// Notification template schema
const notificationTemplateSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  channelDetails: { 
    type: Object, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    required: true, 
    default: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'notification_templates',
  timestamps: true
});

const NotificationTemplateModel = mongoose.model('NotificationTemplate', notificationTemplateSchema);

// Predefined notification templates
const NOTIFICATION_TEMPLATES = [
  {
    name: 'leave-balance-reminder',
    description: 'To remind user he has to take his leave',
    channelDetails: {
      [NotificationChannel.UI]: {
        active: true,
        body: '<p>Dear {{fullName}},</p><p>You have {{leaveBalance}} days of leave remaining. Please plan your leave accordingly.</p><p>Best regards,<br>HR Team</p>'
      }
    }
  },
  {
    name: 'monthly-payslip',
    description: 'To inform the user his payslip is available',
    channelDetails: {
      [NotificationChannel.EMAIL]: {
        active: true,
        subject: 'Your Monthly Payslip is Available',
        body: '<p>Dear {{fullName}},</p><p>Your monthly payslip for this month is now available for download.</p><p>Please log in to your employee portal to access it.</p><p>Best regards,<br>HR Department</p>'
      }
    }
  },
  {
    name: 'happy-birthday',
    description: 'To inform the user the company wishes him a happy birthday',
    channelDetails: {
      [NotificationChannel.EMAIL]: {
        active: true,
        subject: 'Happy Birthday from All of Us!',
        body: '<p>Dear {{fullName}},</p><p>Wishing you a very happy birthday filled with joy, laughter, and wonderful moments!</p><p>May this special day bring you happiness and success in the year ahead.</p><p>Best wishes from your colleagues at {{companyName}}</p>'
      },
      [NotificationChannel.UI]: {
        active: true,
        body: '<p>🎉 Happy Birthday {{fullName}}! 🎂</p><p>Wishing you a fantastic day filled with joy and celebration!</p>'
      }
    }
  }
];

class NotificationTemplateDataSeeder {
  constructor(private notificationTemplateModel: typeof NotificationTemplateModel) {}

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

  async seedNotificationTemplates(): Promise<void> {
    console.log('Seeding notification templates...');
    
    try {
      // Create a default user ID for seeding (in a real app, you'd use an actual user)
      const defaultUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
      
      const templatesWithUser = NOTIFICATION_TEMPLATES.map(template => ({
        ...template,
        createdBy: defaultUserId,
        updatedBy: defaultUserId,
        isActive: true
      }));

      // Use insertMany with ordered: false to continue even if some documents fail
      const result = await this.notificationTemplateModel.insertMany(templatesWithUser, { ordered: false });
      console.log(`Successfully seeded ${result.length} notification templates`);
      
      // Log the names of seeded templates
      result.forEach(template => {
        console.log(`- ${template.name}: ${template.description}`);
      });
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error - some templates already exist
        console.log('Some notification templates already exist. Skipping duplicates.');
      } else {
        console.error('Error seeding notification templates:', error);
        throw error;
      }
    }
  }

  async clearAllNotificationTemplates(): Promise<void> {
    console.log('Clearing all notification templates...');
    
    try {
      const result = await this.notificationTemplateModel.deleteMany({});
      console.log(`Cleared ${result.deletedCount} notification templates`);
    } catch (error) {
      console.error('Error clearing notification templates:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<any> {
    try {
      const totalCount = await this.notificationTemplateModel.countDocuments();
      const activeCount = await this.notificationTemplateModel.countDocuments({ isActive: true });
      const inactiveCount = await this.notificationTemplateModel.countDocuments({ isActive: false });
      
      // Get count by channel
      const channelStats = await this.notificationTemplateModel.aggregate([
        { $unwind: '$channelDetails' },
        { $match: { 'channelDetails.active': true } },
        { $group: { _id: '$_id', channels: { $push: '$channelDetails' } } },
        { $unwind: '$channels' },
        { $group: { _id: '$channels.k', count: { $sum: 1 } } }
      ]);

      return {
        totalTemplates: totalCount,
        activeTemplates: activeCount,
        inactiveTemplates: inactiveCount,
        templatesByChannel: channelStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
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
  const seeder = new NotificationTemplateDataSeeder(NotificationTemplateModel);

  try {
    await seeder.connectToDatabase();

    switch (command) {
      case 'seed':
        await seeder.seedNotificationTemplates();
        break;
      case 'clear':
        await seeder.clearAllNotificationTemplates();
        break;
      case 'stats':
        const stats = await seeder.getStatistics();
        console.log('Notification Template Statistics:', stats);
        break;
      default:
        console.log('Usage: ts-node seed-notification-templates.ts [seed|clear|stats]');
        console.log('  seed  - Seed notification templates');
        console.log('  clear - Clear all notification templates');
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

export { NotificationTemplateDataSeeder, NotificationChannel };