import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(__dirname, '../../../.env') });

// Also load from docker.env if it exists (for Docker environments)
config({ path: resolve(__dirname, '../../../docker.env') });
