from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Glow Studio"
    app_env: str = "development"
    secret_key: str = "dev-secret-key-change-in-production"
    admin_email: str = "admin@glowstudio.com"
    admin_password: str = "admin123"

    database_url: str = "sqlite:///./glow_studio.db"
    frontend_url: str = "http://localhost:5173"

    # Telegram notifications
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    # Email SMTP
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""

    # Cloudinary
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    # JWT
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
