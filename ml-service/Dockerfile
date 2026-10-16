FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

COPY requirements.txt ./
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY data/ ./data/
COPY models/ ./models/
COPY test_samples/ ./test_samples/
COPY main.py ./

# Pre-populate torch hub cache so container never needs external internet for weights
RUN mkdir -p /root/.cache/torch/hub/checkpoints && \
    if [ -f models/mobilenet_v2-7ebf99e0.pth ]; then cp models/mobilenet_v2-7ebf99e0.pth /root/.cache/torch/hub/checkpoints/; fi

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
