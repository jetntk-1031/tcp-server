FROM python:3.10-slim

WORKDIR /app
COPY server.py /app

CMD ["python", "server.py"]
