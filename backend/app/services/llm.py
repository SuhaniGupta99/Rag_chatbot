import ollama


class LLMService:
    def __init__(self, model="mistral:7b-instruct-q4_K_M"):
        self.model = model

    def generate_answer(self, question: str, context: str) -> str:
        prompt = f"""
You are a helpful assistant.
Answer the question briefly using ONLY the context.
If the answer is not present, say "I don't know".

Context:
{context}

Question:
{question}

Short Answer:
"""

        try:
            response = ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a precise and factual assistant."},
                    {"role": "user", "content": prompt}
                ]
            )

            return response["message"]["content"].strip()

        except Exception as e:
            # 🔥 This prevents 500 crash
            print("OLLAMA ERROR:", e)
            return "Error generating response from LLaMA 3."
