import ollama
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
class LLMService:
    def __init__(self, model="phi3:mini", temperature=0.4):
        self.model = model
        self.temperature = temperature

        # 🔥 Detect provider
        if model.startswith("groq:"):
            self.provider = "groq"

            self.client = OpenAI(
                api_key=os.getenv("GROQ_API_KEY"),
                base_url="https://api.groq.com/openai/v1"
            )

            # remove prefix
            self.actual_model = model.replace("groq:", "")

        else:
            self.provider = "ollama"

    # 🔹 NON-STREAMING
    def generate_answer(self, question, context):
        prompt = context

        if self.provider == "ollama":
            response = ollama.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                options={
                    "temperature": self.temperature,
                    "num_predict": 800,
                    "top_p": 0.9
                }
            )

            return response["message"]["content"]

        else:
            response = self.client.chat.completions.create(
                model=self.actual_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=self.temperature,
                max_tokens=800
            )

            return response.choices[0].message.content

    # 🔥 STREAMING
    def stream_answer(self, question, context):
        prompt = context

        if self.provider == "ollama":
            stream = ollama.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                options={
                    "temperature": self.temperature,
                    "num_predict": 800,
                    "top_p": 0.9
                }
            )

            for chunk in stream:
                if "message" in chunk:
                    yield chunk["message"]["content"]

        else:
            stream = self.client.chat.completions.create(
                model=self.actual_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=self.temperature,
                max_tokens=800,
                stream=True
            )

            for chunk in stream:
                if not chunk.choices:
                    continue
                
                delta = chunk.choices[0].delta
                
                if hasattr(delta, "content") and delta.content:
                    yield delta.content
            
            # AFTER loop ends
            yield ""  # ensures stream closes cleanly