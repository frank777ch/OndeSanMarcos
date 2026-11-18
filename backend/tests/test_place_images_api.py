"""Subida de la imagen de portada de un lugar (almacén en memoria)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.api.admin_images import MAX_IMAGE_BYTES, get_storage
from app.auth.dependencies import get_store
from app.auth.tokens import create_access_token
from app.config import get_settings
from app.main import create_app
from app.storage import StorageError, get_image_storage
from tests.fake_admin import FakeAdminStore

SECRET = "secreto-de-pruebas-con-mas-de-32-caracteres"
URL = "/api/admin/place-images"

JPEG = b"\xff\xd8\xff\xe0" + b"0" * 100
PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 100
WEBP = b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"0" * 100


class MemoryStorage:
    def __init__(self, fail: bool = False):
        self.saved: dict[str, tuple[bytes, str]] = {}
        self.fail = fail

    def put(self, key, data, content_type):
        if self.fail:
            raise StorageError("caído")
        self.saved[key] = (data, content_type)
        return f"http://img.test/{key}"


@pytest.fixture(autouse=True)
def secret(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", SECRET)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def make_client(storage=None):
    admins = FakeAdminStore()
    admins.admins["admin"] = "hash"
    app = create_app()
    app.dependency_overrides[get_store] = lambda: admins
    if storage is not None:
        app.dependency_overrides[get_storage] = lambda: storage
    c = TestClient(app)
    token, _ = create_access_token("admin", SECRET, 60)
    c.headers["Authorization"] = f"Bearer {token}"
    return c


@pytest.fixture
def storage():
    return MemoryStorage()


@pytest.fixture
def client(storage):
    return make_client(storage)


def upload(client, data, name="foto.bin", content_type="application/octet-stream"):
    return client.post(URL, files={"file": (name, data, content_type)})


@pytest.mark.parametrize(
    ("data", "ext", "mime"), [(JPEG, "jpg", "image/jpeg"), (PNG, "png", "image/png"), (WEBP, "webp", "image/webp")]
)
def test_guarda_la_imagen_y_devuelve_su_direccion(client, storage, data, ext, mime):
    response = upload(client, data)
    assert response.status_code == 201
    url = response.json()["url"]
    assert url.startswith("http://img.test/uploads/") and url.endswith(f".{ext}")
    ((saved, content_type),) = storage.saved.values()
    assert saved == data and content_type == mime


def test_el_tipo_sale_de_los_bytes_no_del_nombre_ni_del_encabezado(client, storage):
    response = upload(client, b"<script>alert(1)</script>", name="x.jpg", content_type="image/jpeg")
    assert response.status_code == 415
    assert response.json()["detail"] == "Solo se admiten imágenes JPG, PNG o WebP."
    assert storage.saved == {}


def test_rechaza_lo_que_pesa_mas_de_5_mb(client, storage):
    response = upload(client, JPEG + b"0" * MAX_IMAGE_BYTES)
    assert response.status_code == 413
    assert storage.saved == {}


def test_acepta_exactamente_5_mb(client):
    assert upload(client, JPEG + b"0" * (MAX_IMAGE_BYTES - len(JPEG))).status_code == 201


def test_cada_subida_tiene_un_nombre_distinto(client, storage):
    upload(client, JPEG)
    upload(client, JPEG)
    assert len(storage.saved) == 2


def test_sin_archivo_es_422(client):
    assert client.post(URL).status_code == 422


def test_sin_sesion_es_401_aunque_no_haya_almacen():
    app = create_app()
    response = TestClient(app).post(URL, files={"file": ("a.jpg", JPEG, "image/jpeg")})
    assert response.status_code == 401


def test_el_almacen_caido_es_503(storage):
    storage.fail = True
    response = upload(make_client(storage), JPEG)
    assert response.status_code == 503
    assert "almacén" in response.json()["detail"]


def test_sin_almacen_configurado_es_503(monkeypatch):
    monkeypatch.setenv("S3_ENDPOINT_URL", "")
    get_settings.cache_clear()
    with pytest.raises(StorageError):
        get_image_storage()
    assert upload(make_client(), JPEG).status_code == 503
