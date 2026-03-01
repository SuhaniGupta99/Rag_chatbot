import ollama


class LLMService:
    def __init__(self, model="llama3:8b-instruct-q4_0"):
        self.model = model

    def generate_answer(self, question, context):
        if context.strip():
            prompt = f"""
You are a knowledgeable assistant.

Use ONLY the information provided in the context to answer the question.
If the context does not contain relevant information, clearly say:
"No such information is present in the uploaded documents."

Context:
{context}

Question:
{question}

Provide a clear, well-structured answer in 5–7 sentences.
"""
        else:
            # General knowledge fallback
            prompt = f"""
You are a knowledgeable assistant.

Answer the following question clearly and concisely in 5–7 sentences.

Question:
{question}
"""

        response = ollama.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            options={
                "temperature": 0.3,
                "top_p": 0.9,
                "num_predict": 400
            }
        )

        return response["message"]["content"]