# Frontend

A modern e-commerce frontend application for Able's Place, built with Next.js 16, React 19, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **UI**: React 19.2.3
- **Styling**: Tailwind CSS v4
- **Data Fetching**: TanStack Query 5
- **Components**: Radix UI
- **Linting**: Biome
- **Language**: TypeScript

## Features

- Browse product categories
- View product details with multiple conditions
- Search functionality with pagination
- Loading states and error handling
- Responsive design
- Skeleton loading screens

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome

## Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── category/     # Category pages
│   ├── product/      # Product pages
│   └── search/       # Search page
├── components/       # React components
│   └── ui/          # Radix UI components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── providers/       # React context providers
└── types/           # TypeScript type definitions
```

## API Integration

The application connects to a backend API for:
- Categories
- Products
- Search functionality

All data fetching is handled through TanStack Query hooks located in `src/hooks/`.

## Environment

Ensure the backend API is running and accessible. Configure API endpoints in `src/lib/api.ts`.
