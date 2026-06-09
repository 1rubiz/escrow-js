-- Migration 001: Initial Schema
-- Created: 2026-05-21
-- Description: Creates all core tables for the Ruby Escrow transaction ledger

-- This migration is identical to schema.sql for the initial setup
-- Future migrations will be incremental changes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all tables (see schema.sql for full details)
-- This file serves as the first migration record

-- Note: The actual schema creation is handled by schema.sql
-- This file exists for migration tracking purposes

-- Made with Bob