import json
import re
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.treatment import Treatment
from app.schemas.treatment import TreatmentCreate, TreatmentUpdate, TreatmentResponse
from app.services.auth import get_current_admin

router = APIRouter(prefix="/api/treatments", tags=["Treatments"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "static" / "uploads"


def _generate_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[TreatmentResponse])
def list_treatments(db: Session = Depends(get_db)):
    """List all active treatments ordered by sort_order then name."""
    treatments = (
        db.query(Treatment)
        .filter(Treatment.is_active == True)
        .order_by(Treatment.sort_order, Treatment.name)
        .all()
    )
    return treatments


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    """List distinct categories from active treatments."""
    rows = (
        db.query(Treatment.category)
        .filter(Treatment.is_active == True, Treatment.category.isnot(None))
        .distinct()
        .order_by(Treatment.category)
        .all()
    )
    return [row[0] for row in rows]


@router.get("/{slug}", response_model=TreatmentResponse)
def get_treatment_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get a single treatment by its slug."""
    treatment = (
        db.query(Treatment)
        .filter(Treatment.slug == slug, Treatment.is_active == True)
        .first()
    )
    if not treatment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Treatment not found",
        )
    return treatment


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------


@router.post("/", response_model=TreatmentResponse, status_code=status.HTTP_201_CREATED)
def create_treatment(
    treatment_in: TreatmentCreate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Create a new treatment (admin only)."""
    slug = _generate_slug(treatment_in.name)

    # Ensure slug uniqueness
    existing = db.query(Treatment).filter(Treatment.slug == slug).first()
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    treatment = Treatment(**treatment_in.model_dump(), slug=slug)
    db.add(treatment)
    db.commit()
    db.refresh(treatment)
    return treatment


@router.put("/{treatment_id}", response_model=TreatmentResponse)
def update_treatment(
    treatment_id: int,
    treatment_in: TreatmentUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Update a treatment's fields (admin only). Only non-None fields are applied."""
    treatment = db.query(Treatment).filter(Treatment.id == treatment_id).first()
    if not treatment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Treatment not found",
        )

    update_data = treatment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(treatment, field, value)

    db.commit()
    db.refresh(treatment)
    return treatment


@router.delete("/{treatment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_treatment(
    treatment_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Soft-delete a treatment by setting is_active=False (admin only)."""
    treatment = db.query(Treatment).filter(Treatment.id == treatment_id).first()
    if not treatment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Treatment not found",
        )

    treatment.is_active = False
    db.commit()


@router.post("/{treatment_id}/upload-image")
async def upload_treatment_image(
    treatment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Upload a main image for a treatment (admin only)."""
    treatment = db.query(Treatment).filter(Treatment.id == treatment_id).first()
    if not treatment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Treatment not found",
        )

    ext = Path(file.filename).suffix if file.filename else ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(filepath, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    url_path = f"/static/uploads/{filename}"
    treatment.image_url = url_path
    db.commit()
    db.refresh(treatment)

    return {"image_url": url_path}


@router.post("/{treatment_id}/upload-gallery")
async def upload_treatment_gallery(
    treatment_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Upload multiple gallery images for a treatment (admin only)."""
    treatment = db.query(Treatment).filter(Treatment.id == treatment_id).first()
    if not treatment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Treatment not found",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Parse existing gallery URLs
    existing_urls: list[str] = []
    if treatment.gallery_urls:
        try:
            existing_urls = json.loads(treatment.gallery_urls)
        except (json.JSONDecodeError, TypeError):
            existing_urls = []

    new_urls: list[str] = []
    for upload_file in files:
        ext = Path(upload_file.filename).suffix if upload_file.filename else ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = UPLOAD_DIR / filename

        async with aiofiles.open(filepath, "wb") as out_file:
            content = await upload_file.read()
            await out_file.write(content)

        new_urls.append(f"/static/uploads/{filename}")

    all_urls = existing_urls + new_urls
    treatment.gallery_urls = json.dumps(all_urls)
    db.commit()
    db.refresh(treatment)

    return {"gallery_urls": all_urls}
