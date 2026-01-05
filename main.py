# main.py
import os
# Fix for git warning
os.environ['GIT_PYTHON_REFRESH'] = 'quiet'

import json
import boto3
from typing import List, Dict, Any
from datasets import Dataset
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# RAGAS
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper

# LangChain + Bedrock
from langchain_aws import ChatBedrock, BedrockEmbeddings

# DeepEval
from deepeval import evaluate as deepeval_evaluate
from deepeval.test_case import LLMTestCase
from deepeval.metrics import BiasMetric, ToxicityMetric, AnswerRelevancyMetric, GEval
from deepeval.models.base_model import DeepEvalBaseLLM

# Traditional NLP
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from rouge_score import rouge_scorer
import Levenshtein


class AWSBedrockConfig:
    """AWS Bedrock configuration and client initialization"""
    
    def __init__(
        self,
        region: str = None,
        judge_model: str = "anthropic.claude-3-sonnet-20240229-v1:0",
        embedding_model: str = "amazon.titan-embed-text-v2:0"
    ):
        # Get credentials from environment
        aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.region = region or os.getenv("AWS_REGION", "us-east-1")
        self.judge_model = judge_model
        self.embedding_model = embedding_model
        
        # Create client
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=self.region,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key
        )


class BedrockLLM(DeepEvalBaseLLM):
    """Bedrock LLM wrapper for DeepEval"""
    
    def __init__(self, config: AWSBedrockConfig):
        self.config = config
        self.client = config.client
    
    def load_model(self):
        return self.client
    
    def generate(self, prompt: str) -> str:
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "temperature": 0.1,
            "messages": [{"role": "user", "content": prompt}]
        })
        
        response = self.client.invoke_model(
            modelId=self.config.judge_model,
            body=body
        )
        
        response_body = json.loads(response['body'].read())
        return response_body['content'][0]['text']
    
    async def a_generate(self, prompt: str) -> str:
        return self.generate(prompt)
    
    def get_model_name(self) -> str:
        return self.config.judge_model


class RAGMetrics:
    """RAGAS-based RAG evaluation metrics"""
    
    def __init__(self, config: AWSBedrockConfig):
        self.config = config
        self.llm = self._get_llm()
        self.embeddings = self._get_embeddings()
    
    def _get_llm(self):
        langchain_llm = ChatBedrock(
            model_id=self.config.judge_model,
            client=self.config.client,
            model_kwargs={"temperature": 0.1, "max_tokens": 1000}
        )
        return LangchainLLMWrapper(langchain_llm)
    
    def _get_embeddings(self):
        langchain_embeddings = BedrockEmbeddings(
            model_id=self.config.embedding_model,
            client=self.config.client
        )
        return LangchainEmbeddingsWrapper(langchain_embeddings)
    
    def evaluate(self, dataset: Dataset) -> pd.DataFrame:
        metrics = [faithfulness, answer_relevancy, context_precision, context_recall]
        
        results = evaluate(
            dataset,
            metrics=metrics,
            llm=self.llm,
            embeddings=self.embeddings
        )
        
        return results.to_pandas()


class SafetyMetrics:
    """DeepEval-based safety and quality metrics"""
    
    def __init__(self, config: AWSBedrockConfig):
        self.llm = BedrockLLM(config)
    
    def evaluate(self, test_cases: List[LLMTestCase]) -> List[Dict[str, float]]:
        """
        Evaluate safety and quality aspects
        
        Args:
            test_cases: List of LLMTestCase objects
            
        Returns:
            List of dictionaries containing metric scores for each test case
        """
        from deepeval.test_case import LLMTestCaseParams
        
        metrics = [
            BiasMetric(model=self.llm, threshold=0.5),
            ToxicityMetric(model=self.llm, threshold=0.5),
            AnswerRelevancyMetric(model=self.llm, threshold=0.7),
            GEval(
                name="conciseness",
                criteria="Evaluate if the answer is concise without unnecessary verbosity",
                evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
                model=self.llm,
                threshold=0.7
            )
        ]
        
        # deepeval_evaluate returns an EvaluationResult object
        evaluation_result = deepeval_evaluate(test_cases=test_cases, metrics=metrics)
        
        # Extract test results from the EvaluationResult object
        test_results = evaluation_result.test_results
        
        results = []
        for test_result in test_results:
            metric_scores = {}
            # Access metrics_data from TestResult object
            for metric in test_result.metrics_data:
                metric_name = metric.__class__.__name__.lower().replace("metric", "")
                if metric_name == "geval":
                    metric_name = metric.name.lower()
                metric_scores[metric_name] = metric.score
            results.append(metric_scores)
            
        return results


