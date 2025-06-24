# FarmDirect - Local Farm Marketplace

## Overview

FarmDirect is a full-stack TypeScript marketplace that connects backyard gardeners and local farmers directly with buyers seeking fresh, local produce. The platform enables farmers to list their produce and manage inventory while providing buyers with search, browse, and purchase capabilities for fresh local produce.

## System Architecture

### Frontend Architecture
- **React-based SPA**: Built with React 18 and TypeScript for type safety
- **Client-side routing**: Uses Wouter for lightweight routing
- **State management**: React Query for server state and React hooks for local state
- **UI components**: Radix UI components with Tailwind CSS styling using shadcn/ui design system
- **Build system**: Vite for fast development and optimized production builds

### Backend Architecture
- **Express.js server**: TypeScript-based REST API server
- **Session-based authentication**: Express sessions with PostgreSQL session store
- **Middleware stack**: CORS handling, request logging, error handling
- **File serving**: Static file serving for production builds

### Database Layer
- **PostgreSQL**: Primary database for all application data
- **Drizzle ORM**: Type-safe database operations with schema-first approach
- **Connection pooling**: Neon serverless database client with WebSocket support

## Key Components

### Database Schema
The application uses a comprehensive schema with the following main entities:
- **Users**: Support for farmer, buyer, and admin roles with profile information
- **Farms**: Farm details including location, organic certification, and contact info
- **Produce Items**: Product listings with categories, pricing, and attributes
- **Inventories**: Stock management for produce items
- **Orders & Order Items**: Order processing and line item tracking

### Authentication System
- Session-based authentication using express-session
- Role-based access control (farmer, buyer, admin)
- PostgreSQL session storage for persistence
- Middleware for protecting routes and role validation

### API Structure
RESTful API endpoints organized by domain:
- `/api/auth/*` - Authentication and user management
- `/api/produce/*` - Produce item CRUD operations
- `/api/farms/*` - Farm management
- `/api/orders/*` - Order processing
- `/api/admin/*` - Admin dashboard functionality

### Frontend Pages & Components
- **Public pages**: Home, browse produce, farm details, authentication
- **Protected pages**: Cart, farmer dashboard, admin dashboard
- **Reusable components**: ProduceCard, FarmCard, UI components from shadcn/ui
- **Custom hooks**: useAuth, useCart for state management

## Data Flow

1. **User Authentication**: Session-based auth with PostgreSQL session store
2. **Product Discovery**: Browse/search produce with filtering by category and location
3. **Shopping Cart**: Client-side cart management with persistent storage
4. **Order Processing**: Order creation with payment integration (Stripe mock)
5. **Notifications**: Email confirmations via SendGrid (mock implementation)
6. **Error Tracking**: Sentry integration for production error monitoring (optional)

## External Dependencies

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Fast development server and build tool
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Production server bundling

### UI/UX Libraries
- **Tailwind CSS**: Utility-first styling framework
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Icon library
- **React Hook Form**: Form validation and handling

### Backend Services (Stubbed)
- **Stripe**: Payment processing (mock implementation for development)
- **SendGrid**: Email notifications (mock implementation for development)
- **Sentry**: Error tracking (optional, mock implementation)

### Database & Infrastructure
- **PostgreSQL**: Primary database
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Express Session**: Session management with PostgreSQL store

## Deployment Strategy

### Development Environment
- **Replit configuration**: Optimized for Replit development with auto-restart
- **Development server**: `npm run dev` starts both frontend and backend
- **Database**: PostgreSQL module provisioned in Replit environment
- **Hot reloading**: Vite HMR for frontend, tsx watch mode for backend

### Production Build
- **Frontend build**: Vite builds optimized React bundle to `dist/public`
- **Backend build**: ESBuild bundles server to `dist/index.js`
- **Static serving**: Express serves built frontend from public directory
- **Environment variables**: All external services configured via environment variables

### Replit Deployment
- **Auto-scale deployment**: Configured for Replit's auto-scale deployment target
- **Port configuration**: Application runs on port 5000, mapped to external port 80
- **Build process**: Automated build step runs `npm run build` before deployment
- **Start command**: Production starts with `npm run start`

## Changelog
- June 24, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.