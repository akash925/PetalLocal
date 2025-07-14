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

## Recent Changes
- July 14, 2025: Production-ready drag-and-drop image upload system implemented
  - ✅ Implemented automatic image compression to reduce file sizes and improve performance
  - ✅ Created enhanced drag-and-drop image uploader with file validation and preview
  - ✅ Replaced basic image uploader with professional drag-and-drop component
  - ✅ Added comprehensive file type and size validation for uploaded images
  - ✅ Implemented proper image preview with clear removal functionality
  - ✅ Enhanced Instagram OAuth integration with graceful fallback to manual entry
  - ✅ Fixed "request entity too large" error with intelligent compression
  - ✅ Added visual drag-and-drop zones with hover states and upload progress
  - ✅ Integrated stock photo suggestions for farmers without images
  - ✅ Set moderate server limits (10MB) with client-side compression for efficiency
  - ✅ Fixed critical "ImageUploader is not defined" error across all forms
  - ✅ Added real-time compression statistics showing users exact savings
  - ✅ Implemented intelligent file size reduction with 1200px max dimensions
  - ✅ Enhanced user experience with compression feedback badges
  - Platform now features professional image management with automatic optimization

- July 14, 2025: Critical production fixes and enhanced error handling completed
  - ✅ Fixed search button alignment on home page to be properly positioned
  - ✅ Removed promotional "Keep 90%" text from farmer call-to-action section
  - ✅ Implemented comprehensive data deduplication to prevent duplicate React keys
  - ✅ Added graceful OpenAI API quota exceeded error handling with user-friendly messages
  - ✅ Created real distance calculation utilities using Haversine formula
  - ✅ Enhanced cart-to-signup redirect functionality for seamless user experience
  - ✅ Fixed blob URL image display issues preventing proper image loading
  - ✅ Added backend deduplication logic to prevent duplicate produce entries
  - ✅ Enhanced signup process with proper redirect URL handling for cart checkout
  - ✅ Implemented proper distance calculations for all produce and farm listings
  - Platform now features robust error handling and authentic data integrity

- July 14, 2025: Enhanced UI/UX hardening and professional image management completed
  - ✅ Created professional ImageUploader component with URL validation and preview
  - ✅ Implemented comprehensive Instagram OAuth integration service
  - ✅ Enhanced Stripe payment system with improved metadata tracking
  - ✅ Added professional image uploader to farm and produce forms
  - ✅ Created Instagram Connect component with OAuth authentication flow
  - ✅ Fixed duplicate key warnings in React components for better performance
  - ✅ Enhanced payment intent creation with proper order management
  - ✅ Added comprehensive error handling and validation throughout forms
  - ✅ Instagram integration now supports manual handle entry and OAuth connection
  - Platform now features professional image management and enhanced social media integration

- July 11, 2025: Instagram integration and comprehensive review system implemented
  - ✅ Added Instagram handle field to farm profiles with proper form validation
  - ✅ Instagram links display with social media icons and proper URL formatting
  - ✅ Built complete review system with 5-star ratings and written comments
  - ✅ Review form prevents farmers from rating their own farms
  - ✅ Review list shows customer feedback with reviewer names and dates
  - ✅ Enhanced farm profiles with buyer rating functionality
  - ✅ Edit Farm button now smoothly scrolls to form section
  - ✅ Proper error handling for review submission and authentication
  - ✅ Created useAuth hook for consistent authentication state management
  - Platform now features authentic customer reviews and social media integration

- July 10, 2025: Interactive map integration and user location centering completed
  - ✅ Integrated free OpenStreetMap API with Leaflet for interactive farm locations
  - ✅ Real-time map with organic/conventional farm color coding and legend
  - ✅ Maps prioritize user's geolocation, fallback to California center when denied
  - ✅ Fixed cart persistence bug - cart now clears properly when logged out
  - ✅ Auth-aware cart management prevents items showing for non-authenticated users
  - ✅ Enhanced produce map showing farms with available items and pricing
  - ✅ Robust coordinate validation prevents map crashes from invalid data
  - ✅ Both farm and produce maps fully functional with user location centering
  - Platform now features authentic interactive mapping with real farm data

- June 24, 2025: Complete FarmDirect marketplace built and deployed
  - Fixed SelectItem component errors preventing produce/farms pages from loading
  - Added missing farms browse page with search/filter functionality
  - Implemented complete API endpoints for farms and produce
  - Seeded database with 6 produce items from 2 farms
  - All core marketplace features working: browse, search, cart, authentication
  - Payment processing and email notifications integrated

## User Preferences
Preferred communication style: Simple, everyday language.