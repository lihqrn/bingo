import os


class Config:
    """Configurações base da aplicação."""

    SECRET_KEY = os.environ.get("SECRET_KEY")
    TESTING = False
    DEBUG = False
    APP_NAME = "Bingo Interativo Master"


class DevelopmentConfig(Config):
    """Configurações de desenvolvimento."""
    SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "chave-insegura-apenas-para-desenvolvimento"
)

    DEBUG = True




class TestingConfig(Config):
    """Configurações de teste."""
    SECRET_KEY = "chave-exclusiva-para-testes"

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