class NLPMetrics:
    """Traditional NLP metrics"""
    
    @staticmethod
    def calculate_bleu(predictions: List[str], references: List[str]) -> float:
        """Calculate average BLEU score"""
        smoothing = SmoothingFunction().method1
        scores = []
        
        for pred, ref in zip(predictions, references):
            score = sentence_bleu([ref.split()], pred.split(), smoothing_function=smoothing)
            scores.append(score)
        
        return sum(scores) / len(scores)
    
    @staticmethod
    def calculate_rouge(predictions: List[str], references: List[str]) -> Dict[str, float]:
        """Calculate ROUGE scores"""
        scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
        rouge1_scores, rouge2_scores, rougeL_scores = [], [], []
        
        for pred, ref in zip(predictions, references):
            scores = scorer.score(ref, pred)
            rouge1_scores.append(scores['rouge1'].fmeasure)
            rouge2_scores.append(scores['rouge2'].fmeasure)
            rougeL_scores.append(scores['rougeL'].fmeasure)
        
        return {
            "rouge1": sum(rouge1_scores) / len(rouge1_scores),
            "rouge2": sum(rouge2_scores) / len(rouge2_scores),
            "rougeL": sum(rougeL_scores) / len(rougeL_scores)
        }
    
    @staticmethod
    def calculate_levenshtein(predictions: List[str], references: List[str]) -> float:
        """Calculate average Levenshtein distance"""
        distances = [Levenshtein.distance(pred, ref) for pred, ref in zip(predictions, references)]
        return sum(distances) / len(distances)
    
    @staticmethod
    def calculate_exact_match(predictions: List[str], references: List[str]) -> float:
        """Calculate exact match accuracy"""
        matches = [pred.strip().lower() == ref.strip().lower() for pred, ref in zip(predictions, references)]
        return sum(matches) / len(matches)


class AIEvaluator:
    """Main evaluation orchestrator"""
    
    def __init__(self, config: AWSBedrockConfig):
        self.config = config
        self.rag_metrics = RAGMetrics(config)
        self.safety_metrics = SafetyMetrics(config)
        self.nlp_metrics = NLPMetrics()
    
    def evaluate_rag(
        self,
        questions: List[str],
        answers: List[str],
        ground_truths: List[str],
        contexts: List[List[str]]
    ) -> pd.DataFrame:
        """Evaluate RAG system with RAGAS metrics"""
        data = {
            'question': questions,
            'answer': answers,
            'ground_truth': ground_truths,
            'contexts': contexts
        }
        dataset = Dataset.from_dict(data)
        return self.rag_metrics.evaluate(dataset)
    
    def evaluate_safety(
        self,
        questions: List[str],
        answers: List[str],
        ground_truths: List[str],
        contexts: List[List[str]]
    ) -> List[Dict[str, float]]:
        """Evaluate safety and quality with DeepEval"""
        test_cases = [
            LLMTestCase(
                input=q,
                actual_output=a,
                expected_output=gt,
                context=ctx
            )
            for q, a, gt, ctx in zip(questions, answers, ground_truths, contexts)
        ]
        return self.safety_metrics.evaluate(test_cases)
    
    def evaluate_nlp(
        self,
        predictions: List[str],
        references: List[str]
    ) -> Dict[str, float]:
        """Evaluate with traditional NLP metrics"""
        return {
            "bleu": self.nlp_metrics.calculate_bleu(predictions, references),
            **self.nlp_metrics.calculate_rouge(predictions, references),
            "levenshtein": self.nlp_metrics.calculate_levenshtein(predictions, references),
            "exact_match": self.nlp_metrics.calculate_exact_match(predictions, references)
        }
    
    def evaluate_all(
        self,
        questions: List[str],
        answers: List[str],
        ground_truths: List[str],
        contexts: List[List[str]],
        include_rag: bool = True,
        include_safety: bool = True,
        include_nlp: bool = True
    ) -> Dict[str, Any]:
        """Run complete evaluation pipeline"""
        results = {}
        
        if include_rag:
            print("\n=== RAG Metrics ===")
            results['rag'] = self.evaluate_rag(questions, answers, ground_truths, contexts)
            print(results['rag'])
        
        if include_safety:
            print("\n=== Safety Metrics ===")
            results['safety'] = self.evaluate_safety(questions, answers, ground_truths, contexts)
        
        if include_nlp:
            print("\n=== NLP Metrics ===")
            results['nlp'] = self.evaluate_nlp(answers, ground_truths)
            for metric, score in results['nlp'].items():
                print(f"{metric}: {score:.4f}")
        
        return results


