# Examen 83 — Documentación de Despliegue

## Stack

| Capa | Tecnología |
|------|-----------|
| API | Flask + Flask-JWT-Extended + Flasgger |
| Base de datos | MySQL en AWS RDS |
| Servidor | AWS EC2 — Amazon Linux 2023 |
| Proxy / SSL | Nginx + certificado auto-firmado |
| Frontend | React (Create React App) |
| Hosting frontend | AWS Amplify |
| CI/CD | GitLab CI/CD |

---

## Credenciales

| Servicio | Usuario | Contraseña |
|----------|---------|-----------|
| API (admin) | admin | admin123 |
| RDS | miguel | miguel1234 |

---

## Infraestructura

| Recurso | Valor |
|---------|-------|
| EC2 IP publica | 18.191.166.111 |
| RDS endpoint | examen-83.c7qi6wqmarcn.us-east-2.rds.amazonaws.com |
| Amplify URL | https://main.d1onhbsyoq9o8t.amplifyapp.com |
| GitLab repo | git@gitlab.com:MonkyFlip/examen-83.git |

---

## Endpoints de la API

### Autenticacion

| Metodo | Ruta | Auth | Descripcion |
|--------|------|:----:|-------------|
| POST | `/api/auth/login` | No | Login, retorna JWT |
| GET | `/api/auth/me` | Si | Usuario actual |

### Alumnos

| Metodo | Ruta | Auth | Descripcion |
|--------|------|:----:|-------------|
| GET | `/api/alumnos/` | Si | Listar todos |
| GET | `/api/alumnos/<id>` | Si | Obtener por ID |
| POST | `/api/alumnos/` | Si | Crear alumno |
| PUT | `/api/alumnos/<id>` | Si | Actualizar |
| DELETE | `/api/alumnos/<id>` | Si | Eliminar |
| GET | `/api/alumnos/rango-fecha?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD` | Si | Filtrar por fechas |

Swagger disponible en: `https://18.191.166.111/apidocs`

---

## Estructura del proyecto

```
examen-83/
├── .gitlab-ci.yml
├── api/                          <- Backend Flask
│   ├── run.py
│   ├── config.py
│   ├── extensions.py
│   ├── requirements.txt
│   ├── .env
│   ├── controllers/
│   │   ├── alumno_controller.py
│   │   └── auth_controller.py
│   ├── services/
│   │   ├── alumno_service.py
│   │   └── auth_service.py
│   ├── repositories/
│   │   ├── alumno_repository.py
│   │   └── usuario_repository.py
│   └── models/
│       ├── alumno_model.py
│       └── usuario_model.py
└── web/                          <- Frontend React
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        └── App.jsx
```

---

## Ramas Git

```
main             <- produccion
develop          <- integracion
feature/jwt-auth <- desarrollo de autenticacion
```

### Flujo de trabajo

```bash
git checkout feature/jwt-auth
# hacer cambios
git add .
git commit -m "feat: descripcion"
git push gitlab feature/jwt-auth

# Merge feature -> develop (dispara pipeline DEV)
git checkout develop
git merge feature/jwt-auth
git push gitlab develop

# Merge develop -> main (dispara pipeline PROD)
git checkout main
git merge develop
git push gitlab main
```

---

## Pipeline GitLab CI/CD

Archivo `.gitlab-ci.yml` en la raiz del proyecto:

```yaml
stages:
  - test
  - deploy

test:dev:
  stage: test
  image: python:3.11-slim
  only: [develop]
  before_script:
    - cd api && pip install -r requirements.txt
  script:
    - python -c "from run import create_app; create_app(); print('OK')"

deploy:dev:
  stage: deploy
  image: python:3.11-slim
  only: [develop]
  script:
    - echo "Deploy DEV completado"

test:prod:
  stage: test
  image: python:3.11-slim
  only: [main]
  before_script:
    - cd api && pip install -r requirements.txt
  script:
    - python -c "from run import create_app; create_app(); print('OK')"

deploy:prod:
  stage: deploy
  image: python:3.11-slim
  only: [main]
  script:
    - echo "Deploy PROD completado"
```

---

## Despliegue en EC2

### 1. Conectarse

```bash
ssh -i "tu-llave.pem" ec2-user@18.191.166.111
```

### 2. Instalar dependencias del sistema

```bash
sudo dnf update -y
sudo dnf install -y python3 python3-pip git nginx
```

### 3. Configurar SSH para GitLab

