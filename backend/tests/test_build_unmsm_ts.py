"""Tests del generador `build_unmsm_ts` (raw JSON de Places -> TS), sin red."""

from __future__ import annotations

import json

import pytest

from app.tools.maps.build_unmsm_ts import _load_raw, main


def _raw_place() -> dict:
    """Un lugar crudo (forma de Places API New) dentro del campus."""
    return {
        "displayName": {"text": "Cafetería de Prueba"},
        "location": {"latitude": -12.056, "longitude": -77.083},
        "types": ["cafe", "establishment"],
        "editorialSummary": {"text": "Una cafetería de prueba en el campus."},
        "nationalPhoneNumber": "(01) 619-7000",
    }


def _write(path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def test_load_raw_accepts_list_and_object(tmp_path):
    as_list = tmp_path / "list.json"
    _write(as_list, [_raw_place()])
    assert len(_load_raw(as_list)) == 1

    as_object = tmp_path / "obj.json"
    _write(as_object, {"places": [_raw_place()]})
    assert len(_load_raw(as_object)) == 1


def test_main_refuses_to_overwrite_curated(tmp_path):
    raw = tmp_path / "raw.json"
    _write(raw, [_raw_place()])
    with pytest.raises(SystemExit):
        main(["--raw", str(raw), "--out", str(tmp_path / "unmsm.ts")])


def test_main_exits_when_raw_missing(tmp_path):
    with pytest.raises(SystemExit):
        main(["--raw", str(tmp_path / "nope.json"), "--out", str(tmp_path / "out.generated.ts")])


def test_main_generates_ts(tmp_path):
    raw = tmp_path / "raw.json"
    _write(raw, [_raw_place()])
    out = tmp_path / "unmsm.generated.ts"

    rc = main(["--raw", str(raw), "--out", str(out), "--no-bounds-filter"])

    assert rc == 0
    ts = out.read_text(encoding="utf-8")
    assert "CAMPUS_PLACES" in ts
    assert "Cafetería de Prueba" in ts
    assert "coordinate" in ts
