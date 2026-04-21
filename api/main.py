"""
=============================================================
CORTE 3 BDA · UP Chiapas
api/main.py
=============================================================
"""

import json
import logging
import os
import time
from typing import Optional

import psycopg2
import psycopg2.extras
import redis
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

DB_HOST     = os.getenv("DB_HOST",     "postgres")
DB_PORT     = os.getenv("DB_PORT",     "5432")
DB_NAME     = os.getenv("DB_NAME",     "clinica_vet")
DB_USER     = os.getenv("DB_USER",     "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

REDIS_HOST  = os.getenv("REDIS_HOST",  "redis")
REDIS_PORT  = int(os.getenv("REDIS_PORT", "6379"))

CACHE_TTL = 300
CACHE_KEY = "vacunacion_pendiente"

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True,
)

def get_connection(vet_id: Optional[int] = None, rol: Optional[str] = None):
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )
    conn.autocommit = False

    roles_validos = ("rol_veterinario", "rol_recepcion", "rol_admin")

    with conn.cursor() as cur:
        if rol and rol in roles_validos:
            cur.execute(f"SET LOCAL ROLE {rol}")

        if vet_id is not None:
            cur.execute(
                "SELECT set_config('app.current_vet_id', %s, TRUE)",
                (str(vet_id),),
            )

    return conn

app = FastAPI(title="Clínica Veterinaria API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    rol: str
    vet_id: Optional[int] = None

class CitaRequest(BaseModel):
    mascota_id: int
    veterinario_id: int
    fecha_hora: str
    motivo: str

class VacunaRequest(BaseModel):
    mascota_id: int
    vacuna_id: int
    veterinario_id: int
    costo_cobrado: float

@app.get("/")
def root():
    return {"status": "ok", "mensaje": "Clínica Veterinaria API"}

@app.get("/veterinarios")
def listar_veterinarios():
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, nombre FROM veterinarios WHERE activo = TRUE ORDER BY nombre"
            )
            rows = cur.fetchall()
        conn.commit()
        return list(rows)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/login")
def login(data: LoginRequest):
    roles_validos = ["rol_veterinario", "rol_recepcion", "rol_admin"]
    if data.rol not in roles_validos:
        raise HTTPException(status_code=400, detail="Rol no válido")

    if data.rol == "rol_veterinario" and data.vet_id is None:
        raise HTTPException(status_code=400, detail="Se requiere vet_id para rol veterinario")

    return {
        "rol": data.rol,
        "vet_id": data.vet_id,
        "mensaje": f"Sesión iniciada como {data.rol}"
    }

@app.get("/mascotas")
def buscar_mascotas(nombre: str = "", rol: str = "rol_admin", vet_id: Optional[int] = None):
    """
    HARDENING: el parámetro 'nombre' se pasa con %s a psycopg2,
    nunca se concatena al string SQL.
    """
    conn = get_connection(vet_id=vet_id, rol=rol)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT m.id, m.nombre, m.especie, m.fecha_nacimiento,
                       d.nombre AS dueno, d.telefono
                FROM   mascotas m
                JOIN   duenos d ON d.id = m.dueno_id
                WHERE  m.nombre ILIKE %s
                ORDER  BY m.nombre
                """,
                (f"%{nombre}%",),
            )
            rows = cur.fetchall()
        conn.commit()
        return list(rows)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/vacunacion-pendiente")
def vacunacion_pendiente(rol: str = "rol_admin", vet_id: Optional[int] = None):
    inicio = time.time()
    cached = redis_client.get(CACHE_KEY)

    if cached:
        latencia = round((time.time() - inicio) * 1000, 2)
        log.info(f"[CACHE HIT] {CACHE_KEY} — latencia: {latencia}ms")
        return {"cache": "HIT", "latencia_ms": latencia, "data": json.loads(cached)}

    log.info(f"[CACHE MISS] {CACHE_KEY} — consultando base de datos...")
    conn = get_connection(vet_id=vet_id, rol=rol)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM v_mascotas_vacunacion_pendiente")
            rows = cur.fetchall()
        conn.commit()

        result = []
        for row in rows:
            r = dict(row)
            for k, v in r.items():
                if hasattr(v, "isoformat"):
                    r[k] = v.isoformat()
            result.append(r)

        redis_client.setex(CACHE_KEY, CACHE_TTL, json.dumps(result))
        latencia = round((time.time() - inicio) * 1000, 2)
        log.info(f"[CACHE SET] {CACHE_KEY} — TTL={CACHE_TTL}s — latencia BD: {latencia}ms")
        return {"cache": "MISS", "latencia_ms": latencia, "data": result}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/citas")
def agendar_cita(data: CitaRequest, rol: str = "rol_admin", vet_id: Optional[int] = None):
    conn = get_connection(vet_id=vet_id, rol=rol)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "CALL sp_agendar_cita(%s, %s, %s::TIMESTAMP, %s, NULL)",
                (data.mascota_id, data.veterinario_id, data.fecha_hora, data.motivo),
            )
        conn.commit()
        return {"mensaje": "Cita agendada correctamente"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e.pgerror))
    finally:
        conn.close()

@app.post("/vacunas")
def aplicar_vacuna(data: VacunaRequest, rol: str = "rol_admin", vet_id: Optional[int] = None):
    conn = get_connection(vet_id=vet_id, rol=rol)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO vacunas_aplicadas
                    (mascota_id, vacuna_id, veterinario_id, costo_cobrado)
                VALUES (%s, %s, %s, %s)
                """,
                (data.mascota_id, data.vacuna_id, data.veterinario_id, data.costo_cobrado),
            )
        conn.commit()

        redis_client.delete(CACHE_KEY)
        log.info(f"[CACHE INVALIDADO] {CACHE_KEY} — vacuna aplicada a mascota_id={data.mascota_id}")

        return {"mensaje": "Vacuna registrada y caché invalidado"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e.pgerror))
    finally:
        conn.close()