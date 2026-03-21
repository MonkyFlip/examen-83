from extensions import db
from models.alumno_model import Alumno


class AlumnoRepository:

    def get_all(self):
        return Alumno.query.order_by(Alumno.fecha_alta.desc()).all()

    def get_by_id(self, alumno_id):
        return Alumno.query.get(alumno_id)

    def get_by_matricula(self, matricula):
        return Alumno.query.filter_by(matricula=matricula).first()

    def get_by_correo(self, correo):
        return Alumno.query.filter_by(correo=correo).first()

    def get_by_rango_fecha(self, fecha_inicio, fecha_fin):
        return (
            Alumno.query
            .filter(Alumno.fecha_alta >= fecha_inicio, Alumno.fecha_alta <= fecha_fin)
            .order_by(Alumno.fecha_alta.asc())
            .all()
        )

    def create(self, data):
        alumno = Alumno(
            nombre           = data["nombre"].strip(),
            apellido_paterno = data["apellido_paterno"].strip(),
            apellido_materno = data["apellido_materno"].strip(),
            matricula        = data["matricula"].strip().upper(),
            correo           = data["correo"].strip().lower(),
        )
        db.session.add(alumno)
        db.session.commit()
        return alumno

    def update(self, alumno, data):
        for field in ["nombre", "apellido_paterno", "apellido_materno", "correo"]:
            if field in data and data[field]:
                value = data[field].strip()
                if field == "correo":
                    value = value.lower()
                setattr(alumno, field, value)
        db.session.commit()
        return alumno

    def delete(self, alumno):
        db.session.delete(alumno)
        db.session.commit()
