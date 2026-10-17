import pytest

from app.services.bingo_service import BingoService


class TestBingoServiceLetters:
    """Testes de correspondência de número para letra (B, I, N, G, O)."""

    @pytest.mark.parametrize(
        "number,expected_letter",
        [
            (1, "B"),
            (15, "B"),
            (16, "I"),
            (30, "I"),
            (31, "N"),
            (45, "N"),
            (46, "G"),
            (60, "G"),
            (61, "O"),
            (75, "O"),
        ],
    )
    def test_get_letter_for_valid_numbers(self, number: int, expected_letter: str):
        assert BingoService.get_letter_for_number(number) == expected_letter

    @pytest.mark.parametrize("invalid_number", [0, -1, 76, 100])
    def test_get_letter_for_invalid_numbers_raises_value_error(
        self, invalid_number: int
    ):
        with pytest.raises(ValueError):
            BingoService.get_letter_for_number(invalid_number)


class TestBingoServiceCardGeneration:
    """Testes de geração de cartelas 5x5."""

    def test_generate_card_structure(self):
        card = BingoService.generate_card()
        assert set(card.keys()) == {"B", "I", "N", "G", "O"}

        for letter in ["B", "I", "G", "O"]:
            col = card[letter]
            assert len(col) == 5
            # Todos os elementos devem ser inteiros únicos
            assert len(set(col)) == 5
            start, end = BingoService.COLUMN_RANGES[letter]
            assert all(start <= num <= end for num in col)

        # Coluna N: o centro (índice 2) deve ser None (espaço livre)
        n_col = card["N"]
        assert len(n_col) == 5
        assert n_col[2] is None
        remaining_n = [x for x in n_col if x is not None]
        assert len(remaining_n) == 4
        assert len(set(remaining_n)) == 4
        assert all(31 <= num <= 45 for num in remaining_n)


class TestBingoServiceCheckCardHits:
    """Testes de cálculo de acertos e detecção de vitória."""

    @pytest.fixture
    def sample_card(self):
        return {
            "B": [1, 2, 3, 4, 5],
            "I": [16, 17, 18, 19, 20],
            "N": [31, 32, None, 34, 35],
            "G": [46, 47, 48, 49, 50],
            "O": [61, 62, 63, 64, 65],
        }

    def test_check_card_zero_hits(self, sample_card):
        drawn = {70, 71, 72}
        result = BingoService.check_card_hits(sample_card, drawn)
        assert result["hits"] == 0
        assert result["remaining"] == 24
        assert result["progress_percent"] == 0.0
        assert not result["is_full_card"]
        assert not result["has_row"]
        assert not result["has_col"]

    def test_check_card_row_complete(self, sample_card):
        # Linha 0: 1, 16, 31, 46, 61
        drawn = {1, 16, 31, 46, 61}
        result = BingoService.check_card_hits(sample_card, drawn)
        assert result["hits"] == 5
        assert result["has_row"] is True
        assert result["is_full_card"] is False

    def test_check_card_col_complete(self, sample_card):
        # Coluna B: 1, 2, 3, 4, 5
        drawn = {1, 2, 3, 4, 5}
        result = BingoService.check_card_hits(sample_card, drawn)
        assert result["hits"] == 5
        assert result["has_col"] is True
        assert result["is_full_card"] is False

    def test_check_card_diagonal_with_free_center(self, sample_card):
        # Diagonal principal: (0,0)=1, (1,1)=17, (2,2)=None(Free), (3,3)=49, (4,4)=65
        drawn = {1, 17, 49, 65}
        result = BingoService.check_card_hits(sample_card, drawn)
        assert result["hits"] == 4
        assert result["has_diagonal"] is True

    def test_check_card_full_bingo(self, sample_card):
        # Todas as 24 pedras da cartela sorteadas
        all_numbers = set()
        for letter in ["B", "I", "N", "G", "O"]:
            for num in sample_card[letter]:
                if num is not None:
                    all_numbers.add(num)

        result = BingoService.check_card_hits(sample_card, all_numbers)
        assert result["hits"] == 24
        assert result["remaining"] == 0
        assert result["progress_percent"] == 100.0
        assert result["is_full_card"] is True
        assert result["has_row"] is True
        assert result["has_col"] is True
        assert result["has_diagonal"] is True
