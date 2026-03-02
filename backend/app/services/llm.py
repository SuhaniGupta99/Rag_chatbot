import ollama


class LLMService:
    def __init__(self, model="llama3:8b-instruct-q4_0"):
        self.model = model

    # 🔹 Normal (non-streaming)
    def generate_answer(self, question, context):
        prompt = f"""
You are a knowledgeable assistant.

{context}

Question:
{question}
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

    # 🔥 Streaming generator
    def stream_answer(self, question, context):
        prompt = f"""
You are a knowledgeable assistant.

{context}

Question:
{question}
"""

        stream = ollama.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
            options={
                "temperature": 0.4,
                "num_predict": 350,
                "top_p": 0.9
            }
        )

        for chunk in stream:
            if "message" in chunk:
                yield chunk["message"]["content"]