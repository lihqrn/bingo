import os


class Config:
    """Configurações base da aplicação."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "bingo-secret-key-change-in-prod-2026")
    TESTING = False
    DEBUG = False
    APP_NAME = "Bingo Interativo Master"


class DevelopmentConfig(Config):
    """Configurações de desenvolvimento."""

    DEBUG = True


class TestingConfig(Config):
    """Configurações de teste."""

    TESTING = True
    DEBUG = True


class ProductionConfig(Config):
    """Configurações de produção."""

    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
