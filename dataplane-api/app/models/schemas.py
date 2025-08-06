from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime


class HealthCheck(BaseModel):
    """Schema para verificação de saúde da API"""
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0.0"


class PredictionRequest(BaseModel):
    """Schema para a requisição de predição de dano de aeronave."""
    aeronave_tipo_operacao: str
    fator_area: str
    aeronave_tipo_veiculo: str
    aeronave_ano_fabricacao: int
    ocorrencia_uf: str
    aeronave_fatalidades_total: int


class PredictionResponse(BaseModel):
    """Schema para a resposta da predição."""
    prediction: str
    confidence: float


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

class OcurrenceCoordinates(BaseModel):
    """Schema para coordenadas de ocorrências"""
    codigo_ocorrencia: str = Field(..., description="Código único da ocorrência")
    ocorrencia_latitude: float = Field(..., description="Latitude da ocorrência", ge=-90, le=90)
    ocorrencia_longitude: float = Field(..., description="Longitude da ocorrência", ge=-180, le=180)
    ocorrencia_cidade: Optional[str] = Field(None, description="Cidade da ocorrência")
    ocorrencia_uf: Optional[str] = Field(None, description="Estado da ocorrência")
    ocorrencia_classificacao: Optional[str] = Field(None, description="Classificação da ocorrência")
    ocorrencia_dia: Optional[str] = Field(None, description="Data da ocorrência")
    ocorrencia_pais: Optional[str] = Field(None, description="País da ocorrência")
    ocorrencia_aerodromo: Optional[str] = Field(None, description="Aeródromo da ocorrência")
    ocorrencia_hora: Optional[str] = Field(None, description="Hora da ocorrência")
    investigacao_aeronave_liberada: Optional[str] = Field(None, description="Status de liberação da aeronave")
    investigacao_status: Optional[str] = Field(None, description="Status da investigação")
    divulgacao_relatorio_numero: Optional[str] = Field(None, description="Número do relatório de divulgação")
    divulgacao_relatorio_publicado: Optional[str] = Field(None, description="Status de publicação do relatório")
    divulgacao_dia_publicacao: Optional[str] = Field(None, description="Data de publicação do relatório")
    total_recomendacoes: Optional[int] = Field(None, description="Total de recomendações")
    total_aeronaves_envolvidas: Optional[int] = Field(None, description="Total de aeronaves envolvidas")
    ocorrencia_saida_pista: Optional[str] = Field(None, description="Informação sobre saída de pista")


class AeronaveData(BaseModel):
    """Schema para dados de aeronave"""
    codigo_ocorrencia2: Optional[str] = Field(None, description="Código da ocorrência")
    aeronave_matricula: Optional[str] = Field(None, description="Matrícula da aeronave")
    aeronave_operador_categoria: Optional[str] = Field(None, description="Categoria do operador")
    aeronave_tipo_veiculo: Optional[str] = Field(None, description="Tipo de veículo")
    aeronave_fabricante: Optional[str] = Field(None, description="Fabricante da aeronave")
    aeronave_modelo: Optional[str] = Field(None, description="Modelo da aeronave")
    aeronave_tipo_icao: Optional[str] = Field(None, description="Tipo ICAO")
    aeronave_motor_tipo: Optional[str] = Field(None, description="Tipo do motor")
    aeronave_motor_quantidade: Optional[str] = Field(None, description="Quantidade de motores")
    aeronave_pmd: Optional[int] = Field(None, description="PMD da aeronave")
    aeronave_pmd_categoria: Optional[int] = Field(None, description="Categoria PMD")
    aeronave_assentos: Optional[int] = Field(None, description="Número de assentos")
    aeronave_ano_fabricacao: Optional[int] = Field(None, description="Ano de fabricação")
    aeronave_pais_fabricante: Optional[str] = Field(None, description="País do fabricante")
    aeronave_pais_registro: Optional[str] = Field(None, description="País de registro")
    aeronave_registro_categoria: Optional[str] = Field(None, description="Categoria de registro")
    aeronave_registro_segmento: Optional[str] = Field(None, description="Segmento de registro")
    aeronave_voo_origem: Optional[str] = Field(None, description="Origem do voo")
    aeronave_voo_destino: Optional[str] = Field(None, description="Destino do voo")
    aeronave_fase_operacao: Optional[str] = Field(None, description="Fase da operação")
    aeronave_tipo_operacao: Optional[str] = Field(None, description="Tipo de operação")
    aeronave_nivel_dano: Optional[str] = Field(None, description="Nível de dano")
    aeronave_fatalidades_total: Optional[int] = Field(None, description="Total de fatalidades")


