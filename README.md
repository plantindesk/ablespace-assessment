# Able's Place - Full-Stack E-Commerce Application

A full-stack e-commerce application consisting of a production-grade NestJS backend API and a modern Next.js 16 frontend. The application scrapes and catalogs books from the World of Books website, providing users with a seamless browsing and shopping experience.

## Overview

This project is a monorepo containing two main applications:

- **Backend**: NestJS API with web scraping capabilities using Playwright and Crawlee, MongoDB storage, intelligent caching with automatic refresh, and comprehensive API documentation via Swagger.
- **Frontend**: Next.js 16 application with React 19, featuring responsive design, real-time search, product catalog browsing, and TanStack Query for efficient data fetching.

## Tech Stack

### Backend
- **Framework**: NestJS 11.1.11 (Progressive Node.js framework)
- **Language**: TypeScript 5.9.3
- **Runtime**: Node.js >= 20.0.0
- **Database**: MongoDB with Mongoose ODM
- **Web Scraping**: Crawlee 3.15.3, Playwright 1.57.0, Cheerio 1.1.2
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Class Validator, Class Transformer
- **Testing**: Jest
- **Linting/Formatting**: Biome, ESLint, Prettier

### Frontend
- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack Query 5
- **Components**: Radix UI
- **Icons**: Lucide React
- **Linting/Formatting**: Biome
- **Language**: TypeScript

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0 OR **pnpm** (recommended)
- **MongoDB** - Either local installation or MongoDB Atlas cloud instance

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd ablesplace-assessment
```

2. **Install backend dependencies**

```bash
cd backend
npm install
# OR
pnpm install
```

3. **Install frontend dependencies**

```bash
cd ../frontend
npm install
# OR
pnpm install
```

## Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory with the following environment variables:

```env
# MongoDB Connection URI
MONGODB_URI=mongodb://localhost:27017/worldofbooks
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/worldofbooks?retryWrites=true&w=majority

# Server Port (default: 3000)
PORT=3000
```

### Frontend Configuration

The frontend connects to the backend API via the configuration in `frontend/src/lib/api.ts`. Ensure the backend API URL matches your setup (default: `http://localhost:3000`).

**Note**: Ensure your MongoDB instance is running before starting the backend application.

## Usage

### Running the Backend

Navigate to the `backend/` directory and run:

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The backend API will be available at: `http://localhost:3000`

### Running the Frontend

Navigate to the `frontend/` directory and run:

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The frontend application will be available at: `http://localhost:3000`

**Note**: Both frontend and backend default to port 3000. You may need to change the port for one of them to avoid conflicts. To change the backend port, update the `PORT` variable in `backend/.env`. To change the frontend port, run `npm run dev -- -p 3001`.

### Full Development Workflow

For local development, you should run both applications simultaneously:

**Terminal 1 (Backend):**
```bash
cd backend
npm run start:dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev -- -p 3001
```

Access the frontend at `http://localhost:3001`

## API Documentation

Once the backend application is running, access the interactive Swagger documentation at:

```
http://localhost:3000/api
```

### Key API Endpoints

#### Catalog Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/catalog/categories` | Get all book categories |
| `GET` | `/api/catalog/category/:slug` | Get category with paginated products |
| `POST` | `/api/catalog/category/:slug/refresh` | Force refresh category data |
| `GET` | `/api/catalog/product/:slug` | Get product details |
| `POST` | `/api/catalog/product/:slug/refresh` | Force refresh product data |
| `GET` | `/api/catalog/search` | Search products |

#### Scraper Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/scraper/health` | Check scraper health |
| `GET` | `/api/scraper/categories` | Manually scrape categories |
| `GET` | `/api/scraper/category/:slug` | Manually scrape a category |
| `GET` | `/api/scraper/product/:slug` | Manually scrape a product |

## Project Structure

```
ablesplace-assessment/
├── backend/                      # NestJS Backend API
│   ├── src/
│   │   ├── app/                  # Root application files
│   │   ├── catalog/              # Catalog module (categories, products)
│   │   │   ├── dto/              # Data Transfer Objects
│   │   │   ├── interfaces/       # TypeScript interfaces
│   │   │   └── mappers/          # Data mapping logic
│   │   ├── database/             # Database module
│   │   │   └── schemas/          # Mongoose schemas
│   │   └── scraper/              # Web scraper module
│   │       └── config/           # Scraper configuration
│   ├── test/                     # E2E tests
│   ├── .env                      # Environment variables (create this)
│   ├── package.json
│   └── README.md                 # Backend documentation
│
├── frontend/                     # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                  # Next.js app router pages
│   │   │   ├── category/         # Category listing pages
│   │   │   ├── product/          # Product detail pages
│   │   │   └── search/           # Search results page
│   │   ├── components/           # React components
│   │   │   └── ui/              # Radix UI components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utility functions and API client
│   │   ├── providers/            # React context providers
│   │   └── types/                # TypeScript type definitions
│   ├── public/                   # Static assets
│   ├── package.json
│   └── README.md                 # Frontend documentation
│
└── README.md                     # This file
```

