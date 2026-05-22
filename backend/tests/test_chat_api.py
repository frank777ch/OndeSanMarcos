"""Pruebas del endpoint HTTP `/api/chat` (contrato del chat)."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    assert client.get("/health").status_code == 200


def test_chat_returns_contract_shape():
    response = client.post("/api/chat", json={"query": "horario de la biblioteca"})
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"answer", "locations"}
    assert body["locations"][0]["id"] == "biblioteca-central"


def test_chat_rejects_empty_query():
    assert client.post("/api/chat", json={"query": ""}).status_code == 422


def test_chat_out_of_scope_has_no_locations():
    response = client.post("/api/chat", json={"query": "receta de ceviche"})
    assert response.status_code == 200
    assert response.json()["locations"] == []
