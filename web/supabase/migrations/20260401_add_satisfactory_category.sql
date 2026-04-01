-- Migration to add 'satisfactory' to aqi_category enum
-- Run this in your Supabase SQL Editor if you are using a hosted database.

ALTER TYPE public.aqi_category ADD VALUE IF NOT EXISTS 'satisfactory' AFTER 'good';
