-- 03_initial_data.sql: Seed Data
-- This script populates the database with required initial records.

-- 1. Default Global Settings
INSERT INTO global_settings (id, app_name, theme_color, maintenance_mode, global_modules)
VALUES (
    'default', 
    'Portfy', 
    '#FF3D00', 
    FALSE, 
    '{"crm": true, "tasks": true, "map": true, "ai": true, "gamification": true}'::JSONB
)
ON CONFLICT (id) DO UPDATE SET
    app_name = EXCLUDED.app_name,
    theme_color = EXCLUDED.theme_color,
    maintenance_mode = EXCLUDED.maintenance_mode,
    global_modules = EXCLUDED.global_modules,
    updated_at = NOW();
