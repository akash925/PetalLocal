# Neon Database Setup Guide

This guide will help you migrate your FarmDirect application from the local PostgreSQL database to Neon's serverless PostgreSQL platform.

## Prerequisites

1. **Neon Account**: Create a free account at [neon.tech](https://neon.tech)
2. **Database Project**: Create a new database project in your Neon console
3. **Connection String**: Get your Neon database connection string

## Setup Steps

### 1. Get Your Neon Database URL

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project or select an existing one
3. Go to "Connection Details" 
4. Copy the connection string (it looks like: `postgresql://user:password@hostname/database`)

### 2. Configure Environment Variables

Add your Neon database URL to your environment:

```bash
# In your Replit Secrets or .env file
NEON_DATABASE_URL=postgresql://user:password@hostname/database
```

Keep your existing `DATABASE_URL` for now - we'll use it for data migration.

### 3. Run the Migration Script

The setup script will:
- Generate fresh migrations
- Create tables in Neon
- Transfer data from your current database
- Verify the setup

```bash
# Run the complete setup
npm run neon:setup

# Or run step by step:
npm run neon:generate  # Generate migrations
npm run neon:push      # Push schema to Neon
tsx scripts/setup-neon.ts  # Transfer data
```

### 4. Verify the Setup

Check that everything was migrated correctly:

```bash
tsx scripts/verify-neon.ts
```

This will verify:
- All tables exist
- Data was transferred correctly
- Authentication structure is compatible
- Image storage is working

### 5. Switch to Neon Database

Once verification passes:

1. Update your `DATABASE_URL` environment variable:
   ```bash
   DATABASE_URL=postgresql://user:password@hostname/database
   ```

2. Restart your application

3. Test core functionality:
   - User registration and login
   - Farm and produce management
   - Image uploads and compression
   - Order processing

## Features Preserved

✅ **User Authentication**: All user accounts and sessions work seamlessly
✅ **Image Compression**: All uploaded images maintain their compression
✅ **Data Integrity**: All relationships and constraints are preserved
✅ **Performance**: Neon's serverless architecture provides excellent performance
✅ **Security**: All security measures remain in place

## Database Schema

The Neon database includes all existing tables:

- `users` - User accounts (farmers, buyers, admins)
- `farms` - Farm profiles and information
- `produce_items` - Product listings
- `inventories` - Stock management
- `orders` - Order processing
- `order_items` - Order line items
- `messages` - User messaging
- `reviews` - Farm reviews and ratings

## Image Storage

Images are stored as compressed base64 data URLs in the database:
- Automatic compression to 1200px max dimensions
- JPEG compression at 80% quality
- Size optimization for fast loading
- Maintained compression statistics

## Performance Benefits

- **Serverless**: Automatic scaling based on demand
- **Connection Pooling**: Efficient connection management
- **Global CDN**: Fast access from anywhere
- **Automatic Backups**: Built-in point-in-time recovery

## Troubleshooting

### Connection Issues

If you can't connect to Neon:
1. Check your connection string format
2. Ensure IP allowlist is configured (if using IP restrictions)
3. Verify your database exists and is active

### Data Migration Issues

If data doesn't transfer:
1. Check both database connections are working
2. Verify table schemas match
3. Check logs for specific error messages

### Authentication Problems

If login doesn't work:
1. Verify user table structure
2. Check password hashing compatibility
3. Ensure session store is configured

## Support

For issues with:
- **FarmDirect Setup**: Check the application logs
- **Neon Database**: Visit [Neon Documentation](https://neon.tech/docs)
- **Migration Script**: Review the script logs for detailed error messages

## Environment Variables Reference

```bash
# Required for migration
DATABASE_URL=postgresql://current-database-url
NEON_DATABASE_URL=postgresql://neon-database-url

# Optional configuration
ENABLE_MIGRATION=true
ENABLE_DATA_TRANSFER=true
BACKUP_PREFIX=backup_
```

## Commands Reference

```bash
# Full setup
npm run neon:setup

# Individual steps
npm run neon:generate    # Generate migrations
npm run neon:push        # Push schema
npm run neon:backup      # Create backup only
npm run neon:migrate     # Generate and push

# Verification
tsx scripts/verify-neon.ts

# Database management
npm run db:studio        # Open database studio
npm run seed            # Seed with sample data
```