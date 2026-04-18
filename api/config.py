import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # JWT
    SECRET_KEY = "examen-secret-key"
    JWT_SECRET_KEY = "examen-jwt-secret-key"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)

    # MySQL
    DB_USER     = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
    DB_HOST     = os.getenv("DB_HOST", "localhost")
    DB_PORT     = os.getenv("DB_PORT", "3306")
    DB_NAME     = os.getenv("DB_NAME", "api_83")

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True
