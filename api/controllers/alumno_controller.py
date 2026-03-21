from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from services.alumno_service import AlumnoService

alumno_bp = Blueprint("alumnos", __name__)
svc = AlumnoService()


def ok(data, msg="OK", code=200):
    return jsonify({"success": True,  "message": msg,  "data": data}), code

def err(msg, code=400):
    return jsonify({"success": False, "message": msg, "data": None}), code


@alumno_bp.get("/")
@jwt_required()
def get_all():
    """
    Listar todos los alumnos
    ---
    tags: [Alumnos]
    security:
      - Bearer: []
    responses:
      200:
        description: Lista de alumnos
    """
    alumnos = svc.get_all()
    return ok(alumnos, f"{len(alumnos)} alumno(s) encontrado(s)")


@alumno_bp.get("/<int:alumno_id>")
@jwt_required()
def get_by_id(alumno_id):
    """
    Obtener alumno por ID
    ---
    tags: [Alumnos]
    security:
      - Bearer: []
    parameters:
      - name: alumno_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Alumno encontrado
      404:
        description: No encontrado
    """
    alumno, error = svc.get_by_id(alumno_id)
    if error:
        return err(error, 404)
    return ok(alumno)


@alumno_bp.post("/")
@jwt_required()
def create():
    """
    Crear alumno
    ---
    tags: [Alumnos]
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [nombre, apellido_paterno, apellido_materno, matricula, correo]
          properties:
            nombre:
              type: string
              example: Juan
            apellido_paterno:
              type: string
              example: García
            apellido_materno:
              type: string
              example: López
            matricula:
              type: string
              example: A12345
            correo:
              type: string
              example: juan@escuela.mx
    responses:
      201:
        description: Alumno creado
      400:
        description: Error de validación
    """
    data = request.get_json(silent=True)
    if not data:
        return err("Body JSON requerido.")
    alumno, error = svc.create(data)
    if error:
        return err(error)
    return ok(alumno, "Alumno creado exitosamente.", 201)


@alumno_bp.put("/<int:alumno_id>")
@jwt_required()
def update(alumno_id):
    """
    Actualizar alumno
    ---
    tags: [Alumnos]
    security:
      - Bearer: []
    parameters:
      - name: alumno_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            nombre:
              type: string
            apellido_paterno:
              type: string
            apellido_materno:
              type: string
            correo:
              type: string
    responses:
      200:
        description: Alumno actualizado
      404:
        description: No encontrado
    """
    data = request.get_json(silent=True)
    if not data:
        return err("Body JSON requerido.")
    alumno, error = svc.update(alumno_id, data)
    if error:
        code = 404 if "no encontrado" in error else 400
        return err(error, code)
    return ok(alumno, "Alumno actualizado.")


@alumno_bp.delete("/<int:alumno_id>")
@jwt_required()
def delete(alumno_id):
    """
    Eliminar alumno
    ---
    tags: [Alumnos]
    security:
      - Bearer: []
    parameters:
      - name: alumno_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Alumno eliminado
      404:
        description: No encontrado
    """
    success, error = svc.delete(alumno_id)
    if not success:
        return err(error, 404)
    return ok(None, f"Alumno {alumno_id} eliminado.")


@alumno_bp.get("/rango-fecha")
@jwt_required()
def rango_fecha():
    """
    Consultar alumnos por rango de fecha de alta
    ---
    tags: [Alumnos]
    security:
      - Bearer: []
    parameters:
      - name: fecha_inicio
        in: query
        type: string
        required: true
        example: "2026-03-01"
      - name: fecha_fin
        in: query
        type: string
        required: true
        example: "2026-03-31"
    responses:
      200:
        description: Alumnos en el rango
      400:
        description: Fechas inválidas
    """
    alumnos, error = svc.get_by_rango_fecha(
        request.args.get("fecha_inicio"),
        request.args.get("fecha_fin"),
    )
    if error:
        return err(error)
    return ok(alumnos, f"{len(alumnos)} alumno(s) en el rango.")
