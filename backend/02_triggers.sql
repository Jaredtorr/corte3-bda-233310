-- =============================================================
-- CORTE 3 BDA · UP Chiapas
-- 02_triggers.sql
-- Trigger: trg_historial_cita
-- =============================================================

-- -------------------------------------------------------------
-- FUNCTION del trigger
-- Se ejecuta AFTER INSERT en la tabla citas.
-- Registra automáticamente el evento en historial_movimientos.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trigger_historial_cita()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    INSERT INTO historial_movimientos (tipo, referencia_id, descripcion)
    VALUES (
        'CITA_INSERTADA',
        NEW.id,
        FORMAT('Nueva cita: id=%s, mascota_id=%s, vet_id=%s, fecha=%s, estado=%s',
               NEW.id, NEW.mascota_id, NEW.veterinario_id, NEW.fecha_hora, NEW.estado)
    );
    RETURN NEW;
END;
$$;

-- -------------------------------------------------------------
-- TRIGGER sobre la tabla citas
-- -------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_historial_cita ON citas;

CREATE TRIGGER trg_historial_cita
    AFTER INSERT ON citas
    FOR EACH ROW
    EXECUTE FUNCTION fn_trigger_historial_cita();