"""HU-29: directorio de lugares del asistente (RF-29.11, RF-29.12, RF-29.15), sin Postgres."""

from app.places.directory import PlaceDirectory, seed_directory


def row(slug, name, keywords=(), schedule="Lun–Vie 8:00–16:00", short_name=None):
    return {
        "slug": slug,
        "name": name,
        "keywords": list(keywords),
        "schedule": schedule,
        "short_name": short_name,
        "lat": -12.05,
        "lng": -77.08,
    }


class Clock:
    def __init__(self):
        self.now = 0.0

    def __call__(self):
        return self.now


def test_rf_29_11_encuentra_un_lugar_por_nombre_sigla_o_palabra_clave():
    directory = PlaceDirectory(lambda: [row("fisi", "Facultad de Sistemas", ["informatica"], short_name="FISI")])
    for query in ("quiero ir a la facultad de sistemas", "dónde queda la FISI", "carrera de informática"):
        assert [p.id for p in directory.find(query)] == ["fisi"], query


def test_rf_29_11_el_id_es_el_slug_y_hereda_las_coordenadas():
    place = PlaceDirectory(lambda: [row("fisi", "FISI")]).get("fisi")
    assert place.id == "fisi"
    assert (place.coordinate.latitude, place.coordinate.longitude) == (-12.05, -77.08)


def test_rf_29_12_una_palabra_clave_no_coincide_dentro_de_otra_palabra():
    directory = PlaceDirectory(lambda: [row("pre", "Preuniversitario", ["pre"])])
    assert directory.find("¿cuál es el presupuesto?") == []
    assert [p.id for p in directory.find("horario del pre")] == ["pre"]


def test_rf_29_12_el_numero_de_una_puerta_no_coincide_con_otro_numero():
    directory = PlaceDirectory(lambda: [row("puerta-1", "Puerta 1")])
    assert directory.find("la puerta 10") == []
    assert [p.id for p in directory.find("la puerta 1")] == ["puerta-1"]


def test_rf_29_11_la_coincidencia_mas_especifica_va_primero():
    # La cafetería sale antes por orden alfabético, pero la consulta nombra la facultad completa.
    directory = PlaceDirectory(
        lambda: [
            row("cafeteria-civil", "Cafetería de Ingeniería Civil", ["ingenieria civil"]),
            row("fic", "Facultad de Ingeniería Civil", ["ingenieria civil"]),
        ]
    )
    assert [p.id for p in directory.find("cómo llego a la facultad de ingeniería civil")] == ["fic", "cafeteria-civil"]


def test_rf_29_15_la_lista_caduca_a_los_60_segundos():
    clock, calls = Clock(), []

    def loader():
        calls.append(1)
        return [row("a", "Lugar A")]

    directory = PlaceDirectory(loader, ttl=60, clock=clock)
    directory.find("lugar a")
    clock.now = 59
    directory.find("lugar a")
    assert len(calls) == 1
    clock.now = 60
    directory.find("lugar a")
    assert len(calls) == 2


def test_rf_29_15_invalidate_refresca_de_inmediato():
    lugares = [row("a", "Lugar A")]
    directory = PlaceDirectory(lambda: list(lugares), clock=Clock())
    assert directory.published_slugs() == {"a"}

    lugares.append(row("b", "Lugar B"))
    assert directory.published_slugs() == {"a"}  # aún en memoria

    directory.invalidate()
    assert directory.published_slugs() == {"a", "b"}


def test_la_semilla_alimenta_el_modo_de_prueba():
    directory = seed_directory()
    assert "biblioteca-central" in directory.published_slugs()
    assert [p.id for p in directory.find("horario de la biblioteca")][:1] == ["biblioteca-central"]
