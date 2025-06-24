# FarmDirect - Local Farm Marketplace

**Grow Local, Eat Local** - A modern web platform connecting backyard gardeners and local farmers directly with buyers who want fresh, local produce.

## 🌱 Project Overview

FarmDirect is a full-stack TypeScript marketplace that enables:
- **Farmers** to list their produce and manage inventory
- **Buyers** to search, browse, and purchase fresh local produce
- **Direct connections** between producers and consumers for fresher food and stronger communities

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Headless UI** for accessible components
- **React Query** for state management
- **Wouter** for client-side routing

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **Session-based authentication**

### Services (Stubbed)
- **Stripe** for payment processing (mock implementation)
- **SendGrid** for email notifications (mock implementation)
- **Sentry** for error tracking (optional)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd farmdirect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and other configuration.

4. **Set up the database**
   ```bash
   # Run database migrations
   npm run db:push
   ```

5. **Seed the database** (optional)
   ```bash
   # Add sample farms and produce data
   npx tsx scripts/seed.ts
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:5000`

## 📊 Database Schema

The application uses the following main entities:

- **Users** - Farmers, buyers, and admins
- **Farms** - Farm profiles and information
- **Produce Items** - Individual products from farms
- **Inventories** - Stock levels for produce items
- **Orders** - Purchase orders from buyers
- **Order Items** - Individual items within orders
- **Sessions** - User authentication sessions

### ER Diagram
View the complete database structure in `/docs/er-diagram.png` (generated via Drizzle Studio).

## 🎯 Core Features

### For Buyers
- Browse fresh produce by category
- Search for specific items
- View detailed farm profiles
- Add items to shopping cart
- Secure checkout process
- Order history and tracking

### For Farmers
- Create and manage farm profile
- List produce items with photos
- Update inventory levels
- Manage incoming orders
- Dashboard with analytics

### For Admins
- User management
- Platform oversight
- Order monitoring
- System analytics

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:push         # Push schema changes to database
npm run db:studio       # Open Drizzle Studio (database GUI)

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript compiler