class OcurrenceWithAeronave(BaseModel):
    """Schema para ocorrência com dados de aeronave mesclados"""
    codigo_ocorrencia: str = Field(..., description="Código único da ocorrência")
    ocorrencia_latitude: float = Field(..., description="Latitude da ocorrência", ge=-90, le=90)
    ocorrencia_longitude: float = Field(..., description="Longitude da ocorrência", ge=-180, le=180)
    ocorrencia_cidade: Optional[str] = Field(None, description="Cidade da ocorrência")
    ocorrencia_uf: Optional[str] = Field(None, description="Estado da ocorrência")
    ocorrencia_classificacao: Optional[str] = Field(None, description="Classificação da ocorrência")
    ocorrencia_dia: Optional[str] = Field(None, description="Data da ocorrência")
    ocorrencia_pais: Optional[str] = Field(None, description="País da ocorrência")
    ocorrencia_aerodromo: Optional[str] = Field(None, description="Aeródromo da ocorrência")
    ocorrencia_hora: Optional[str] = Field(None, description="Hora da ocorrência")
    investigacao_aeronave_liberada: Optional[str] = Field(None, description="Status de liberação da aeronave")
    investigacao_status: Optional[str] = Field(None, description="Status da investigação")
    divulgacao_relatorio_numero: Optional[str] = Field(None, description="Número do relatório de divulgação")
    divulgacao_relatorio_publicado: Optional[str] = Field(None, description="Status de publicação do relatório")
    divulgacao_dia_publicacao: Optional[str] = Field(None, description="Data de publicação do relatório")
    total_recomendacoes: Optional[int] = Field(None, description="Total de recomendações")
    total_aeronaves_envolvidas: Optional[int] = Field(None, description="Total de aeronaves envolvidas")
    ocorrencia_saida_pista: Optional[str] = Field(None, description="Informação sobre saída de pista")
    
    # Campos de aeronave mesclados diretamente - todos opcionais
    codigo_ocorrencia2: Optional[str] = Field(None, description="Código da ocorrência na aeronave")
    aeronave_matricula: Optional[str] = Field(None, description="Matrícula da aeronave")
    aeronave_operador_categoria: Optional[str] = Field(None, description="Categoria do operador")
    aeronave_tipo_veiculo: Optional[str] = Field(None, description="Tipo de veículo")
    aeronave_fabricante: Optional[str] = Field(None, description="Fabricante da aeronave")
    aeronave_modelo: Optional[str] = Field(None, description="Modelo da aeronave")
    aeronave_tipo_icao: Optional[str] = Field(None, description="Tipo ICAO")
    aeronave_motor_tipo: Optional[str] = Field(None, description="Tipo do motor")
    aeronave_motor_quantidade: Optional[str] = Field(None, description="Quantidade de motores")
    aeronave_pmd: Optional[int] = Field(None, description="PMD da aeronave")
    aeronave_pmd_categoria: Optional[int] = Field(None, description="Categoria PMD")
    aeronave_assentos: Optional[int] = Field(None, description="Número de assentos")
    aeronave_ano_fabricacao: Optional[int] = Field(None, description="Ano de fabricação")
    aeronave_pais_fabricante: Optional[str] = Field(None, description="País do fabricante")
    aeronave_pais_registro: Optional[str] = Field(None, description="País de registro")
    aeronave_registro_categoria: Optional[str] = Field(None, description="Categoria de registro")
    aeronave_registro_segmento: Optional[str] = Field(None, description="Segmento de registro")
    aeronave_voo_origem: Optional[str] = Field(None, description="Origem do voo")
    aeronave_voo_destino: Optional[str] = Field(None, description="Destino do voo")
    aeronave_fase_operacao: Optional[str] = Field(None, description="Fase da operação")
    aeronave_tipo_operacao: Optional[str] = Field(None, description="Tipo de operação")
    aeronave_nivel_dano: Optional[str] = Field(None, description="Nível de dano")
    aeronave_fatalidades_total: Optional[int] = Field(None, description="Total de fatalidades")
    
    class Config:
        # Permite campos extras e ignora valores inválidos
        extra = "ignore"
        validate_assignment = True


class OcurrenceCoordinatesResponse(BaseModel):
    """Schema para resposta das coordenadas de ocorrências"""
    total: int = Field(..., description="Total de ocorrências encontradas")
    ocurrences: List[OcurrenceCoordinates] = Field(..., description="Lista de ocorrências com coordenadas")