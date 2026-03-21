import sys
import os

# Asegura que la carpeta api/ esté en el path de Python
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from flasgger import Swagger

from config import Config
from extensions import db, migrate, jwt


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Extensiones
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Swagger
    Swagger(app, template={
        "swagger": "2.0",
        "info": {
            "title": "API Gestión de Alumnos",
            "description": "API REST para gestión de alumnos — Examen Backend 2026",
            "version": "1.0.0",
        },
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "Formato: Bearer <token>",
            }
        },
        "consumes": ["application/json"],
        "produces": ["application/json"],
    })

    # Importar modelos para que Migrate los detecte
    from models.alumno_model import Alumno   # noqa
    from models.usuario_model import Usuario # noqa

    # Blueprints
    from controllers.auth_controller   import auth_bp
    from controllers.alumno_controller import alumno_bp

    app.register_blueprint(auth_bp,   url_prefix="/api/auth")
    app.register_blueprint(alumno_bp, url_prefix="/api/alumnos")

    # Manejo de errores
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "message": "Ruta no encontrada"}), 404

    @app.errorhandler(422)
    def unprocessable(e):
        return jsonify({"success": False, "message": "Token inválido o expirado"}), 422

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"success": False, "message": "Error interno del servidor"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    with app.app_context():
        db.create_all()

        # usuario admin por defecto
        from repositories.usuario_repository import UsuarioRepository
        repo = UsuarioRepository()
        if not repo.exists("admin"):
            repo.create("admin", "admin123")
            print("Usuario admin creado  ->  admin / admin123")

    app.run(host="0.0.0.0", port=5000, debug=True)
