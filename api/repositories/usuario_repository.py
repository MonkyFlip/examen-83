from extensions import db
from models.usuario_model import Usuario


class UsuarioRepository:

    def get_by_username(self, username):
        return Usuario.query.filter_by(username=username).first()

    def create(self, username, password):
        u = Usuario(username=username)
        u.set_password(password)
        db.session.add(u)
        db.session.commit()
        return u

    def exists(self, username):
        return Usuario.query.filter_by(username=username).first() is not None
