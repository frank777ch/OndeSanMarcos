"""Ficha de un lugar para el asistente (HU-29 · RF-29.4)."""

from app.places.document import place_document

FULL = {
    "slug": "biblioteca-central",
    "name": "Biblioteca Central Pedro Zulen",
    "short_name": "BC",
    "category_label": "Servicios",
    "parent_name": "Plaza Cívica",
    "description": "La biblioteca más grande del Perú.",
    "schedule": "Lun–Vie 7:30–20:00",
    "detailed_schedule": ["Lun–Vie 7:30–20:00", "Sáb 8:00–17:00"],
    "access_hint": "Entrando por la Puerta 3.",
    "careers": ["Bibliotecología"],
    "services": ["Préstamo", "Hemeroteca"],
    "usage": "Requiere carné.",
    "phone": "619-7000",
    "annex": "3408",
    "email": "biblioteca@unmsm.edu.pe",
    "website": "https://biblioteca.unmsm.edu.pe",
}


def test_rf_29_4_incluye_todos_los_campos_de_la_ficha():
    doc = place_document(FULL)
    for expected in (
        "Biblioteca Central Pedro Zulen.",
        "La biblioteca más grande del Perú.",
        "Sigla: BC.",
        "Categoría: Servicios.",
        "Está dentro de: Plaza Cívica.",
        "Horario: Lun–Vie 7:30–20:00.",
        "Horario detallado: Lun–Vie 7:30–20:00; Sáb 8:00–17:00.",
        "Cómo llegar: Entrando por la Puerta 3.",
        "Carreras: Bibliotecología.",
        "Servicios: Préstamo, Hemeroteca.",
        "Uso: Requiere carné.",
        "Teléfono: 619-7000, anexo 3408.",
        "Correo: biblioteca@unmsm.edu.pe.",
        "Sitio web: https://biblioteca.unmsm.edu.pe",
    ):
        assert expected in doc.text


def test_rf_29_4_omite_los_campos_vacios():
    doc = place_document(
        {
            "slug": "puerta-1",
            "name": "Puerta 1",
            "description": None,
            "schedule": "  ",
            "careers": [],
            "services": ["", "  "],
            "phone": None,
        }
    )
    assert doc.text == "Puerta 1."


def test_rf_29_4_el_documento_se_identifica_por_el_slug():
    doc = place_document(FULL)
    assert doc.id == "place-biblioteca-central"
    assert doc.place_id == "biblioteca-central"
    assert doc.title == "Biblioteca Central Pedro Zulen"


def test_rf_29_4_telefono_y_anexo_por_separado():
    assert "Teléfono: 619-7000." in place_document({"slug": "a", "name": "A", "phone": "619-7000"}).text
    assert "Anexo: 3408." in place_document({"slug": "a", "name": "A", "annex": "3408"}).text
