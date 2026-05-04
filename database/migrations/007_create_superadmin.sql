-- =====================================================
-- MIGRATION 007: Create Clinident superadmin user
-- =====================================================

-- Crear usuario superadmin para la plataforma Clinident
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Verificar si el usuario ya existe
    SELECT id INTO v_user_id FROM public.users WHERE email = 'info@trycompany.eu';

    IF v_user_id IS NULL THEN
        -- Crear nuevo usuario
        INSERT INTO public.users (email, password_hash, is_superadmin, is_active)
        VALUES (
            'info@trycompany.eu',
            public.hash_password('Try2026**'),
            true,
            true
        )
        RETURNING id INTO v_user_id;

        -- Crear profile
        INSERT INTO public.profiles (user_id, full_name)
        VALUES (v_user_id, 'Administrador Clinident');

        -- Crear rol admin (legacy compatibility)
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'admin');

        RAISE NOTICE 'Superadmin creado: info@trycompany.eu';
    ELSE
        -- Actualizar usuario existente
        UPDATE public.users
        SET password_hash = public.hash_password('Try2026**'),
            is_superadmin = true,
            is_active = true
        WHERE id = v_user_id;

        RAISE NOTICE 'Superadmin actualizado: info@trycompany.eu';
    END IF;
END $$;
