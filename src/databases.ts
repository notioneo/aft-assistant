import { BlockObjectResponse, CreatePageParameters, QueryDatabaseResponse } from "https://deno.land/x/notion_sdk@v1.0.4/src/api-endpoints.ts";
import { Client } from "https://deno.land/x/notion_sdk@v1.0.4/src/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";
import "https://deno.land/x/dotenv/load.ts";

const NOTION_TOKEN = Deno.env.get("NOTION");
const DATABASE_PAGE = Deno.env.get("DATABASE");

console.log('NOTION_TOKEN:', NOTION_TOKEN);
console.log('DATABASE_PAGE:', DATABASE_PAGE);

if (!NOTION_TOKEN || !DATABASE_PAGE) {
    throw new Error("Notion token or database IDs not found. Please, re-check the values again or write a support request to contact@notioneo.com.");
}

// Initialize a new Notion API client
const notion = new Client({
    auth: NOTION_TOKEN,
});

export enum DatabaseType {
    Transactions = "transactions",
    Month = "month",
    Categories = "categories",
}

export async function getDatabaseId(database: DatabaseType, retryCount = 0): Promise<string> {
  try {
    const results = (await notion.blocks.children.list({ block_id: DATABASE_PAGE })).results as BlockObjectResponse[];
    const databaseId = (results).filter(r =>
      r?.type === "child_database" &&
      r.child_database?.title.toLowerCase() === database.toLowerCase()
    )?.[0].id || '';

    console.log(`Database ID for ${database}:`, databaseId);

    if (!databaseId) {
      throw new Error(`Database ID not found for ${database}.`);
    }

    return databaseId;
  } catch (error) {
    console.error(`Error retrieving database ID for ${database}:`, error);
    if (retryCount < 10) {
      const retryDelay = 5000; // 5 seconds
      console.log(`Retrying "getDatabaseId" for ${database} in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      await getDatabaseId(database, retryCount + 1);
    } else {
      throw error; // Exceeded maximum retry attempts, propagate the error
    }
  }
}
