import os

from flask import Flask

from app.config import config_by_name


def create_app(config_name: str | None = None) -> Flask:
    """Application Factory para inicializar a aplicação Flask."""
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    config_obj = config_by_name.get(config_name, config_by_name["default"])
    app.config.from_object(config_obj)

    # Registro de Blueprints
    from app.controllers.bingo_controller import bingo_bp

    app.register_blueprint(bingo_bp)

    return app