```bash
ssh-keygen -t ed25519 -C "ec2-examen" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
# Copiar y pegar en GitLab -> Preferences -> SSH Keys
ssh-keyscan gitlab.com >> ~/.ssh/known_hosts
```

### 4. Clonar el repositorio

```bash
git clone git@gitlab.com:MonkyFlip/examen-83.git
cd examen-83/api
```

### 5. Entorno virtual

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install flask-cors
```

### 6. Crear .env

```bash
cat > .env <<EOF
FLASK_APP=run.py
DB_USER=miguel
DB_PASSWORD=miguel1234
DB_HOST=examen-83.c7qi6wqmarcn.us-east-2.rds.amazonaws.com
DB_PORT=3306
DB_NAME=api_83
EOF
```

### 7. Crear base de datos en RDS

```bash
mysql -h examen-83.c7qi6wqmarcn.us-east-2.rds.amazonaws.com \
  -u miguel -pmiguel1234 \
  -e "CREATE DATABASE IF NOT EXISTS api_83;"
```

### 8. Levantar Flask

```bash
nohup python run.py > output.log 2>&1 &
tail -f output.log
```

### 9. Certificado SSL auto-firmado

```bash
sudo mkdir -p /etc/ssl/private

sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/api.key \
  -out /etc/ssl/certs/api.crt \
  -subj "/CN=18.191.166.111"
```

### 10. Configurar Nginx

```bash
sudo nano /etc/nginx/conf.d/api.conf
```

Contenido del archivo:

```nginx
server {
    listen 443 ssl;
    server_name 18.191.166.111;

    ssl_certificate     /etc/ssl/certs/api.crt;
    ssl_certificate_key /etc/ssl/private/api.key;

    location /api/ {
        proxy_pass         http://127.0.0.1:5000/api/;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /apidocs {
        proxy_pass http://127.0.0.1:5000/apidocs;
    }

    location /apispec_1.json {
        proxy_pass http://127.0.0.1:5000/apispec_1.json;
    }
}

server {
    listen 80;
    server_name 18.191.166.111;
    return 301 https://$host$request_uri;
}
```

```bash
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

### 11. Security Groups requeridos en AWS

**EC2:**

| Tipo | Puerto | Origen |
|------|--------|--------|
| SSH | 22 | Tu IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |
| Custom TCP | 5000 | 0.0.0.0/0 |

**RDS:**

| Tipo | Puerto | Origen |
|------|--------|--------|
| MySQL/Aurora | 3306 | 0.0.0.0/0 |

---

## Despliegue del Frontend en Amplify

### Fuente
- Proveedor: GitHub
- Rama: main
- Carpeta del proyecto: `web/`

### Amplify build settings

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd web && npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: web/build
    files:
      - '**/*'
```

### Rewrites and redirects

```json
[
  {
    "source": "</^[^.]+$|\\.((?!css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)[^.]+)$/>",
    "status": "200",
    "target": "/index.html"
  }
]
```

> El frontend apunta a `https://18.191.166.111/api`.
> La primera vez que se abra la app, visitar `https://18.191.166.111/api/alumnos/`
> en el navegador y aceptar el certificado auto-firmado manualmente.

---

## Comandos utiles en la EC2

```bash
# Ver logs de Flask
tail -f ~/examen-83/api/output.log

# Reiniciar Flask
pkill -f run.py
cd ~/examen-83/api && source venv/bin/activate
nohup python run.py > output.log 2>&1 &

# Estado de Nginx
sudo systemctl status nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver si Flask esta corriendo
ps aux | grep run.py

# Probar API desde la EC2
curl -sk https://localhost/api/alumnos/ | python3 -m json.tool
```

---

## Problemas comunes

| Error | Causa | Solucion |
|-------|-------|---------|
| 502 Bad Gateway | Flask no esta corriendo | `nohup python run.py > output.log 2>&1 &` |
| ModuleNotFoundError | Falta dependencia | `pip install <modulo>` |
| CORS blocked | flask-cors mal configurado | Verificar `CORS(app, resources={r"/api/*": ...})` en run.py |
| ERR_CERT_AUTHORITY_INVALID | Certificado auto-firmado | Abrir URL en navegador y aceptar manualmente |
| Mixed Content | HTTP desde pagina HTTPS | Usar HTTPS en EC2 con Nginx + SSL |
| 403 en RDS | Security Group cerrado | Abrir puerto 3306 en el SG de RDS |
| CORS preflight bloqueado | Headers no permitidos | Agregar `allow_headers` en la config de CORS |
