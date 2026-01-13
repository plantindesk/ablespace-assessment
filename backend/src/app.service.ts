import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getApiStatus() {
    return {
      service: "World of Books Scraper API",
      status: "active",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      documentation: "/api/docs", // Assuming you might add Swagger later
    };
  }
}
