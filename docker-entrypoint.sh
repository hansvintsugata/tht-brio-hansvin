#!/bin/sh

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
while ! nc -z mongodb 27017; do
  sleep 1
done
echo "MongoDB is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
while ! nc -z redis 6379; do
  sleep 1
done
echo "Redis is ready!"

# Run seeders
echo "Running database seeders..."
cd /app

# Run channel subscriptions seeder
echo "Seeding channel subscriptions..."
npx ts-node scripts/seed-channel-subscriptions.ts seed

# Run notification templates seeder
echo "Seeding notification templates..."
npx ts-node scripts/seed-notification-templates.ts seed

# Run notifications seeder
echo "Seeding notifications..."
npx ts-node scripts/seed-notifications.ts seed 50

echo "All seeders completed successfully!"

# Start the main application
exec "$@"