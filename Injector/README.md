# Injector

Injector is a micro-service to preprocess and inject data to Elasticsearch.

## Requirements

1. gunicorn install
2. python 2.7
3. pip

## Installation

Execute INSTALL.sh or `pip install -r requirement.txt`

## Start Injector Server (Continuous update)

Execute start-server-local.sh or `ENV=DEV gunicorn server:app --reload --bind=0.0.0.0:3002`

## Start Crawler for bulk insert

1. Install anaconda
2. Execute `jupyter notebook`
3. Instructions are available in ***Ingestion.ipynb***
