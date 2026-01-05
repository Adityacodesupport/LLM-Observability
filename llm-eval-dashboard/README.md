
# LLM Observability Dashboard

This dashboard visualizes the evaluation results from `output_results.xlsx`.

## Prerequisites

- Node.js & npm
- Python 3.8+

## Setup & Running

1.  **Backend (API)**
    Open a terminal in the root directory (`LLM-Observability`) and run:
    ```bash
    .\venv\Scripts\python.exe api.py
    ```
    The API will start at http://localhost:8000.

2.  **Frontend (Dashboard)**
    Open a new terminal in `llm-eval-dashboard` and run:
    ```bash
    npm install
    npm run dev
    ```
    The dashboard will be available at http://localhost:5173.

## Features

- **Summary Metrics**: Faithfulness, Answer Relevancy, Context Precision/Recall, NLP Scores.
- **Visualizations**: Radar chart for RAG metrics, Bar chart for NLP metrics.
- **Detailed Analysis**: Searchable table of Q&A pairs with expandable details showing context, ground truth, and model answers.
