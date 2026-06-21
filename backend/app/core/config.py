from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    GOOGLE_SERVICE_ACCOUNT_JSON: str = ""
    GOOGLE_CALENDAR_ID: str = "primary"
    RESEND_API_KEY: str = ""
    PORTAL_FROM_EMAIL: str = "portal@yourinstitution.com"

    class Config:
        env_file = ".env"

settings = Settings()