-- =============================================================
-- CORTE 3 BDA · UP Chiapas
-- 05_rls.sql
-- Row-Level Security sobre: mascotas, citas, vacunas_aplicadas
--
-- Mecanismo elegido: SET LOCAL app.current_vet_id
-- La API lo ejecuta al inicio de cada transacción.
-- SET LOCAL hace que el valor solo viva dentro de esa transacción.
-- =============================================================

-- -------------------------------------------------------------
-- 1. TABLA: mascotas
-- Veterinario ve solo sus mascotas asignadas en vet_atiende_mascota.
-- Recepción y admin ven todo.
-- -------------------------------------------------------------
ALTER TABLE mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascotas FORCE ROW LEVEL SECURITY;

CREATE POLICY pol_vet_ver_mascotas
    ON mascotas
    FOR SELECT
    TO rol_veterinario
    USING (
        EXISTS (
            SELECT 1
            FROM   vet_atiende_mascota vam
            WHERE  vam.mascota_id = mascotas.id
              AND  vam.vet_id     = current_setting('app.current_vet_id', TRUE)::INT
              AND  vam.activa     = TRUE
        )
    );

CREATE POLICY pol_recepcion_ver_mascotas
    ON mascotas
    FOR SELECT
    TO rol_recepcion
    USING (TRUE);

CREATE POLICY pol_admin_mascotas
    ON mascotas
    FOR ALL
    TO rol_admin
    USING (TRUE)
    WITH CHECK (TRUE);

-- -------------------------------------------------------------
-- 2. TABLA: citas
-- Veterinario ve solo citas donde él es el vet asignado.
-- Recepción y admin ven todas.
-- -------------------------------------------------------------
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas FORCE ROW LEVEL SECURITY;

CREATE POLICY pol_vet_ver_citas
    ON citas
    FOR SELECT
    TO rol_veterinario
    USING (
        veterinario_id = current_setting('app.current_vet_id', TRUE)::INT
    );

CREATE POLICY pol_vet_insertar_citas
    ON citas
    FOR INSERT
    TO rol_veterinario
    WITH CHECK (
        veterinario_id = current_setting('app.current_vet_id', TRUE)::INT
    );

CREATE POLICY pol_recepcion_ver_citas
    ON citas
    FOR SELECT
    TO rol_recepcion
    USING (TRUE);

CREATE POLICY pol_recepcion_insertar_citas
    ON citas
    FOR INSERT
    TO rol_recepcion
    WITH CHECK (TRUE);

CREATE POLICY pol_admin_citas
    ON citas
    FOR ALL
    TO rol_admin
    USING (TRUE)
    WITH CHECK (TRUE);

-- -------------------------------------------------------------
-- 3. TABLA: vacunas_aplicadas
-- Veterinario ve solo vacunas de sus mascotas.
-- Recepción no tiene GRANT sobre esta tabla (control por permisos).
-- Admin ve todo.
-- -------------------------------------------------------------
ALTER TABLE vacunas_aplicadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacunas_aplicadas FORCE ROW LEVEL SECURITY;

CREATE POLICY pol_vet_ver_vacunas
    ON vacunas_aplicadas
    FOR SELECT
    TO rol_veterinario
    USING (
        EXISTS (
            SELECT 1
            FROM   vet_atiende_mascota vam
            WHERE  vam.mascota_id = vacunas_aplicadas.mascota_id
              AND  vam.vet_id     = current_setting('app.current_vet_id', TRUE)::INT
              AND  vam.activa     = TRUE
        )
    );

CREATE POLICY pol_vet_insertar_vacunas
    ON vacunas_aplicadas
    FOR INSERT
    TO rol_veterinario
    WITH CHECK (
        veterinario_id = current_setting('app.current_vet_id', TRUE)::INT
        AND EXISTS (
            SELECT 1
            FROM   vet_atiende_mascota vam
            WHERE  vam.mascota_id = vacunas_aplicadas.mascota_id
              AND  vam.vet_id     = current_setting('app.current_vet_id', TRUE)::INT
              AND  vam.activa     = TRUE
        )
    );

CREATE POLICY pol_admin_vacunas
    ON vacunas_aplicadas
    FOR ALL
    TO rol_admin
    USING (TRUE)
    WITH CHECK (TRUE);