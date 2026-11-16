"""Base de conocimiento del campus: tipos de lugar y corpus general de documentos."""

from app.knowledge.corpus import DOCUMENTS, Document
from app.knowledge.places import CampusPlace, Coordinate, normalize

__all__ = [
    "CampusPlace",
    "Coordinate",
    "normalize",
    "DOCUMENTS",
    "Document",
]
