import random
from typing import ClassVar


class BingoService:
    """Serviço responsável por regras de negócio, geração de cartelas e validação do Bingo."""

    COLUMN_RANGES: ClassVar[dict[str, tuple[int, int]]] = {
        "B": (1, 15),
        "I": (16, 30),
        "N": (31, 45),
        "G": (46, 60),
        "O": (61, 75),
    }

    TOTAL_BALLS: ClassVar[int] = 75

    @classmethod
    def get_letter_for_number(cls, number: int) -> str:
        """Retorna a letra correspondente (B, I, N, G, O) para um número de 1 a 75."""
        if not (1 <= number <= cls.TOTAL_BALLS):
            raise ValueError(
                f"O número {number} está fora do intervalo válido de 1 a {cls.TOTAL_BALLS}."
            )
        for letter, (start, end) in cls.COLUMN_RANGES.items():
            if start <= number <= end:
                return letter
        return "B"

    @classmethod
    def generate_card(cls) -> dict[str, list[int | None]]:
        """
        Gera uma cartela padrão de 75 bolas (5x5).
        A coluna N possui a casa central gratuita (FREE).
        """
        card: dict[str, list[int | None]] = {}
        for letter, (start, end) in cls.COLUMN_RANGES.items():
            numbers = random.sample(range(start, end + 1), 5)
            if letter == "N":
                # O elemento central (índice 2) é o espaço livre (FREE = None ou 0)
                numbers[2] = None
            card[letter] = numbers
        return card

    @classmethod
    def check_card_hits(
        cls, card: dict[str, list[int | None]], drawn_numbers: set[int]
    ) -> dict[str, object]:
        """
        Calcula os acertos de uma cartela dado o conjunto de pedras sorteadas.
        Retorna quantidade de acertos, se completou linha, coluna, diagonal ou cartela cheia (Bingo).
        """
        letters = ["B", "I", "N", "G", "O"]
        matrix: list[list[bool]] = []
        hits_count = 0
        total_cells = 24  # 25 menos a casa FREE

        for row_idx in range(5):
            row_hits: list[bool] = []
            for col_idx, letter in enumerate(letters):
                val = card[letter][row_idx]
                if val is None:
                    # Casa central (FREE) conta como marcada
                    row_hits.append(True)
                elif val in drawn_numbers:
                    row_hits.append(True)
                    hits_count += 1
                else:
                    row_hits.append(False)
            matrix.append(row_hits)

        # Checagem de Linhas
        has_row = any(all(matrix[r][c] for c in range(5)) for r in range(5))

        # Checagem de Colunas
        has_col = any(all(matrix[r][c] for r in range(5)) for c in range(5))

        # Checagem de Diagonais
        has_diag1 = all(matrix[i][i] for i in range(5))
        has_diag2 = all(matrix[i][4 - i] for i in range(5))
        has_diagonal = has_diag1 or has_diag2

        # Quatro cantos
        has_four_corners = (
            matrix[0][0] and matrix[0][4] and matrix[4][0] and matrix[4][4]
        )

        # Cartela Cheia (Bingo completo)
        is_full_card = hits_count == total_cells

        return {
            "hits": hits_count,
            "total_needed": total_cells,
            "remaining": total_cells - hits_count,
            "progress_percent": round((hits_count / total_cells) * 100, 1),
            "has_row": has_row,
            "has_col": has_col,
            "has_diagonal": has_diagonal,
            "has_four_corners": has_four_corners,
            "is_full_card": is_full_card,
        }
