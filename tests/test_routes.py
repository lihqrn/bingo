import json

from flask.testing import FlaskClient


class TestBingoRoutes:
    """Testes de integração das rotas do Bingo."""

    def test_index_page_returns_200_and_renders_html(self, client: FlaskClient):
        response = client.get("/")
        assert response.status_code == 200
        html = response.get_data(as_text=True)
        assert "BINGO" in html
        assert "Mesa de Bingo" in html
        assert "Painel Geral das 75 Pedras" in html
        assert "Participantes" in html

    def test_health_check_endpoint(self, client: FlaskClient):
        response = client.get("/health")
        assert response.status_code == 200
        data = json.loads(response.get_data(as_text=True))
        assert data["status"] == "healthy"
        assert data["service"] == "bingo-master"

    def test_get_new_card_api(self, client: FlaskClient):
        response = client.get("/api/new-card")
        assert response.status_code == 200
        data = json.loads(response.get_data(as_text=True))
        assert data["success"] is True
        card = data["card"]
        assert set(card.keys()) == {"B", "I", "N", "G", "O"}
        assert len(card["B"]) == 5
        assert card["N"][2] is None

    def test_validate_card_api_success(self, client: FlaskClient):
        card = {
            "B": [1, 2, 3, 4, 5],
            "I": [16, 17, 18, 19, 20],
            "N": [31, 32, None, 34, 35],
            "G": [46, 47, 48, 49, 50],
            "O": [61, 62, 63, 64, 65],
        }
        payload = {"card": card, "drawn_numbers": [1, 16, 31, 46, 61]}
        response = client.post(
            "/api/validate-card",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 200
        data = json.loads(response.get_data(as_text=True))
        assert data["success"] is True
        assert data["result"]["hits"] == 5
        assert data["result"]["has_row"] is True

    def test_validate_card_api_missing_card(self, client: FlaskClient):
        response = client.post(
            "/api/validate-card",
            data=json.dumps({}),
            content_type="application/json",
        )
        assert response.status_code == 400
        data = json.loads(response.get_data(as_text=True))
        assert data["success"] is False
        assert "error" in data
