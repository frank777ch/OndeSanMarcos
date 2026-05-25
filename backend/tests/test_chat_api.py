"""Pruebas del endpoint HTTP `/api/chat` (contrato del chat)."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    assert client.get("/health").status_code == 200


def test_chat_returns_contract_shape():
    response = client.post("/api/chat", json={"query": "horario de la biblioteca"})
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"answer", "locations", "draw_route", "destination"}
    assert body["locations"][0]["id"] == "biblioteca-central"
    assert body["draw_route"] is False
    assert body["destination"] is None


def test_chat_navigation_returns_destination():
    response = client.post("/api/chat", json={"query": "cómo llego al rectorado"})
    assert response.status_code == 200
    body = response.json()
    assert body["draw_route"] is True
    assert body["destination"]["latitude"] == pytest.approx(-12.0578)
    assert body["destination"]["longitude"] == pytest.approx(-77.084)


def test_chat_rejects_empty_query():
    assert client.post("/api/chat", json={"query": ""}).status_code == 422


def test_chat_out_of_scope_has_no_locations():
    response = client.post("/api/chat", json={"query": "receta de ceviche"})
    assert response.status_code == 200
    assert response.json()["locations"] == []
