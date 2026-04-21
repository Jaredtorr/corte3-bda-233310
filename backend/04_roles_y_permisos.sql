-- =============================================================
-- CORTE 3 BDA · UP Chiapas
-- 04_roles_y_permisos.sql
-- Roles: rol_veterinario, rol_recepcion, rol_admin
-- Principio de mínimo privilegio aplicado por tabla.
-- =============================================================

-- -------------------------------------------------------------
-- Limpiar roles previos si existen
-- -------------------------------------------------------------
DROP ROLE IF EXISTS rol_veterinario;
DROP ROLE IF EXISTS rol_recepcion;
DROP ROLE IF EXISTS rol_admin;

-- -------------------------------------------------------------
-- Crear los tres roles
-- -------------------------------------------------------------
CREATE ROLE rol_veterinario NOLOGIN;
CREATE ROLE rol_recepcion   NOLOGIN;
CREATE ROLE rol_admin       NOLOGIN;

-- =============================================================
-- ROL: rol_veterinario
-- Ve y opera SOLO sobre datos de sus mascotas.
-- RLS filtra las filas — GRANT controla las tablas.
-- =============================================================
GRANT SELECT          ON duenos                TO rol_veterinario;
GRANT SELECT          ON mascotas              TO rol_veterinario;
GRANT SELECT, INSERT  ON citas                 TO rol_veterinario;
GRANT SELECT, INSERT  ON vacunas_aplicadas     TO rol_veterinario;
GRANT SELECT          ON inventario_vacunas    TO rol_veterinario;
GRANT SELECT          ON vet_atiende_mascota   TO rol_veterinario;
GRANT SELECT          ON historial_movimientos TO rol_veterinario;
GRANT SELECT          ON veterinarios          TO rol_veterinario;
GRANT SELECT          ON v_mascotas_vacunacion_pendiente TO rol_veterinario;

GRANT USAGE ON SEQUENCE citas_id_seq                 TO rol_veterinario;
GRANT USAGE ON SEQUENCE vacunas_aplicadas_id_seq     TO rol_veterinario;
GRANT USAGE ON SEQUENCE historial_movimientos_id_seq TO rol_veterinario;

REVOKE ALL ON alertas FROM rol_veterinario;

-- =============================================================
-- ROL: rol_recepcion
-- Ve mascotas y dueños. Agenda citas. NO ve información médica.
-- =============================================================
GRANT SELECT          ON duenos              TO rol_recepcion;
GRANT SELECT          ON mascotas            TO rol_recepcion;
GRANT SELECT, INSERT  ON citas               TO rol_recepcion;
GRANT SELECT          ON veterinarios        TO rol_recepcion;
GRANT SELECT          ON vet_atiende_mascota TO rol_recepcion;
GRANT SELECT          ON v_mascotas_vacunacion_pendiente TO rol_recepcion;

GRANT USAGE ON SEQUENCE citas_id_seq                 TO rol_recepcion;
GRANT USAGE ON SEQUENCE historial_movimientos_id_seq TO rol_recepcion;

-- Sin acceso a información médica directa
REVOKE ALL ON vacunas_aplicadas  FROM rol_recepcion;
REVOKE ALL ON inventario_vacunas FROM rol_recepcion;
REVOKE ALL ON alertas            FROM rol_recepcion;

-- =============================================================
-- ROL: rol_admin
-- Acceso total.
-- =============================================================
GRANT ALL ON ALL TABLES    IN SCHEMA public TO rol_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO rol_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO rol_admin;

-- =============================================================
-- Usuarios de base de datos (uno por rol para pruebas)
-- =============================================================
DROP USER IF EXISTS vet_user;
DROP USER IF EXISTS recepcion_user;
DROP USER IF EXISTS admin_user;

CREATE USER vet_user       WITH PASSWORD 'vet_pass_2026';
CREATE USER recepcion_user WITH PASSWORD 'rec_pass_2026';
CREATE USER admin_user     WITH PASSWORD 'adm_pass_2026';

GRANT rol_veterinario TO vet_user;
GRANT rol_recepcion   TO recepcion_user;
GRANT rol_admin       TO admin_user;