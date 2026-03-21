import re
from datetime import datetime, timedelta, timezone
from repositories.alumno_repository import AlumnoRepository


class AlumnoService:

    def __init__(self):
        self.repo = AlumnoRepository()

    def _correo_valido(self, correo):
        return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", correo))

    # ── CRUD ─────────────────────────────────────────────────────────────────

    def get_all(self):
        return [a.to_dict() for a in self.repo.get_all()]

    def get_by_id(self, alumno_id):
        alumno = self.repo.get_by_id(alumno_id)
        if not alumno:
            return None, f"Alumno con id {alumno_id} no encontrado."
        return alumno.to_dict(), None

    def create(self, data):
        required = ["nombre", "apellido_paterno", "apellido_materno", "matricula", "correo"]
        for field in required:
            if not data.get(field, "").strip():
                return None, f"El campo '{field}' es obligatorio."

        if not self._correo_valido(data["correo"]):
            return None, "Formato de correo inválido."

        if self.repo.get_by_matricula(data["matricula"].strip().upper()):
            return None, f"La matrícula '{data['matricula']}' ya existe."

        if self.repo.get_by_correo(data["correo"].strip().lower()):
            return None, f"El correo '{data['correo']}' ya existe."

        alumno = self.repo.create(data)
        return alumno.to_dict(), None

    def update(self, alumno_id, data):
        alumno = self.repo.get_by_id(alumno_id)
        if not alumno:
            return None, f"Alumno con id {alumno_id} no encontrado."

        if "correo" in data and data["correo"]:
            if not self._correo_valido(data["correo"]):
                return None, "Formato de correo inválido."
            existente = self.repo.get_by_correo(data["correo"].strip().lower())
            if existente and existente.id != alumno_id:
                return None, "El correo ya está registrado por otro alumno."

        return self.repo.update(alumno, data).to_dict(), None

    def delete(self, alumno_id):
        alumno = self.repo.get_by_id(alumno_id)
        if not alumno:
            return False, f"Alumno con id {alumno_id} no encontrado."
        self.repo.delete(alumno)
        return True, None

    # ── Rango de fecha ───────────────────────────────────────────────────────

    def get_by_rango_fecha(self, fecha_inicio_str, fecha_fin_str):
        if not fecha_inicio_str or not fecha_fin_str:
            return None, "Se requieren los parámetros 'fecha_inicio' y 'fecha_fin' (YYYY-MM-DD)."
        try:
            fecha_inicio = datetime.strptime(fecha_inicio_str, "%Y-%m-%d")
            fecha_fin    = datetime.strptime(fecha_fin_str,    "%Y-%m-%d") + timedelta(hours=23, minutes=59, seconds=59)
        except ValueError:
            return None, "Formato de fecha inválido. Use YYYY-MM-DD."

        if fecha_inicio > fecha_fin:
            return None, "La fecha_inicio no puede ser mayor que fecha_fin."

        alumnos = self.repo.get_by_rango_fecha(fecha_inicio, fecha_fin)
        return [a.to_dict() for a in alumnos], None
