import pandas as pd
from main import AIEvaluator, AWSBedrockConfig

def main():
    # Read input Excel file
    input_file = "sample_gana 1.xlsx"
    try:
        df = pd.read_excel(input_file)
    except FileNotFoundError:
        print(f"Error: {input_file} not found.")
        exit(1)

    # Normalize column names to lowercase
    df.columns = df.columns.str.lower()

    # Extract required columns
    questions = df['question'].tolist()
    answers = df['answer'].tolist()
    ground_truths = df['ground_truth'].tolist()
    # Handle context being string or list
    contexts = df['context'].apply(lambda x: [x] if isinstance(x, str) else x).tolist()

    # Initialize evaluator
    config = AWSBedrockConfig()
    evaluator = AIEvaluator(config)

    print("\n" + "="*60)
    print("Running AI Evaluation")
    print("="*60)

    # Run full evaluation
    results = evaluator.evaluate_all(
        questions=questions,
        answers=answers,
        ground_truths=ground_truths,
        contexts=contexts
    )

    # Combine results with input data
    output_df = df.copy()

    # Add RAG metrics
    if 'rag' in results:
        rag_df = results['rag']
        for col in rag_df.columns:
            output_df[f'rag_{col}'] = rag_df[col].values

    # Add Safety metrics
    if 'safety' in results:
        safety_results = results['safety']
        # Convert list of dicts to DataFrame
        safety_df = pd.DataFrame(safety_results)
        for col in safety_df.columns:
            output_df[f'safety_{col}'] = safety_df[col].values

    # Add NLP metrics
    if 'nlp' in results:
        for metric, score in results['nlp'].items():
            output_df[f'nlp_{metric}'] = score

    # Save to output Excel file
    output_file = "output_results.xlsx"
    output_df.to_excel(output_file, index=False)

    print(f"\n✓ Results saved to {output_file}")

if __name__ == "__main__":
    main()