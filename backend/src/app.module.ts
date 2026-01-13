import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CatalogModule } from "./catalog/catalog.module"; // Import this
import { DatabaseModule } from "./database/database.module";
import { ScraperModule } from "./scraper/scraper.module"; // Import this

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make env vars available everywhere
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URI"),
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    ScraperModule,
    CatalogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
