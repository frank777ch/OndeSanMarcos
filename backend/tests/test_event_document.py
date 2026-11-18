"""Documento del evento para el asistente, fechas en hora de Lima y fecha de hoy en el prompt."""

from datetime import datetime, timedelta, timezone

import pytest

from app.events.document import event_document, event_expires_at
from app.events.timeutil import LIMA, as_lima, describe_when, describe_today, expires_at
from app.rag.llm import build_prompt

UTC = timezone.utc
# 22 de noviembre de 2026 (domingo), 10:00 a 13:00 en Lima = 15:00 a 18:00 UTC.
INICIO = datetime(2026, 11, 22, 15, 0, tzinfo=UTC)
FIN = datetime(2026, 11, 22, 18, 0, tzinfo=UTC)


def evento(**extra):
    return {"title": "Feria de Ciencias", "slug": "feria-de-ciencias-2026-11-22", "starts_at": INICIO, "ends_at": FIN, **extra}


# --- fechas -------------------------------------------------------------------


def test_la_fecha_se_escribe_en_espanol_y_en_hora_de_lima():
    assert describe_when(INICIO, FIN) == "domingo 22 de noviembre de 2026, de 10:00 a 13:00"
    assert describe_when(INICIO, None) == "domingo 22 de noviembre de 2026, a las 10:00"


def test_un_evento_de_varios_dias_dice_inicio_y_fin():
    fin = datetime(2026, 11, 24, 22, 0, tzinfo=UTC)
    assert describe_when(INICIO, fin) == (
        "del domingo 22 de noviembre de 2026 a las 10:00 al martes 24 de noviembre de 2026 a las 17:00"
    )


def test_cerca_de_medianoche_el_dia_es_el_de_lima_no_el_de_utc():
    # 04:30 UTC del 23 = 23:30 del 22 en Lima.
    assert describe_when(datetime(2026, 11, 23, 4, 30, tzinfo=UTC), None).startswith("domingo 22 de noviembre")


def test_hoy_en_espanol():
    assert describe_today(datetime(2026, 11, 18, 3, 0, tzinfo=UTC)) == "martes 17 de noviembre de 2026"


def test_una_fecha_sin_zona_es_hora_de_lima():
    assert as_lima(datetime(2026, 11, 22, 10, 0)) == datetime(2026, 11, 22, 10, 0, tzinfo=LIMA)


def test_sin_fin_el_evento_termina_a_la_medianoche_de_lima():
    assert expires_at(INICIO, None) == datetime(2026, 11, 23, 0, 0, tzinfo=LIMA)
    # Empieza 23:30 en Lima (ya es el día siguiente en UTC): termina a esa misma medianoche.
    assert expires_at(datetime(2026, 11, 23, 4, 30, tzinfo=UTC), None) == datetime(2026, 11, 23, 0, 0, tzinfo=LIMA)


def test_con_fin_caduca_al_terminar():
    assert expires_at(INICIO, FIN) == FIN
    assert event_expires_at(evento()) == FIN.isoformat()
    assert datetime.fromisoformat(event_expires_at(evento(ends_at=None))) == datetime(2026, 11, 23, 5, 0, tzinfo=UTC)


# --- documento ----------------------------------------------------------------


def test_el_documento_lleva_titulo_fecha_y_lugar():
    doc = event_document(evento(
        description="Muestras de ciencia.", category="feria", modality="in_person", place_name="Auditorio Zeta",
        place_slug="auditorio-zeta", parent_name="Biblioteca Central", location_detail="Sala 2",
    ))
    assert doc.id == "event-feria-de-ciencias-2026-11-22" and doc.title == "Feria de Ciencias"
    assert doc.place_id == "auditorio-zeta"  # el lugar donde ocurre, para señalarlo en el mapa
    assert doc.text.startswith("Evento: Feria de Ciencias. Muestras de ciencia.")
    assert "Fecha y hora: domingo 22 de noviembre de 2026, de 10:00 a 13:00." in doc.text
    assert "Tipo: Feria." in doc.text and "Modalidad: Presencial." in doc.text
    assert "Lugar: Auditorio Zeta (dentro de Biblioteca Central), Sala 2." in doc.text


