import ollama

class LLMService:
    def __init__(self, model="tinyllama"):
        self.model = model

    def generate_answer(self, question, context):
        prompt = f"""
You are a knowledgeable assistant.
Answer using ONLY the information in the context.
If the answer is not present, say "I don't know".

Context:
{context}

Question:
{question}

Give a clear, well-explained answer in 5–7 sentences.
"""
        response = ollama.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            options={
                "temperature": 0.4,
                "num_predict": 350,
                "top_p": 0.9
            }
        )
        return response["message"]["content"]