## Features

### Backend Features
- **Web Scraping**: Automated scraping of World of Books website using Playwright and Crawlee
- **Intelligent Caching**: MongoDB-based storage with 24-hour staleness detection
- **Auto-Refresh**: On-demand scraping when data is stale or missing
- **Search Functionality**: Full-text search across products
- **Pagination**: Efficient pagination support for large datasets
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Health Monitoring**: Built-in health check endpoints
- **Batch Processing**: Support for bulk scraping operations

### Frontend Features
- Browse product categories
- View product details with multiple conditions (new, like_new, very_good, good, acceptable)
- Search functionality with pagination
- Loading states and error handling
- Responsive design (mobile-first approach)
- Skeleton loading screens
- Modern UI components using Radix UI

## Data Models

### Category
- `title` - Category name
- `slug` - URL-friendly identifier
- `product_count` - Number of products
- `last_scraped_at` - Last update timestamp
- `navigation_id` - Reference to navigation

### Product
- `source_id` - Source product ID
- `title` - Product title
- `price` - Current price
- `currency` - Currency code (GBP, USD, EUR)
- `image_url` - Main image URL
- `source_url` - Original source URL
- `category_ids` - Associated categories
- `last_scraped_at` - Last update timestamp

### ProductDetail
- `description` - Product description
- `specs` - Product specifications
- `conditions` - Available conditions (new, like_new, very_good, good, acceptable)
- `in_stock` - Stock availability
- `rrp` - Recommended retail price
- `series` - Series name

## Staleness Configuration

Data is automatically refreshed when it becomes stale:

- **Categories**: 24 hours
- **Products**: 24 hours

To customize these values, modify the `stalenessConfig` in `backend/src/catalog/catalog.service.ts`.

## Available Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run build` | Build the project |
| `npm run format` | Format code with Biome |
| `npm run start` | Start the application |
| `npm run start:dev` | Start in development mode with watch |
| `npm run start:debug` | Start in debug mode |
| `npm run start:prod` | Start in production mode |
| `npm run lint` | Run Biome linter |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run test:e2e` | Run E2E tests |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run Biome linter |
| `npm run format` | Format code with Biome |

## Troubleshooting

### MongoDB Connection Issues

Ensure your MongoDB instance is running and accessible:

```bash
# For local MongoDB
mongod

# Test connection
mongosh mongodb://localhost:27017/worldofbooks
```

### Port Conflicts

Both frontend and backend default to port 3000. To resolve conflicts:

**Change Backend Port:**
Update `PORT=3001` in `backend/.env`

**Change Frontend Port:**
Run `npm run dev -- -p 3001` in the frontend directory

Update the API URL in `frontend/src/lib/api.ts` accordingly.

### Playwright Browser Installation

If Playwright browsers are not installed in the backend:

```bash
cd backend
npx playwright install
```

### Scraping Errors

If scraping fails with 403/429 errors:
- The target site may be blocking automated requests
- Try reducing `maxRequestsPerMinute` in `backend/src/scraper/scraper.service.ts`
- Wait some time before retrying

### Database Empty

If the backend database appears empty:
1. Call `GET /api/catalog/categories` to seed categories automatically
2. Or call `GET /api/scraper/categories` to manually scrape all categories

## Development Guidelines

### Code Style

Both frontend and backend use Biome for linting and formatting. Before committing changes, ensure your code passes linting:

```bash
# Backend
cd backend
npm run lint
npm run format

# Frontend
cd frontend
npm run lint
npm run format
```

### Testing

Run tests before pushing changes:

```bash
# Backend
cd backend
npm run test
npm run test:e2e
```

### Branching Strategy

1. Create feature branches from `main`
2. Follow conventional commit message format
3. Ensure all tests pass before creating PR
4. Update documentation for new features

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Additional Documentation

- [Backend README](./backend/README.md) - Detailed backend documentation
- [Frontend README](./frontend/README.md) - Detailed frontend documentation
- [API Documentation](http://localhost:3000/api) - Interactive Swagger UI (when backend is running)
