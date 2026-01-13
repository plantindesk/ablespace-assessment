# World of Books Scraper API

A production-grade NestJS backend API that scrapes and catalogs books from the World of Books website. The application provides RESTful endpoints for accessing categories, products, and search functionality with intelligent caching and automatic data refresh capabilities.

## Features

- **Web Scraping**: Automated scraping of World of Books website using Playwright and Crawlee
- **Intelligent Caching**: MongoDB-based storage with 24-hour staleness detection
- **Auto-Refresh**: On-demand scraping when data is stale or missing
- **Search Functionality**: Full-text search across products
- **Pagination**: Efficient pagination support for large datasets
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Health Monitoring**: Built-in health check endpoints
- **Batch Processing**: Support for bulk scraping operations

## Tech Stack

### Core Framework

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **Node.js** >= 20.0.0

### Database & ORM

- **MongoDB** - NoSQL document database
- **Mongoose** - MongoDB object modeling

### Web Scraping

- **Crawlee** (v3.15.3) - Web scraping toolkit
- **Playwright** (v1.57.0) - Headless browser automation
- **Cheerio** (v1.1.2) - Fast HTML parsing

### API & Documentation

- **Express** - HTTP server
- **Swagger** - API documentation
- **Class Validator** - DTO validation
- **Class Transformer** - Object transformation

### Development & Testing

- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **SWC** - Fast TypeScript compiler
- **Biome** - Linting and formatting tool

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0 OR **pnpm** (recommended)
- **MongoDB** - Either local installation or MongoDB Atlas cloud instance

## Installation


1. **Install dependencies**

```bash
npm install
# OR
pnpm install
```

## Configuration

Create a `.env` file in the root directory with the following environment variables:

```env
ALLOWRED_ORIGIN=http://localhost:3000 # Or your frontend domain
# MongoDB Connection URI
MONGODB_URI=mongodb://localhost:27017/worldofbooks
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/worldofbooks?retryWrites=true&w=majority

# Server Port (default: 3000)
PORT=3000
```

**Note**: Ensure your MongoDB instance is running before starting the application.

## Usage

### Development Mode

Run the application in development mode with hot-reload:

```bash
npm run start:dev
```

### Production Mode

Build and run in production mode:

```bash
# Build the project
npm run build

# Start the production server
npm run start:prod
```

### Debug Mode

Run with debugging enabled:

```bash
npm run start:debug
```

## API Endpoints

### Catalog Endpoints

#### Get All Categories

```http
GET /api/catalog/categories
```

