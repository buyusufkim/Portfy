-- Adım 0: Eski unique constraint'leri kaldır (artık tier unique değil, code unique)
ALTER TABLE public.subscription_packages DROP CONSTRAINT IF EXISTS subscription_packages_tier_key;
DROP INDEX IF EXISTS public.subscription_packages_tier_key;

-- Adım 1: code isimli text kolonunu ekle (yoksa)
ALTER TABLE public.subscription_packages ADD COLUMN IF NOT EXISTS code TEXT;

-- Geçici bir doldurma işlemi (mevcut kayıtlarda code yoksa id ile aynı olmasın diye tier+interval kullanabiliriz ama bu basitçe id::text kalsın veya uygun şekil alsın)
UPDATE public.subscription_packages
SET code = id::text
WHERE code IS NULL;

-- Adım 2: Unique index ekle
CREATE UNIQUE INDEX IF NOT EXISTS subscription_packages_code_key
ON public.subscription_packages(code);

-- Adım 3: Eski paketleri pasif yap
UPDATE public.subscription_packages
SET is_active = false
WHERE code IN ('pro', 'elite', 'master_lifetime', 'lifetime', '9-month')
   OR tier IN ('pro', 'elite'); -- garanti olsun eski verilerde code uuid olarak kaldıysa tier üzerinden pasif yapalım

-- Adım 4: Yeni ve mevcut paketleri UPSERT et (conflict on code)
-- 1) Girişimci
INSERT INTO public.subscription_packages (
    name, description, price_text, price_numeric, "interval", badge, is_popular, is_active, tier, features, code
) VALUES (
    'Girişimci',
    'Portfy’yi tanımak ve temel dijital düzen kurmak isteyen danışmanlar için.',
    '0 TL',
    0,
    '/ömür boyu',
    null,
    false,
    true,
    'free',
    '["Temel CRM", "Sınırlı portföy ve müşteri yönetimi", "Günlük akış ve temel görevler", "25.000 AI token / ay", "Girişimci özellikleri"]'::jsonb,
    'free'
) ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_text = EXCLUDED.price_text,
    price_numeric = EXCLUDED.price_numeric,
    "interval" = EXCLUDED."interval",
    badge = EXCLUDED.badge,
    is_popular = EXCLUDED.is_popular,
    is_active = EXCLUDED.is_active,
    tier = EXCLUDED.tier,
    features = EXCLUDED.features;

-- 2) Master / Aylık
INSERT INTO public.subscription_packages (
    name, description, price_text, price_numeric, "interval", badge, is_popular, is_active, tier, features, code
) VALUES (
    'Master',
    'Portföy, CRM, AI Koç, Bölgem ve 90 Günlük Danışman Kampı’nı tam kullanmak isteyen danışmanlar için.',
    '499 TL',
    499,
    '/ay',
    null,
    false,
    true,
    'master',
    '["Tüm modüller", "AI Koç", "Portföy Pazarlama Üretimi", "90 Günlük Danışman Kampı", "Bölgem", "300.000 AI token / ay"]'::jsonb,
    '1-month'
) ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_text = EXCLUDED.price_text,
    price_numeric = EXCLUDED.price_numeric,
    "interval" = EXCLUDED."interval",
    badge = EXCLUDED.badge,
    is_popular = EXCLUDED.is_popular,
    is_active = EXCLUDED.is_active,
    tier = EXCLUDED.tier,
    features = EXCLUDED.features;

-- 3) Master / 3 Aylık
INSERT INTO public.subscription_packages (
    name, description, price_text, price_numeric, "interval", badge, is_popular, is_active, tier, features, code
) VALUES (
    'Master',
    'Portföy, CRM, AI Koç, Bölgem ve 90 Günlük Danışman Kampı’nı tam kullanmak isteyen danışmanlar için.',
    '1.250 TL',
    1250,
    '/3 ay',
    'Popüler',
    true,
    true,
    'master',
    '["Tüm modüller", "AI Koç", "Portföy Pazarlama Üretimi", "90 Günlük Danışman Kampı", "Bölgem", "300.000 AI token / ay"]'::jsonb,
    '3-month'
) ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_text = EXCLUDED.price_text,
    price_numeric = EXCLUDED.price_numeric,
    "interval" = EXCLUDED."interval",
    badge = EXCLUDED.badge,
    is_popular = EXCLUDED.is_popular,
    is_active = EXCLUDED.is_active,
    tier = EXCLUDED.tier,
    features = EXCLUDED.features;

-- 4) Master / 6 Aylık
INSERT INTO public.subscription_packages (
    name, description, price_text, price_numeric, "interval", badge, is_popular, is_active, tier, features, code
) VALUES (
    'Master',
    'Portföy, CRM, AI Koç, Bölgem ve 90 Günlük Danışman Kampı’nı tam kullanmak isteyen danışmanlar için.',
    '1.999 TL',
    1999,
    '/6 ay',
    'Avantajlı',
    false,
    true,
    'master',
    '["Tüm modüller", "AI Koç", "Portföy Pazarlama Üretimi", "90 Günlük Danışman Kampı", "Bölgem", "300.000 AI token / ay"]'::jsonb,
    '6-month'
) ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_text = EXCLUDED.price_text,
    price_numeric = EXCLUDED.price_numeric,
    "interval" = EXCLUDED."interval",
    badge = EXCLUDED.badge,
    is_popular = EXCLUDED.is_popular,
    is_active = EXCLUDED.is_active,
    tier = EXCLUDED.tier,
    features = EXCLUDED.features;

-- 5) Master / 12 Aylık
INSERT INTO public.subscription_packages (
    name, description, price_text, price_numeric, "interval", badge, is_popular, is_active, tier, features, code
) VALUES (
    'Master',
    'Portföy, CRM, AI Koç, Bölgem ve 90 Günlük Danışman Kampı’nı tam kullanmak isteyen danışmanlar için.',
    '2.999 TL',
    2999,
    '/12 ay',
    'En Avantajlı',
    false,
    true,
    'master',
    '["Tüm modüller", "AI Koç", "Portföy Pazarlama Üretimi", "90 Günlük Danışman Kampı", "Bölgem", "300.000 AI token / ay"]'::jsonb,
    '12-month'
) ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_text = EXCLUDED.price_text,
    price_numeric = EXCLUDED.price_numeric,
    "interval" = EXCLUDED."interval",
    badge = EXCLUDED.badge,
    is_popular = EXCLUDED.is_popular,
    is_active = EXCLUDED.is_active,
    tier = EXCLUDED.tier,
    features = EXCLUDED.features;

-- En son aktif olmayanları gizle
UPDATE public.subscription_packages
SET is_active = false
WHERE code NOT IN ('free', '1-month', '3-month', '6-month', '12-month');

