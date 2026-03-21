from flask_jwt_extended import create_access_token
from repositories.usuario_repository import UsuarioRepository


class AuthService:

    def __init__(self):
        self.repo = UsuarioRepository()

    def login(self, username, password):
        if not username or not password:
            return None, "Usuario y contraseña son obligatorios."

        usuario = self.repo.get_by_username(username.strip())
        if not usuario or not usuario.check_password(password):
            return None, "Credenciales inválidas."

        token = create_access_token(
            identity=str(usuario.id),
            additional_claims={"username": usuario.username},
        )
        return {"access_token": token, "token_type": "Bearer", "usuario": usuario.to_dict()}, None
