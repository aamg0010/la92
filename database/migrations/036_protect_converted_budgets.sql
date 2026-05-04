-- =====================================================
-- MIGRATION 036: Proteger presupuestos convertidos
-- =====================================================
-- Contexto:
--   Cuando un presupuesto se convierte en factura, el flujo actual marca
--   budgets.status='converted' y guarda converted_invoice_id, conservando
--   el presupuesto original. Sin embargo, no habia ninguna garantia de
--   integridad a nivel de BD: cualquier DELETE manual o por error desde la
--   UI eliminaria el presupuesto y romperia la trazabilidad
--   factura<->presupuesto que es necesaria para auditoria contable y para
--   mostrar al usuario el origen de la factura.
--
--   Esta migracion anade un trigger BEFORE DELETE que rechaza la operacion
--   si el presupuesto esta en estado 'converted'. La UI ya impide el boton
--   Eliminar en este caso, pero la BD aplica la regla aunque alguien la
--   invoque por API directa o por SQL.
--
-- Idempotente: se puede ejecutar varias veces sin efectos secundarios.
-- Se aplica sobre cada schema clinic_*.
-- =====================================================

CREATE OR REPLACE FUNCTION public.prevent_converted_budget_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'converted' AND OLD.converted_invoice_id IS NOT NULL THEN
        RAISE EXCEPTION
            'No se puede eliminar el presupuesto % porque ya fue convertido en factura. Modifica primero el estado o anula la factura asociada.',
            OLD.budget_number
            USING HINT = 'Cambia budgets.status para permitir el borrado o elimina antes la factura referenciada en converted_invoice_id.',
                  ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Aplica el trigger a todos los schemas existentes con tabla budgets.
-- En el momento actual, budgets vive en public (ver MIGRATION 020 que la
-- creo sin schema-qualified, asi que cae en public por search_path). Cuando
-- el fix del leak multi-tenant se aplique y budgets se mueva/duplique a
-- cada clinic_*, este DO block las cubrira automaticamente.
DO $$
DECLARE
    schema_record RECORD;
BEGIN
    FOR schema_record IN
        SELECT schemaname FROM pg_tables
        WHERE tablename = 'budgets'
          AND schemaname IN ('public') OR schemaname LIKE 'clinic_%'
    LOOP
        IF EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = schema_record.schemaname AND tablename = 'budgets'
        ) THEN
            EXECUTE format(
                'DROP TRIGGER IF EXISTS prevent_converted_budget_delete ON %I.budgets',
                schema_record.schemaname
            );
            EXECUTE format(
                'CREATE TRIGGER prevent_converted_budget_delete
                 BEFORE DELETE ON %I.budgets
                 FOR EACH ROW EXECUTE FUNCTION public.prevent_converted_budget_delete()',
                schema_record.schemaname
            );
            RAISE NOTICE 'Trigger prevent_converted_budget_delete aplicado a schema %', schema_record.schemaname;
        END IF;
    END LOOP;
END $$;

-- Asegurar que create_clinic_schema (futuras clinicas) tambien lo aplique.
-- Lo anadimos como complemento idempotente: cuando una clinica nueva ejecute
-- esta misma migracion (o el bootstrap), el bloque DO la cubrira.

NOTIFY pgrst, 'reload schema';
