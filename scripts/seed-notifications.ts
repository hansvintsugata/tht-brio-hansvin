#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config();

// Define NotificationChannel enum locally to avoid module resolution issues
enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  UI = 'ui',
  MOBILE_PUSH = 'mobile_push',
}

// Define the notification schema
const notificationSchema = new mongoose.Schema({
  notificationName: { type: String, required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  userId: { type: String, required: true },
  notificationChannel: { 
    type: String, 
    required: true,
    enum: Object.values(NotificationChannel)
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'notifications',
  timestamps: true
});

const NotificationModel = mongoose.model('Notification', notificationSchema);

// Notification templates for realistic data
const NOTIFICATION_TEMPLATES = [
  {
    name: 'welcome_email',
    subject: 'Welcome to our platform!',
  },
  {
    name: 'password_reset',
    subject: 'Password Reset Request',
  },
  {
    name: 'order_confirmation',
    subject: 'Order Confirmation',
  },
  {
    name: 'shipping_update',
    subject: 'Shipping Update',
  },
  {
    name: 'promotional_offer',
    subject: 'Special Offer Just for You!',
  },
  {
    name: 'account_verification',
    subject: 'Verify Your Account',
  },
  {
    name: 'subscription_reminder',
    subject: 'Subscription Renewal Reminder',
  },
  {
    name: 'security_alert',
    subject: 'Security Alert',
  }
];

const NOTIFICATION_CHANNELS = Object.values(NotificationChannel);

// Utility functions
function generateRandomDate(start?: Date, end?: Date): Date {
  const startDate = start || new Date(2024, 0, 1);
  const endDate = end || new Date();
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

function generateUserId(): string {
  return new mongoose.Types.ObjectId().toString();
}

function generateContent(templateName: string): string {
  const contents = {
    welcome_email: 'Welcome to our platform! We\'re excited to have you on board.',
    password_reset: 'You have requested to reset your password. Please use the link below to proceed.',
    order_confirmation: 'Your order has been confirmed and will be processed shortly.',
    shipping_update: 'Your package has been shipped and is on its way to you.',
    promotional_offer: 'Don\'t miss out on this exclusive offer available for a limited time!',
    account_verification: 'Please verify your account by clicking the link below.',
    subscription_reminder: 'Your subscription will expire soon. Renew now to continue enjoying our services.',
    security_alert: 'We detected unusual activity on your account. Please review your recent login activity.'
  };
  
  return contents[templateName as keyof typeof contents] || 'This is a notification message.';
}

function generateNotification() {
  const template = NOTIFICATION_TEMPLATES[Math.floor(Math.random() * NOTIFICATION_TEMPLATES.length)];
  const channel = NOTIFICATION_CHANNELS[Math.floor(Math.random() * NOTIFICATION_CHANNELS.length)];
  const createdDate = generateRandomDate();
  
  return {
    notificationName: template.name,
    subject: template.subject,
    content: generateContent(template.name),
    userId: generateUserId(),
    notificationChannel: channel,
    createdAt: createdDate,
    updatedAt: createdDate
  };
}

// Main seeder class
class NotificationDataSeeder {
  private notificationModel: mongoose.Model<any>;

  constructor() {
    this.notificationModel = NotificationModel;
  }

  async seedNotifications(count: number = 50): Promise<void> {
    console.log(`Seeding ${count} notifications...`);
    
    const notifications = Array.from({ length: count }, () => generateNotification());
    
    try {
      await this.notificationModel.insertMany(notifications);
      console.log(`Successfully seeded ${count} notifications`);
    } catch (error) {
      console.error('Error seeding notifications:', error);
      throw error;
    }
  }

  async clearAllNotifications(): Promise<void> {
    console.log('Clearing all notifications...');
    
    try {
      const result = await this.notificationModel.deleteMany({});
      console.log(`Cleared ${result.deletedCount} notifications`);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<any> {
    const [
      total,
      byChannel,
      byTemplate,
      recentCount
    ] = await Promise.all([
      this.notificationModel.countDocuments(),
      this.notificationModel.aggregate([
        { $group: { _id: '$notificationChannel', count: { $sum: 1 } } }
      ]),
      this.notificationModel.aggregate([
        { $group: { _id: '$notificationName', count: { $sum: 1 } } }
      ]),
      this.notificationModel.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      })
    ]);

    return {
      total,
      byChannel: byChannel.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byTemplate: byTemplate.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentCount
    };
  }

  async closeConnection(): Promise<void> {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Parse arguments based on command
  let mongoUri = process.env.DATABASE_URI || 'mongodb://localhost:27017/notification-service';
  let count = 50;
  
  if (command === 'seed') {
    // For seed command: seed [count] [mongo-uri]
    if (args.length >= 2 && !args[1].startsWith('mongodb')) {
      count = parseInt(args[1], 10);
      if (args.length >= 3) {
        mongoUri = args[2];
      }
    } else if (args.length >= 2 && args[1].startsWith('mongodb')) {
      mongoUri = args[1];
    }
  } else {
    // For other commands: clear/stats [mongo-uri]
    if (args.length >= 2) {
      mongoUri = args[1];
    }
  }
  
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB at ${mongoUri}`);
    
    const seeder = new NotificationDataSeeder();
    
    switch (command) {
      case 'seed':
        await seeder.seedNotifications(count);
        break;
        
      case 'clear':
        await seeder.clearAllNotifications();
        break;
        
      case 'stats':
        const stats = await seeder.getStatistics();
        console.log('Notification Statistics:');
        console.log(JSON.stringify(stats, null, 2));
        break;
        
      default:
        console.log('Usage:');
        console.log('  ts-node seed-notifications.ts seed [count] [mongo-uri]');
        console.log('  ts-node seed-notifications.ts clear [mongo-uri]');
        console.log('  ts-node seed-notifications.ts stats [mongo-uri]');
        console.log('');
        console.log('Examples:');
        console.log('  ts-node seed-notifications.ts seed 100');
        console.log('  ts-node seed-notifications.ts seed 50 mongodb://localhost:27017/mydb');
        console.log('  ts-node seed-notifications.ts clear');
        console.log('  ts-node seed-notifications.ts stats mongodb://localhost:27017/mydb');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { NotificationDataSeeder, NotificationChannel };