Returns a list of all book categories. Automatically seeds from the homepage if the database is empty.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "productCount": number,
      "lastScrapedAt": "ISO8601-date"
    }
  ]
}
```

#### Get Category with Products

```http
GET /api/catalog/category/:slug?page=1&limit=20
```

Retrieves a specific category with paginated products. Automatically scrapes if data is stale (>24 hours) or missing.

**Query Parameters:**

- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

#### Refresh Category

```http
POST /api/catalog/category/:slug/refresh
```

Forces an immediate refresh of category data from the source.

#### Get Product Details

```http
GET /api/catalog/product/:slug
```

Retrieves detailed information about a specific product. Automatically scrapes if data is missing or stale.

#### Refresh Product

```http
POST /api/catalog/product/:slug/refresh
```

Forces an immediate refresh of product data from the source.

#### Search Products

```http
GET /api/catalog/search?q=query&page=1&limit=20
```

Searches for products by title or source ID.

**Query Parameters:**

- `q` (required) - Search query (minimum 2 characters)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

### Scraper Endpoints

#### Health Check

```http
GET /api/scraper/health
```

Checks if the scraper can connect to World of Books website.

#### Scrape Categories

```http
GET /api/scraper/categories
```

Manually triggers scraping of all categories from the homepage.

#### Scrape Category

```http
GET /api/scraper/category/:slug?page=1
```

Manually triggers scraping of a specific category page.

#### Scrape Product

```http
GET /api/scraper/product/:slug
```

Manually triggers scraping of a specific product page.

## API Documentation

Once the application is running, access the interactive Swagger documentation at:

```
http://localhost:3000/api
```

## Project Structure

```
backend/
├── src/
│   ├── app.controller.ts           # Root controller
│   ├── app.module.ts               # Root application module
│   ├── app.service.ts              # Root application service
│   ├── main.ts                     # Application entry point
│   │
│   ├── catalog/                    # Catalog module
│   │   ├── catalog.controller.ts   # Catalog API endpoints
│   │   ├── catalog.module.ts       # Catalog module definition
│   │   ├── catalog.service.ts      # Catalog business logic
│   │   ├── dto/                    # Data Transfer Objects
│   │   │   ├── category-response.dto.ts
│   │   │   ├── pagination.dto.ts
│   │   │   └── product-reponse.dto.ts
│   │   ├── interfaces/             # TypeScript interfaces
│   │   │   └── catalog.interfaces.ts
│   │   └── mappers/                # Data mapping logic
│   │       └── catalog.mapper.ts
│   │
│   ├── database/                   # Database module
│   │   ├── database.module.ts      # Database module definition
│   │   └── schemas/                # Mongoose schemas
│   │       ├── category.schema.ts
│   │       ├── navigation.schema.ts
│   │       ├── product-detail.schema.ts
│   │       ├── product.schema.ts
│   │       ├── review.schema.ts
│   │       ├── scrape-job.schema.ts
│   │       └── view-history.schema.ts
│   │
│   └── scraper/                    # Scraper module
│       ├── scraper.controller.ts   # Scraper API endpoints
│       ├── scraper.module.ts       # Scraper module definition
│       ├── scraper.service.ts      # Scraping business logic
│       ├── product-list.parser.ts  # Product list HTML parser
│       └── config/                 # Scraper configuration
│           └── scraper.config.ts
│
├── test/                           # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── dist/                           # Compiled JavaScript (generated)
├── storage/                        # Crawlee storage (generated)
├── .env                            # Environment variables (create this)
├── .gitignore
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```

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

To customize these values, modify the `stalenessConfig` in `src/catalog/catalog.service.ts`.

## Testing

Run unit tests:

```bash
npm run test
```

Run tests with coverage:

```bash
npm run test:cov
```

Run E2E tests:

```bash
npm run test:e2e
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Linting and Formatting

Check code for linting issues:

```bash
npm run lint
```

Format code with Prettier:

```bash
npm run format
```

## Available Scripts

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `npm run build`       | Build the project                    |
| `npm run format`      | Format code with Prettier            |
| `npm run start`       | Start the application                |
| `npm run start:dev`   | Start in development mode with watch |
| `npm run start:debug` | Start in debug mode                  |
| `npm run start:prod`  | Start in production mode             |
| `npm run lint`        | Run ESLint                           |
| `npm run test`        | Run unit tests                       |
| `npm run test:watch`  | Run tests in watch mode              |
| `npm run test:cov`    | Run tests with coverage              |
| `npm run test:e2e`    | Run E2E tests                        |

## CORS Configuration

The application is configured to accept requests from any origin in development mode. For production, update the CORS configuration in `src/main.ts`:

```typescript
app.enableCors({
  origin: 'https://your-frontend-domain.com',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
});
```

## Troubleshooting

### MongoDB Connection Issues

Ensure your MongoDB instance is running and accessible:

```bash
# For local MongoDB
mongod

# Test connection
mongosh mongodb://localhost:27017/worldofbooks
```

### Playwright Browser Installation

If Playwright browsers are not installed, run:

```bash
npx playwright install
```

### Scraping Errors

If scraping fails with 403/429 errors:

- The target site may be blocking automated requests
- Try reducing `maxRequestsPerMinute` in `src/scraper/scraper.service.ts`
- Wait some time before retrying

### Database Empty

If the database appears empty:

1. Call `GET /api/catalog/categories` to seed categories
2. Or call `GET /api/scraper/categories` to manually scrape

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
