from flask import Blueprint, jsonify, render_template, request

from app.services.bingo_service import BingoService

bingo_bp = Blueprint("bingo", __name__)


@bingo_bp.route("/")
def index():
    """Renderiza a página principal do Bingo Interativo."""
    return render_template("index.html")


@bingo_bp.route("/api/new-card", methods=["GET"])
def get_new_card():
    """Gera uma nova cartela 5x5 aleatória válida."""
    card = BingoService.generate_card()
    return jsonify({"success": True, "card": card})


@bingo_bp.route("/api/validate-card", methods=["POST"])
def validate_card():
    """Valida o estado de uma cartela contra os números sorteados."""
    data = request.get_json() or {}
    card = data.get("card")
    drawn_numbers = set(data.get("drawn_numbers", []))

    if not card:
        return jsonify({"success": False, "error": "Cartela não fornecida"}), 400

    result = BingoService.check_card_hits(card, drawn_numbers)
    return jsonify({"success": True, "result": result})


@bingo_bp.route("/health", methods=["GET"])
def health_check():
    """Endpoint de verificação de integridade da aplicação."""
    return jsonify({"status": "healthy", "service": "bingo-master"})
