-- =============================================================
-- CORTE 3 BDA · UP Chiapas
-- 03_views.sql
-- Vista: v_mascotas_vacunacion_pendiente
-- =============================================================

-- -------------------------------------------------------------
-- Vista: v_mascotas_vacunacion_pendiente
--
-- Muestra mascotas con vacunas nunca aplicadas o vencidas
-- (más de 1 año desde la última aplicación).
-- Esta es la consulta más cara del sistema — la cacheamos en Redis.
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_mascotas_vacunacion_pendiente AS
SELECT
    m.id                        AS mascota_id,
    m.nombre                    AS mascota_nombre,
    m.especie,
    d.nombre                    AS dueno_nombre,
    d.telefono                  AS dueno_telefono,
    iv.id                       AS vacuna_id,
    iv.nombre                   AS vacuna_nombre,
    MAX(va.fecha_aplicacion)    AS ultima_aplicacion,
    CASE
        WHEN MAX(va.fecha_aplicacion) IS NULL
            THEN 'NUNCA VACUNADO'
        WHEN MAX(va.fecha_aplicacion) < CURRENT_DATE - INTERVAL '1 year'
            THEN 'VACUNA VENCIDA'
        ELSE 'AL DÍA'
    END                         AS estado_vacuna
FROM mascotas m
JOIN duenos d
    ON d.id = m.dueno_id
CROSS JOIN inventario_vacunas iv
LEFT JOIN vacunas_aplicadas va
    ON va.mascota_id = m.id
    AND va.vacuna_id = iv.id
GROUP BY
    m.id, m.nombre, m.especie,
    d.nombre, d.telefono,
    iv.id, iv.nombre
HAVING
    MAX(va.fecha_aplicacion) IS NULL
    OR MAX(va.fecha_aplicacion) < CURRENT_DATE - INTERVAL '1 year'
ORDER BY m.nombre, iv.nombre;