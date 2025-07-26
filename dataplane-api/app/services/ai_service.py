import time
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from typing import Optional, Dict, Any
from app.config.settings import settings
from app.utils.logger import app_logger
from app.models.schemas import AIRequest, AIResponse


class AIService:
    """Serviço para integração com modelos de IA pré-treinados"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.generator = None
        self.is_loaded = False
        self.model_name = settings.AI_MODEL_NAME
        self.model_path = settings.AI_MODEL_PATH
    
    def load_model(self) -> bool:
        """Carrega o modelo de IA"""
        try:
            app_logger.info(f"Carregando modelo: {self.model_name}")
            
            # Carrega o tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                cache_dir=self.model_path
            )
            
            # Adiciona padding token se não existir
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Carrega o modelo
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                cache_dir=self.model_path,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None
            )
            
            # Cria o pipeline de geração
            self.generator = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if torch.cuda.is_available() else -1
            )
            
            self.is_loaded = True
            app_logger.info("Modelo carregado com sucesso")
            return True
            
        except Exception as e:
            app_logger.error(f"Erro ao carregar modelo: {e}")
            self.is_loaded = False
            return False
    
    def unload_model(self):
        """Descarrega o modelo da memória"""
        try:
            if self.model:
                del self.model
                del self.tokenizer
                del self.generator
                self.model = None
                self.tokenizer = None
                self.generator = None
                self.is_loaded = False
                
                # Limpa cache do CUDA se disponível
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                
                app_logger.info("Modelo descarregado com sucesso")
        except Exception as e:
            app_logger.error(f"Erro ao descarregar modelo: {e}")
    
    def generate_text(self, request: AIRequest) -> AIResponse:
        """Gera texto usando o modelo de IA"""
        if not self.is_loaded:
            if not self.load_model():
                raise Exception("Não foi possível carregar o modelo de IA")
        
        try:
            start_time = time.time()
            
            # Configura parâmetros de geração
            generation_config = {
                "max_length": request.max_length,
                "temperature": request.temperature,
                "top_p": request.top_p,
                "do_sample": request.do_sample,
                "pad_token_id": self.tokenizer.eos_token_id,
                "eos_token_id": self.tokenizer.eos_token_id,
            }
            
            # Gera o texto
            outputs = self.generator(
                request.prompt,
                **generation_config,
                return_full_text=False
            )
            
            # Extrai o texto gerado
            generated_text = outputs[0]["generated_text"]
            
            # Calcula tempo de geração
            generation_time = time.time() - start_time
            
            # Conta tokens gerados
            input_tokens = len(self.tokenizer.encode(request.prompt))
            output_tokens = len(self.tokenizer.encode(generated_text))
            tokens_generated = output_tokens - input_tokens
            
            app_logger.info(f"Texto gerado em {generation_time:.2f}s - {tokens_generated} tokens")
            
            return AIResponse(
                generated_text=generated_text,
                prompt=request.prompt,
                model_name=self.model_name,
                generation_time=generation_time,
                tokens_generated=tokens_generated
            )
            
        except Exception as e:
            app_logger.error(f"Erro na geração de texto: {e}")
            raise Exception(f"Erro na geração de texto: {str(e)}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Retorna informações sobre o modelo"""
        return {
            "model_name": self.model_name,
            "model_path": self.model_path,
            "is_loaded": self.is_loaded,
            "max_length": settings.AI_MAX_LENGTH,
            "temperature": settings.AI_TEMPERATURE,
            "device": "cuda" if torch.cuda.is_available() else "cpu",
            "cuda_available": torch.cuda.is_available()
        }
    
    def health_check(self) -> bool:
        """Verifica se o serviço de IA está funcionando"""
        try:
            if not self.is_loaded:
                return self.load_model()
            
            # Testa com um prompt simples
            test_request = AIRequest(
                prompt="Hello",
                max_length=10,
                temperature=0.7
            )
            
            response = self.generate_text(test_request)
            return len(response.generated_text) > 0
            
        except Exception as e:
            app_logger.error(f"Erro no health check da IA: {e}")
            return False


# Instância global do serviço de IA
ai_service = AIService() 