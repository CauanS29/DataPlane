import joblib
import pandas as pd
from typing import Dict, Any

class AIService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIService, cls).__new__(cls)
            cls._instance._load_model_and_encoders()
        return cls._instance

    def _load_model_and_encoders(self):
        self.model = joblib.load('model/checkpoint/random_forest_model.joblib')
        self.label_encoders = joblib.load('model/label_encoders/label_encoders.joblib')
        self.target_encoder = joblib.load('model/target_encoders/target_encoder.joblib')
    
    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        df_novo = pd.DataFrame([data])

        features_to_encode = ['aeronave_tipo_operacao', 'fator_area', 'aeronave_tipo_veiculo', 'ocorrencia_uf']
        for col in features_to_encode:
            le = self.label_encoders[col]
            df_novo[col] = le.transform(df_novo[col].astype(str))

        predicao_encoded = self.model.predict(df_novo)
        predicao_original = self.target_encoder.inverse_transform(predicao_encoded)
        
        probas = self.model.predict_proba(df_novo)
        classe_predita = predicao_encoded[0]
        confianca = probas[0][classe_predita]

        return {"prediction": predicao_original[0], "confidence": float(confianca)}

ai_service = AIService() 