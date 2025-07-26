import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    """Testa o endpoint básico de health check"""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert data["version"] == "1.0.0"


def test_root_endpoint():
    """Testa o endpoint raiz"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "docs" in data


def test_docs_endpoint():
    """Testa se a documentação está disponível"""
    response = client.get("/docs")
    assert response.status_code == 200


def test_redoc_endpoint():
    """Testa se a documentação ReDoc está disponível"""
    response = client.get("/redoc")
    assert response.status_code == 200 