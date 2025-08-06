"""# Modelo Final"""

import pandas as pd

from google.colab import drive
drive.mount('/content/drive')

file_path_ocorrencias = '/content/drive/MyDrive/datasets/aeronautica/ocorrencia.csv'
file_path_ocorrencias_tipo = '/content/drive/MyDrive/datasets/aeronautica/ocorrencia_tipo.csv'
file_path_aeronave = '/content/drive/MyDrive/datasets/aeronautica/aeronave.csv'
file_path_fator_contribuinte = '/content/drive/MyDrive/datasets/aeronautica/fator_contribuinte.csv'
file_path_recomendacao = '/content/drive/MyDrive/datasets/aeronautica/recomendacao.csv'

ocorrencia = pd.read_csv(file_path_ocorrencias, encoding='latin1', delimiter=';', on_bad_lines='skip')
ocorrencia_tipo = pd.read_csv(file_path_ocorrencias_tipo, encoding='latin1', delimiter=';', on_bad_lines='skip')
aeronave = pd.read_csv(file_path_aeronave, encoding='latin1', delimiter=';', on_bad_lines='skip')
fator_contribuinte = pd.read_csv(file_path_fator_contribuinte, encoding='latin1', delimiter=';', on_bad_lines='skip')
recomendacao = pd.read_csv(file_path_recomendacao, encoding='latin1', delimiter=';', on_bad_lines='skip')

colunas_codigo = ['codigo_ocorrencia', 'codigo_ocorrencia1', 'codigo_ocorrencia2', 'codigo_ocorrencia3', 'codigo_ocorrencia4']

for col in colunas_codigo[1:]:
  if ocorrencia[col].equals(ocorrencia['codigo_ocorrencia']):
    print(f"A coluna '{col}' tem os mesmos valores que 'codigo_ocorrencia'.")
    ocorrencia = ocorrencia.drop(columns=[col])
    print(f"A coluna '{col}' foi removida.")
  else:
    print(f"A coluna '{col}' tem valores diferentes de 'codigo_ocorrencia'.")

print("\nDataFrame 'ocorrencia' após remover colunas duplicadas:")
print(ocorrencia.head())

ocorrencia_copy = ocorrencia.copy()

print("\nDataFrame 'ocorrencia_copy' criado a partir de 'ocorrencia':")
print(ocorrencia_copy)


ocorrencia_datetime = ocorrencia_copy.copy()

print("\nDataFrame 'ocorrencia_datetime' criado a partir de 'ocorrencia_copy':")
print(ocorrencia_datetime.info())

ocorrencia_datetime['ocorrencia_dia'] = pd.to_datetime(ocorrencia_datetime['ocorrencia_dia'], format='%d/%m/%Y')
ocorrencia_datetime['ocorrencia_hora'] = pd.to_timedelta(ocorrencia_datetime['ocorrencia_hora'], errors='coerce')

ocorrencia_datetime['ocorrencia_hora'] = ocorrencia_datetime['ocorrencia_hora'].apply(
    lambda x: f"{x.components.hours:02d}:{x.components.minutes:02d}:{x.components.seconds:02d}" if pd.notna(x) else None)

ocorrencia_datetime['ocorrencia_hora'] = pd.to_datetime(ocorrencia_datetime['ocorrencia_hora'], format='%H:%M:%S', errors='coerce').dt.time


ocorrencia_datetime['ocorrencia_data_hora'] = ocorrencia_datetime['ocorrencia_dia'] + pd.to_timedelta(ocorrencia_datetime['ocorrencia_hora'].astype(str))


print("\nDataFrame 'ocorrencia' após as alterações:")
print(ocorrencia_datetime.info())
print("\nPrimeiras linhas do DataFrame com o horário formatado:")
print(ocorrencia_datetime.head())


print(ocorrencia_datetime.info())

ocorrencia_colunas_removidas = ocorrencia_datetime.copy()

colunas_para_remocao = ['divulgacao_relatorio_numero', 'divulgacao_dia_publicacao']
ocorrencia_colunas_removidas.drop(columns=colunas_para_remocao, inplace=True)

print(ocorrencia_colunas_removidas.info())

ocorrencia_limpo = ocorrencia_colunas_removidas.copy()
display(ocorrencia_limpo)