def test_un_evento_virtual_no_tiene_lugar_ni_place_id():
    doc = event_document(evento(modality="online", online_url="https://meet.example/x"))
    assert doc.place_id is None and "Lugar:" not in doc.text
    assert "Enlace para verlo en línea: https://meet.example/x" in doc.text


def test_solo_la_sala_sin_lugar():
    assert "Lugar: Frente a la Puerta 3." in event_document(evento(location_detail="Frente a la Puerta 3")).text


def test_un_evento_cancelado_o_reprogramado_lo_dice_y_uno_normal_no():
    assert "Estado: CANCELADO. Por lluvia." in event_document(evento(status="cancelled", status_note="Por lluvia.")).text
    assert "Estado: REPROGRAMADO." in event_document(evento(status="postponed")).text
    assert "Estado:" not in event_document(evento(status="scheduled")).text


@pytest.mark.parametrize(
    ("campos", "esperado"),
    [
        ({"is_free": True}, "Costo: gratis."),
        ({"is_free": True, "price_note": "Se pide DNI."}, "Costo: gratis. Se pide DNI."),
        ({"is_free": False, "price_note": "S/ 10"}, "Costo: S/ 10"),
        ({"is_free": False}, "Costo: tiene costo."),
        ({"price_note": "Consultar"}, "Costo: Consultar"),
    ],
)
def test_el_costo(campos, esperado):
    assert esperado in event_document(evento(**campos)).text


def test_sin_dato_de_costo_no_se_inventa_nada():
    assert "Costo" not in event_document(evento()).text


def test_inscripcion_organizador_publico_programa_y_contacto():
    doc = event_document(evento(
        organizer="Facultad de Letras", audience="Abierto al público", registration_note="Hasta el 20 de noviembre",
        registration_url="https://x.pe/ins", agenda=["10:00 Inicio", "12:00 Cierre"], phone="123", email="a@b.pe",
    ))
    assert "Organiza: Facultad de Letras." in doc.text and "Dirigido a: Abierto al público." in doc.text
    assert "Inscripción: Hasta el 20 de noviembre. Enlace: https://x.pe/ins" in doc.text
    assert "Programa: 10:00 Inicio; 12:00 Cierre." in doc.text and "Teléfono: 123. Correo: a@b.pe." in doc.text


def test_los_campos_vacios_no_dejan_huecos():
    doc = event_document(evento(description="  ", organizer="", agenda=[" "], phone=None))
    assert "  " not in doc.text and "Organiza" not in doc.text and "Programa" not in doc.text


# --- prompt -------------------------------------------------------------------


def test_el_prompt_incluye_la_fecha_de_hoy():
    prompt = build_prompt("¿Qué hay hoy?", ["Evento: X."], today="martes 17 de noviembre de 2026")
    assert "Hoy es martes 17 de noviembre de 2026 (hora de Lima)." in prompt
    assert prompt.index("Evento: X.") < prompt.index("Hoy es") < prompt.index("Pregunta del usuario")


def test_sin_fecha_explicita_usa_la_de_hoy():
    assert f"Hoy es {describe_today()} (hora de Lima)." in build_prompt("hola", ["x"])


# --- alcance del asistente y fragmentos ----------------------------------------


@pytest.mark.parametrize("pregunta", ["¿Dónde es la feria de ciencias?", "¿Hay charlas esta semana?", "Taller de teatro", "¿Qué eventos hay?"])
def test_las_preguntas_sobre_eventos_estan_en_el_alcance(pregunta):
    from app.rag.guardrails import is_in_scope

    assert is_in_scope(pregunta)


def test_un_evento_se_guarda_en_un_solo_fragmento():
    from app.config import Settings
    from app.rag.ingestion import document_rows
    from app.events.document import event_document

    class Emb:
        def embed_document(self, text):
            return [0.0]

    doc = event_document(evento(description="x " * 300, organizer="Facultad de Letras"))
    assert len(document_rows(doc, Emb(), Settings(), "event", source_id="s")) > 1  # normalmente se parte
    rows = document_rows(doc, Emb(), Settings(), "event", source_id="s", single_chunk=True)
    assert len(rows) == 1 and rows[0]["content"].startswith("Evento: Feria de Ciencias.")


def test_el_prompt_pide_texto_plano():
    from app.rag.llm import SYSTEM_PROMPT

    assert "sin Markdown" in SYSTEM_PROMPT
