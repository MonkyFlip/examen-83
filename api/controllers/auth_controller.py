from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from services.auth_service import AuthService

auth_bp = Blueprint("auth", __name__)
svc = AuthService()


def ok(data, msg="OK"):
    return jsonify({"success": True,  "message": msg,  "data": data}), 200

def err(msg, code=400):
    return jsonify({"success": False, "message": msg, "data": None}), code


@auth_bp.post("/login")
def login():
    """
    Login de usuario
    ---
    tags: [Autenticación]
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [username, password]
          properties:
            username:
              type: string
              example: admin
            password:
              type: string
              example: admin123
    responses:
      200:
        description: Token JWT generado
      401:
        description: Credenciales inválidas
    """
    data = request.get_json(silent=True)
    if not data:
        return err("Body JSON requerido.")
    result, error = svc.login(data.get("username", ""), data.get("password", ""))
    if error:
        return err(error, 401)
    return ok(result, "Login exitoso.")


@auth_bp.get("/me")
@jwt_required()
def me():
    """
    Usuario autenticado
    ---
    tags: [Autenticación]
    security:
      - Bearer: []
    responses:
      200:
        description: Info del usuario actual
    """
    claims = get_jwt()
    return ok({"id": get_jwt_identity(), "username": claims.get("username")})
