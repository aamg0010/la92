-- Funciones RPC para módulo de Residuos RH1

CREATE OR REPLACE FUNCTION public.get_waste_stats_monthly(
    p_session_token TEXT,
    p_year INTEGER DEFAULT NULL,
    p_month INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'total_kg', 0,
            'biohazard_kg', 0,
            'common_kg', 0,
            'recyclable_kg', 0,
            'pickups_count', 0
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_upcoming_waste_pickups(p_session_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN json_build_object('success', true, 'data', '[]'::json);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_waste_monthly_report(
    p_session_token TEXT,
    p_year INTEGER DEFAULT NULL,
    p_month INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'total_kg', 0,
            'categories', '[]'::json,
            'pickups', '[]'::json,
            'chart_data', '[]'::json
        )
    );
END;
$$;
