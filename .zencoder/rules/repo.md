---
description: Repository Information Overview
alwaysApply: true
---

# Nolads Engineering Information

## Summary
A React-based web application for Nolads Engineering, a company providing electrical engineering services. The application includes a public-facing website with company information, services, products, blog, and contact features, as well as an admin dashboard for content management.

## Structure
- **client/**: Main React application code (components, pages, hooks, etc.)
- **shared/**: Shared types and utilities between client and server
- **public/**: Static assets (images, icons, etc.)
- **scripts/**: Utility scripts for development
- **dist/**: Production build output
- **uploads/**: User-uploaded files

## Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: ES2020 target
**Runtime**: Node.js (>=20.19.2)
**Framework**: React 18.3.1
**Build System**: Vite 6.2.2
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React (18.3.1) and React DOM (18.3.1)
- React Router DOM (6.30.1)
- Supabase (2.56.1) for backend services
- Radix UI components for UI elements
- Tailwind CSS (3.4.11) for styling
- Framer Motion (12.6.2) for animations
- React Hook Form (7.53.0) for form handling
- Zod (3.25.76) for validation
- Zustand (5.0.6) for state management

**Development Dependencies**:
- TypeScript (5.5.3)
- Vite (6.2.2) with SWC plugin
- Vitest (3.2.4) for testing
- Tailwind CSS plugins
- React Three Fiber/Drei for 3D effects

## Build & Installation
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Type checking
npm run typecheck

# Production build
npm run build

# Preview production build
npm run preview
```

## SEO Implementation
**Static SEO**: Base SEO tags defined in index.html
- Title: "Nolads Engineering - Power Your Future"
- Description: "Leading electrical engineering services for industrial applications. Power systems design, safety solutions, automation, and performance monitoring."
- Keywords: "electrical engineering, power systems, industrial automation, safety solutions, electrical design, power distribution"

**Dynamic SEO**: Implemented via useSEO.tsx hook
- Default title: "Nolads Engineering - Power Your Future"
- Default description: "Leading electrical engineering services for Generator Installations, Industrial applications, Power systems design and installations and performance monitoring."
- Default keywords: "electrical engineering, power systems, industrial automation, safety solutions, electrical design, power distribution, SCADA, PLC programming"

**Note**: There's a discrepancy between the static SEO content in index.html and the default values in the useSEO hook. The hook's description is more specific about generator installations, while the static description is more general.

## Database
**Type**: Supabase (PostgreSQL)
**Schema**: SQL schema defined in supabase-schema.sql
**Tables**: Users, Services, Products, Quotes, Contact Messages, Blog Posts, Testimonials
**API**: Client-side Supabase API integration in client/lib/supabase-api.ts

## Application Structure
**Entry Point**: client/App.tsx
**Routing**: React Router with lazy-loaded page components
**State Management**: Zustand store and React Context
**UI Components**: Combination of custom components and Radix UI primitives
**Authentication**: Supabase authentication with protected routes

## Features
- PWA support with service worker
- Page transitions and animations
- Blog system with markdown support
- Admin dashboard for content management
- Contact form and quote request system
- Product catalog with filtering
- Services showcase
- Responsive design with Tailwind CSS
- Dynamic SEO management with React hooks
- Live chat integration with Tawk.to