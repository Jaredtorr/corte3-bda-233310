# Sistema de Clínica Veterinaria — Corte 3 BDA
**Stack:** PostgreSQL 16 + Redis 7 + FastAPI (Python) + React + Tailwind CSS  
**Matrícula:** {TU-MATRICULA}

---

## 1. ¿Qué política RLS aplicaste a la tabla mascotas?

La política `pol_vet_ver_mascotas` filtra las filas de la tabla `mascotas` 
para el rol `rol_veterinario`. La cláusula exacta es:

```sql
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
```

Lo que hace: cuando un veterinario ejecuta `SELECT * FROM mascotas`, 
PostgreSQL evalúa la condición USING por cada fila. Solo devuelve las 
filas donde existe una asignación activa entre esa mascota y el veterinario 
actual (identificado por `app.current_vet_id`). Si no hay asignación, la 
fila no aparece.

---

## 2. Vector de ataque de la estrategia de identidad RLS

La estrategia usa `SET LOCAL app.current_vet_id = <id>` al inicio de cada 
transacción. El vector de ataque posible es que si alguien obtiene acceso 
directo a la conexión de base de datos (por ejemplo, si el pool de conexiones 
no usa SET LOCAL sino SET), podría heredar el contexto de otro usuario.

Mi sistema lo previene usando `SET LOCAL` (no `SET`), lo que limita el valor 
a la transacción actual. Cuando la transacción termina, el valor desaparece. 
Además, el valor nunca viene directamente del cliente — lo asigna el backend 
después de validar el login.

---

## 3. SECURITY DEFINER

No uso `SECURITY DEFINER` en ningún procedure. Todos los procedures usan 
`SECURITY INVOKER` (el default), lo que significa que se ejecutan con los 
permisos del usuario que los llama, no del creador.

Esto elimina el vector de escalada de privilegios por manipulación del 
`search_path` que SECURITY DEFINER habilita. Con SECURITY INVOKER, si el 
usuario no tiene permisos sobre una tabla, el procedure tampoco los tiene.

---

## 4. TTL del caché Redis

El TTL elegido es **300 segundos (5 minutos)**.

- La consulta `v_mascotas_vacunacion_pendiente` tarda ~200ms en ejecutarse
- Se llama aproximadamente 30-50 veces por hora en uso normal
- Las vacunas no se aplican con tanta frecuencia como para necesitar datos 
  en tiempo real

Si el TTL fuera demasiado bajo (ej: 5 segundos): el caché no tendría efecto 
real, la BD recibiría casi todas las consultas igual que sin caché.

Si fuera demasiado alto (ej: 1 hora): una vacuna recién aplicada no aparecería 
en el listado por hasta una hora, lo que podría causar duplicación de vacunas.

La invalidación explícita en `POST /vacunas` resuelve este problema: cuando 
se aplica una vacuna, el caché se borra inmediatamente sin esperar el TTL.

---

## 5. Hardening en endpoint crítico

El endpoint crítico es `GET /mascotas?nombre=xxx` en `api/main.py`.

La línea exacta que defiende contra SQL injection es:

```python
cur.execute(
    """
    SELECT m.id, m.nombre, m.especie, m.fecha_nacimiento,
           d.nombre AS dueno, d.telefono
    FROM   mascotas m
    JOIN   duenos d ON d.id = m.dueno_id
    WHERE  m.nombre ILIKE %s
    ORDER  BY m.nombre
    """,
    (f"%{nombre}%",),  # ← parámetro seguro
)
```

**Archivo:** `api/main.py` — función `buscar_mascotas`

El parámetro `nombre` nunca se concatena al string SQL. psycopg2 lo envía 
como parámetro separado al servidor PostgreSQL, que lo trata como valor 
literal y nunca como código SQL. Esto previene ataques como `' OR '1'='1`, 
`'; DROP TABLE mascotas; --` y `UNION SELECT`.

---

## 6. Si se revocan todos los permisos del veterinario excepto SELECT en mascotas

Tres operaciones que dejarían de funcionar:

1. **Registrar nuevas citas** — el veterinario necesita INSERT en `citas`. 
   Sin ese permiso, `POST /citas` fallaría con error de permisos.

2. **Aplicar vacunas** — necesita INSERT en `vacunas_aplicadas`. 
   Sin ese permiso, `POST /vacunas` fallaría.

3. **Ver su historial de vacunación** — necesita SELECT en `vacunas_aplicadas`. 
   Sin ese permiso, no podría consultar qué vacunas ha aplicado a sus mascotas.

---

## Cómo levantar el sistema

```bash
docker compose up
```

Servicios:
- Frontend: http://localhost:3000
- API: http://localhost:8000
- PostgreSQL: puerto 5432
- Redis: puerto 6379