from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class HealthCheck(BaseModel):
    """Schema para verificação de saúde da API"""
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0.0"


class AIRequest(BaseModel):
    """Schema para requisições de IA"""
    prompt: str = Field(..., min_length=1, max_length=1000, description="Texto de entrada para a IA")
    max_length: Optional[int] = Field(default=512, ge=1, le=2048, description="Comprimento máximo da resposta")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0, description="Temperatura para geração")
    top_p: Optional[float] = Field(default=0.9, ge=0.0, le=1.0, description="Top-p para geração")
    do_sample: Optional[bool] = Field(default=True, description="Se deve usar amostragem")


class AIResponse(BaseModel):
    """Schema para respostas da IA"""
    generated_text: str = Field(..., description="Texto gerado pela IA")
    prompt: str = Field(..., description="Prompt original")
    model_name: str = Field(..., description="Nome do modelo usado")
    generation_time: float = Field(..., description="Tempo de geração em segundos")
    tokens_generated: int = Field(..., description="Número de tokens gerados")


class ErrorResponse(BaseModel):
    """Schema para respostas de erro"""
    error: str = Field(..., description="Mensagem de erro")
    detail: Optional[str] = Field(None, description="Detalhes adicionais do erro")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ModelInfo(BaseModel):
    """Schema para informações do modelo de IA"""
    model_name: str
    model_path: str
    is_loaded: bool
    max_length: int
    temperature: float
    last_loaded: Optional[datetime] = None


class AIRequestHistory(BaseModel):
    """Schema para histórico de requisições de IA"""
    id: Optional[str] = None
    prompt: str
    generated_text: str
    model_name: str
    generation_time: int  # em milissegundos
    tokens_generated: int
    created_at: datetime = Field(default_factory=datetime.utcnow) 