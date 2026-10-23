"""RF-23.15: tabla vacía -> error claro que indica ingerir."""

import pytest

from app.rag.db import EMPTY_MESSAGE
from app.rag.errors import RagProviderError
from tests.integration.conftest import row, vec

pytestmark = pytest.mark.integration


def test_match_on_empty_table_raises_empty_message(db):
    with pytest.raises(RagProviderError) as info:
        db.match(vec(0), 4)
    assert str(info.value) == EMPTY_MESSAGE


def test_match_on_filled_table_does_not_raise(db):
    db.insert_rows([row("x", "a", vec(0))])
    assert len(db.match(vec(0), 4)) == 1
