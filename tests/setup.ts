import { config } from "dotenv"
import { readFileSync } from "node:fs"

// Load environment variables for tests
const envConfig = config({ path: ".env.development" })

// Mock DATABASE_URL for tests
process.env.DATABASE_URL = envConfig.parsed?.DATABASE_URL || "postgresql://test:test@localhost:5432/test_db"