ocorrencia_tipo_limpo = ocorrencia_tipo.rename(columns={'codigo_ocorrencia1': 'codigo_ocorrencia'})

if ocorrencia_tipo_limpo['ocorrencia_tipo'].equals(ocorrencia_tipo_limpo['ocorrencia_tipo_categoria']):
    ocorrencia_tipo_limpo = ocorrencia_tipo_limpo.drop(columns=['ocorrencia_tipo_categoria'])
    print("A coluna 'ocorrencia_tipo_categoria' foi removida pois tinha os mesmos valores que 'ocorrencia_tipo'.")
else:
    print("As colunas 'ocorrencia_tipo' e 'ocorrencia_tipo_categoria' têm valores diferentes.")

# Contar número de linhas antes do dropna
linhas_antes = len(ocorrencia_tipo_limpo)

# Remover linhas com valores ausentes
ocorrencia_tipo_limpo.dropna(inplace=True)

# Contar número de linhas após o dropna
linhas_depois = len(ocorrencia_tipo_limpo)

# Calcular quantas linhas foram removidas
linhas_removidas = linhas_antes - linhas_depois

print(f"{linhas_removidas} linhas foram removidas por conter valores nulos.")

display(ocorrencia_tipo_limpo)


fator_contribuinte_limpo = fator_contribuinte.copy()

fator_contribuinte_limpo = fator_contribuinte_limpo.rename(columns={'codigo_ocorrencia3': 'codigo_ocorrencia'})

fator_contribuinte_limpo.replace('***', "FATOR NÃO INFORMADO", inplace=True)

# Exibe a contagem de nulos por coluna
display(fator_contribuinte_limpo.isnull().sum())

# Soma total de valores nulos no DataFrame
total_nulos = fator_contribuinte_limpo.isnull().sum().sum()
print(f"Total de valores nulos no DataFrame: {total_nulos}")

# Exibe o DataFrame limpo
display(fator_contribuinte_limpo)

aeronave_limpo = aeronave.copy()

aeronave_limpo = aeronave_limpo.rename(columns={'codigo_ocorrencia2': 'codigo_ocorrencia'})

for col in aeronave_limpo.select_dtypes(include=['object']).columns:
    aeronave_limpo[col] = aeronave_limpo[col].str.strip()
    aeronave_limpo[col] = aeronave_limpo[col].replace(['***', '****', '*****', 'NULL'], pd.NA)

# Remove colunas desnecessárias
colunas_para_remocao = ['aeronave_operador_categoria', 'aeronave_matricula', 'aeronave_tipo_icao', 'aeronave_registro_categoria', 'aeronave_registro_segmento', 'aeronave_assentos', 'aeronave_motor_quantidade']
aeronave_limpo.drop(columns=colunas_para_remocao, inplace=True)

# Exibe nulos por coluna após remoção
display(aeronave_limpo.isnull().sum())

# Soma total de nulos após remoção
total_nulos = aeronave_limpo.isnull().sum().sum()
print(f"Total de valores nulos no DataFrame após remoção das colunas: {total_nulos}")

# Exibe o DataFrame final
display(aeronave_limpo)

df_limpo = ocorrencia_limpo.copy()

dataframes = [ocorrencia_tipo_limpo, fator_contribuinte_limpo, aeronave_limpo]

# Mostrar contagem de nulos antes do merge
print("Contagem de valores nulos em ocorrencia_tipo_limpo antes do merge:")
display(ocorrencia_tipo_limpo.isnull().sum())

# Realizar os merges
for df in dataframes:
    df_limpo = pd.merge(df_limpo, df, on='codigo_ocorrencia', how='left')

# Identificar colunas que contêm "fator_area"
colunas_fator_area = [col for col in df_limpo.columns if 'fator_area' in col]

# Remover linhas com pelo menos um valor nulo nas colunas 'fator_area'
linhas_antes = len(df_limpo)
df_limpo = df_limpo.dropna(subset=colunas_fator_area)
linhas_depois = len(df_limpo)

print(f"\nRemovidas {linhas_antes - linhas_depois} linhas que tinham nulos em colunas 'fator_area'.")

# Substituir NaNs apenas na coluna alvo (ex: 'nivel_dano')
df_limpo['aeronave_nivel_dano'] = df_limpo['aeronave_nivel_dano'].fillna("NENHUM")

