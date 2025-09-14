-- Tennis Court Database Initialization Script

-- Create database if not exists (this will be handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS tennis_court_db;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE tennis_court_db TO tennis_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO tennis_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tennis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tennis_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tennis_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tennis_user;
