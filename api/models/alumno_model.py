from datetime import datetime, timezone
from extensions import db


class Alumno(db.Model):
    __tablename__ = "alumnos"

    id               = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre           = db.Column(db.String(100), nullable=False)
    apellido_paterno = db.Column(db.String(100), nullable=False)
    apellido_materno = db.Column(db.String(100), nullable=False)
    matricula        = db.Column(db.String(20),  unique=True, nullable=False)
    correo           = db.Column(db.String(150), unique=True, nullable=False)
    fecha_alta       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id":               self.id,
            "nombre":           self.nombre,
            "apellido_paterno": self.apellido_paterno,
            "apellido_materno": self.apellido_materno,
            "nombre_completo":  f"{self.nombre} {self.apellido_paterno} {self.apellido_materno}",
            "matricula":        self.matricula,
            "correo":           self.correo,
            "fecha_alta":       self.fecha_alta.strftime("%Y-%m-%d %H:%M:%S"),
        }
