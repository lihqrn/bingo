import pytest
from flask import Flask
from flask.testing import FlaskClient

from app import create_app


@pytest.fixture
def app() -> Flask:
    """Fixture que cria e configura a aplicação para testes."""
    app_instance = create_app("testing")
    yield app_instance


@pytest.fixture
def client(app: Flask) -> FlaskClient:
    """Fixture que fornece um Flask test client."""
    return app.test_client()
