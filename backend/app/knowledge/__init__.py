"""Base de conocimiento del campus: lugares y corpus de documentos."""

from app.knowledge.corpus import DOCUMENTS, Document
from app.knowledge.places import (
    CAMPUS_PLACES,
    CampusPlace,
    Coordinate,
    find_places,
    get_place_by_id,
    normalize,
)

__all__ = [
    "CAMPUS_PLACES",
    "CampusPlace",
    "Coordinate",
    "find_places",
    "get_place_by_id",
    "normalize",
    "DOCUMENTS",
    "Document",
]
