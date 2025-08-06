from fastapi import APIRouter, Depends, HTTPException
from app.services.ai_service import ai_service, AIService
from app.models.schemas import PredictionRequest, PredictionResponse
from typing import Dict, List

ai_router = APIRouter()

@ai_router.post("/predict", response_model=PredictionResponse)
async def predict_damage(
    request: PredictionRequest,
    service: AIService = Depends(lambda: ai_service)
):
    try:
        prediction_data = service.predict(request.dict())
        return prediction_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@ai_router.get("/predict/form-options", response_model=Dict[str, List[str]])
async def get_form_options(
    service: AIService = Depends(lambda: ai_service)
):
    options = {}
    for feature, encoder in service.label_encoders.items():
        # Excluindo valores '<NA>' ou '***' que podem estar nos encoders
        options[feature] = [cls for cls in encoder.classes_ if cls not in ['<NA>', '***']]
    return options 