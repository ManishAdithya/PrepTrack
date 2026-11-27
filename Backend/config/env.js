// Loads settings before anything else runs (imported first in server.js).
// Backend/.env.local holds YOUR private values and is git-ignored; it wins over Backend/.env.
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const backendDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config({ path: path.join(backendDir, ".env.local") });
dotenv.config({ path: path.join(backendDir, ".env") });