# Mostrar contagem de nulos após substituição
print("\nContagem de valores nulos em df_limpo após tratar a coluna alvo:")
display(df_limpo.isnull().sum())

# Informações do DataFrame final
df_limpo.info()

#MODELO

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

# Suponha que você já tenha o dataset carregado em um DataFrame 'df'

# Selecionar colunas relevantes (sem codificar ainda o target)
cols = ['aeronave_tipo_operacao', 'fator_area', 'aeronave_tipo_veiculo',
        'aeronave_ano_fabricacao', 'ocorrencia_uf', 'aeronave_fatalidades_total',
        'aeronave_nivel_dano']
df_model = df_limpo[cols].copy()

# Codificar variáveis categóricas das features (exceto o target)
label_encoders = {}
features_to_encode = ['aeronave_tipo_operacao', 'fator_area', 'aeronave_tipo_veiculo', 'ocorrencia_uf']
for col in features_to_encode:
    le = LabelEncoder()
    df_model[col] = le.fit_transform(df_model[col].astype(str))
    label_encoders[col] = le

# Codificar o target (aeronave_nivel_dano)
target_encoder = LabelEncoder()
df_model['aeronave_nivel_dano'] = target_encoder.fit_transform(df_model['aeronave_nivel_dano'].astype(str))

# Separar features (X) e target (y)
X = df_model.drop('aeronave_nivel_dano', axis=1)
y = df_model['aeronave_nivel_dano']

# Dividir treino e teste
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Criar e treinar modelo
model = RandomForestClassifier(max_depth=15, random_state=42)
model.fit(X_train, y_train)

# Fazer previsões
y_pred = model.predict(X_test)

# Avaliar
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=target_encoder.classes_))

cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')

print("=== Cross-Validation ===")
print(f"Acurácias por fold: {cv_scores}")
print(f"Média das acurácias : {np.mean(cv_scores):.4f}")
print(f"Desvio padrão       : {np.std(cv_scores):.4f}")

# Exemplo de novo dado para previsão (valores de exemplo)
novo_dado = {
    'aeronave_tipo_operacao': 'PRIVADA',
    'fator_area': 'FATOR HUMANO',
    'aeronave_tipo_veiculo': 'AVIÃO',
    'aeronave_ano_fabricacao': 1980,
    'ocorrencia_uf': 'AC',
    'aeronave_fatalidades_total': 12
}

# Transformar em DataFrame para aplicar o mesmo pré-processamento
df_novo = pd.DataFrame([novo_dado])

# Aplicar LabelEncoder nas colunas categóricas, usando os encoders já treinados
for col in features_to_encode:
    le = label_encoders[col]
    # Importante: usar o método transform, não fit_transform, para manter consistência
    df_novo[col] = le.transform(df_novo[col].astype(str))

# aeronave_ano_fabricacao e aeronave_fatalidades_total são numéricos, já estão ok

# Agora prever com o modelo
predicao_encoded = model.predict(df_novo)

# Converter a previsão codificada para o valor original
predicao_original = target_encoder.inverse_transform(predicao_encoded)
# Obter as probabilidades para cada classe
probas = model.predict_proba(df_novo)

# Índice da classe prevista
classe_predita = predicao_encoded[0]

# Confiança (probabilidade da classe prevista)
confianca = probas[0][classe_predita]

print(f"Nível de dano previsto: {predicao_original[0]}")
print(f"Confiança da previsão: {confianca:.2f}")

import joblib
import os

# Define o caminho para salvar os arquivos na sua Google Drive
save_path = '/content/drive/MyDrive/aeronautica_model'
os.makedirs(save_path, exist_ok=True)

# Salvar o modelo
model_filename = os.path.join(save_path, 'random_forest_model.joblib')
joblib.dump(model, model_filename)
print(f"Modelo salvo em: {model_filename}")

# Salvar os LabelEncoders
encoders_filename = os.path.join(save_path, 'label_encoders.joblib')
joblib.dump(label_encoders, encoders_filename)
print(f"LabelEncoders salvos em: {encoders_filename}")

# Salvar o TargetEncoder
target_encoder_filename = os.path.join(save_path, 'target_encoder.joblib')
joblib.dump(target_encoder, target_encoder_filename)
print(f"TargetEncoder salvo em: {target_encoder_filename}")
