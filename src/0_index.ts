import dotenv from "dotenv";
import { runMigration } from "./0.1_migrator";

export { runMigration };

if (require.main === module) {
  dotenv.config();
  runMigration().catch(error => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}