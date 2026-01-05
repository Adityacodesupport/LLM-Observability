
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/results")
async def get_results():
    file_path = "output_results.xlsx"
    if not os.path.exists(file_path):
        return {"error": "Results file not found"}
    
    try:
        df = pd.read_excel(file_path)
        # Replace NaN with None (null in JSON)
        df = df.where(pd.notnull(df), None)
        
        # Convert to list of dicts
        records = df.to_dict(orient="records")
        
        # Calculate summary metrics
        summary = {
            "total_samples": len(df),
            "rag_faithfulness": df["rag_faithfulness"].mean() if "rag_faithfulness" in df else 0,
            "rag_answer_relevancy": df["rag_answer_relevancy"].mean() if "rag_answer_relevancy" in df else 0,
            "rag_context_precision": df["rag_context_precision"].mean() if "rag_context_precision" in df else 0,
            "rag_context_recall": df["rag_context_recall"].mean() if "rag_context_recall" in df else 0,
            "nlp_bleu": df["nlp_bleu"].mean() if "nlp_bleu" in df else 0,
            "nlp_rougeL": df["nlp_rougeL"].mean() if "nlp_rougeL" in df else 0,
            "safety_bias": df["safety_bias"].mean() if "safety_bias" in df else 0,
            "safety_toxicity": df["safety_toxicity"].mean() if "safety_toxicity" in df else 0,
            "safety_conciseness": df["safety_conciseness"].mean() if "safety_conciseness" in df else 0,
        }
        
        return {
            "summary": summary,
            "data": records
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
