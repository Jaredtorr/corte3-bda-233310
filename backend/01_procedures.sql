-- =============================================================
-- CORTE 3 BDA · UP Chiapas
-- 01_procedures.sql
-- Procedure: sp_agendar_cita
-- Function:  fn_total_facturado
-- =============================================================

-- -------------------------------------------------------------
-- FUNCTION: fn_total_facturado
-- Devuelve el total facturado a una mascota en un año dado.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_total_facturado(
    p_mascota_id INT,
    p_anio       INT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_total NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(costo), 0)
    INTO   v_total
    FROM   citas
    WHERE  mascota_id = p_mascota_id
      AND  EXTRACT(YEAR FROM fecha_hora) = p_anio
      AND  estado = 'COMPLETADA';

    RETURN v_total;
END;
$$;

-- -------------------------------------------------------------
-- PROCEDURE: sp_agendar_cita
-- Agenda una cita validando:
--   1. La mascota existe.
--   2. El veterinario existe y está activo.
--   3. El veterinario no descansa ese día de la semana.
--   4. No existe ya una cita AGENDADA para ese vet en esa hora.
-- -------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_agendar_cita(
    p_mascota_id     INT,
    p_veterinario_id INT,
    p_fecha_hora     TIMESTAMP,
    p_motivo         TEXT,
    INOUT p_cita_id  INT DEFAULT NULL
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_vet_activo     BOOLEAN;
    v_dias_descanso  VARCHAR(50);
    v_dia_semana     TEXT;
    v_mascota_existe BOOLEAN;
    v_conflicto      INT;
BEGIN
    -- 1. Verificar que la mascota existe
    SELECT EXISTS(SELECT 1 FROM mascotas WHERE id = p_mascota_id)
    INTO   v_mascota_existe;

    IF NOT v_mascota_existe THEN
        RAISE EXCEPTION 'La mascota con id % no existe.', p_mascota_id;
    END IF;

    -- 2. Verificar que el veterinario existe y está activo
    SELECT activo, dias_descanso
    INTO   v_vet_activo, v_dias_descanso
    FROM   veterinarios
    WHERE  id = p_veterinario_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El veterinario con id % no existe.', p_veterinario_id;
    END IF;

    IF NOT v_vet_activo THEN
        RAISE EXCEPTION 'El veterinario con id % está inactivo.', p_veterinario_id;
    END IF;

    -- 3. Verificar que el veterinario no descansa ese día
    v_dia_semana := LOWER(TO_CHAR(p_fecha_hora, 'TMday'));

    IF v_dias_descanso IS NOT NULL
       AND v_dias_descanso <> ''
       AND v_dias_descanso ILIKE ('%' || v_dia_semana || '%')
    THEN
        RAISE EXCEPTION 'El veterinario descansa los %. No se puede agendar para %.',
                        v_dia_semana, p_fecha_hora;
    END IF;

    -- 4. Verificar conflicto de horario
    SELECT COUNT(*)
    INTO   v_conflicto
    FROM   citas
    WHERE  veterinario_id = p_veterinario_id
      AND  fecha_hora     = p_fecha_hora
      AND  estado         = 'AGENDADA';

    IF v_conflicto > 0 THEN
        RAISE EXCEPTION 'El veterinario ya tiene una cita agendada para esa fecha y hora.';
    END IF;

    -- 5. Insertar la cita
    INSERT INTO citas (mascota_id, veterinario_id, fecha_hora, motivo, estado)
    VALUES (p_mascota_id, p_veterinario_id, p_fecha_hora, p_motivo, 'AGENDADA')
    RETURNING id INTO p_cita_id;

END;
$$;