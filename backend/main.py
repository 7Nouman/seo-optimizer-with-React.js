from fastapi import FastAPI, HTTPException, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any, List
import requests
from bs4 import BeautifulSoup
import httpx
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Allow CORS for your Vercel frontend (replace with your actual Vercel URL if it changes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://seo-optimizer-with-react-jy5u75h9s-7noumans-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    url: HttpUrl

class AnalyzeResult(BaseModel):
    url: HttpUrl
    meta: Dict[str, Any]
    headings: Dict[str, Any]
    images: Dict[str, Any]
    performance: Optional[Dict[str, Any]] = None
    nlp: Optional[Dict[str, Any]] = None
    gemini_recommendations: Optional[str] = None

GOOGLE_PSI_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")  # Set in .env or Render dashboard

@app.post("/analyze", response_model=AnalyzeResult)
async def analyze(request: AnalyzeRequest):
    url = str(request.url)
    # 1. Fetch and parse HTML
    meta, headings, images = {}, {}, {}
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        # Meta tags
        meta = {tag.get('name', tag.get('property', '')): tag.get('content', '') for tag in soup.find_all('meta') if tag.get('content')}
        # Headings
        headings = {f"h{i}": [h.get_text(strip=True) for h in soup.find_all(f"h{i}")] for i in range(1, 7)}
        # Images
        images = {
            "count": len(soup.find_all('img')),
            "missing_alt": [img.get('src') for img in soup.find_all('img') if not img.get('alt')]
        }
    except Exception as e:
        logger.error(f"HTML fetch/parse error: {e}")
        meta = {"error": f"Failed to fetch or parse URL: {e}"}
        headings = {}
        images = {}

    # 2. Google PageSpeed Insights
    performance = None
    gemini_recommendations = None
    if GOOGLE_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(GOOGLE_PSI_API, params={"url": url, "key": GOOGLE_API_KEY, "category": "PERFORMANCE,SEO"})
                if r.status_code == 200:
                    performance = r.json()
                else:
                    performance = {"error": f"Google PSI returned {r.status_code}"}
        except httpx.ReadTimeout:
            logger.error("Google PageSpeed Insights API timed out")
            performance = {"error": "Google PageSpeed Insights API timed out"}
        except Exception as e:
            logger.error(f"Google PSI error: {e}")
            performance = {"error": str(e)}
    # 3. Gemini SEO Recommendations
    if performance:
        import json
        prompt = f"""
You are an expert SEO assistant. Given the following Google PageSpeed Insights API JSON result for a website, analyze the data and provide actionable recommendations to improve the website's SEO and Google ranking.

- Focus on issues related to performance, SEO, accessibility, and best practices.
- For each issue, explain why it matters and how to fix it.
- Prioritize the most impactful changes.

Google PageSpeed Insights API Result:
{json.dumps(performance, indent=2)}

Return your recommendations as a numbered list.
"""
        try:
            model = genai.GenerativeModel("gemini-pro")
            gemini_response = model.generate_content(prompt)
            gemini_recommendations = gemini_response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            gemini_recommendations = f"Gemini API error: {e}"

    # 4. NLP (removed, always None)
    nlp_result = None

    return AnalyzeResult(
        url=url,
        meta=meta,
        headings=headings,
        images=images,
        performance=performance,
        nlp=nlp_result,
        gemini_recommendations=gemini_recommendations
    )

# --- Gemini AI SEO Assistant Integration ---

class AISEORequest(BaseModel):
    content: str
    keyword: str

class AISEOResponse(BaseModel):
    analysis: str
    improved_content: str
    meta_title: str
    meta_description: str
    keyword_suggestions: List[dict]

import google.generativeai as genai

GEMINI_API_KEY = "AIzaSyDJ6GV3k4FMiy1EKYEgF7qghETzYgO-jnA"  # Provided by user

genai.configure(api_key=GEMINI_API_KEY)

@app.post("/ai-seo-analyze", response_model=AISEOResponse)
async def ai_seo_analyze(request: AISEORequest = Body(...)):
    prompt = f"""
You are an expert SEO assistant helping improve website pages for better Google rankings.

Given the following webpage content and target keyword, perform the following tasks:

1. SEO Content Analysis: Score the content out of 10 based on SEO best practices. Comment on keyword usage, readability, structure, internal linking, and engagement.

2. Content Improvement: Rewrite or improve the content to better optimize it for SEO. Keep it under 300 words, include the target keyword naturally, and enhance clarity, structure, and user engagement.

3. Meta Tags:
   - Generate an SEO-optimized meta title (max 60 characters).
   - Generate an SEO-optimized meta description (max 160 characters).

4. Keyword Suggestions:
   - Suggest 10 long-tail keywords related to the target keyword.
   - For each keyword, mention its purpose (e.g., intent type: informational, transactional, etc.).

Webpage Content:
{request.content}

Target Keyword:
{request.keyword}

Return the result as JSON with the following keys: analysis, improved_content, meta_title, meta_description, keyword_suggestions (as a list of objects with 'keyword' and 'intent').
"""
    try:
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(prompt)
        import json
        # Try to parse the response as JSON
        try:
            result = json.loads(response.text)
        except Exception:
            # Fallback: try to extract JSON from the response text
            import re
            match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if match:
                result = json.loads(match.group(0))
            else:
                raise ValueError("Could not parse Gemini response as JSON")
        return AISEOResponse(
            analysis=result.get("analysis", ""),
            improved_content=result.get("improved_content", ""),
            meta_title=result.get("meta_title", ""),
            meta_description=result.get("meta_description", ""),
            keyword_suggestions=result.get("keyword_suggestions", [])
        )
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzeWithGeminiRequest(BaseModel):
    url: HttpUrl

class AnalyzeWithGeminiResult(BaseModel):
    url: HttpUrl
    performance: Optional[Dict[str, Any]] = None
    gemini_recommendations: Optional[str] = None

@app.post("/analyze-with-gemini", response_model=AnalyzeWithGeminiResult)
async def analyze_with_gemini(request: AnalyzeWithGeminiRequest):
    url = str(request.url)
    performance = None
    gemini_recommendations = None
    # 1. Google PageSpeed Insights
    if GOOGLE_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(GOOGLE_PSI_API, params={"url": url, "key": GOOGLE_API_KEY, "category": "PERFORMANCE,SEO"})
                if r.status_code == 200:
                    performance = r.json()
                else:
                    performance = {"error": f"Google PSI returned {r.status_code}"}
        except httpx.ReadTimeout:
            logger.error("Google PageSpeed Insights API timed out")
            performance = {"error": "Google PageSpeed Insights API timed out"}
        except Exception as e:
            logger.error(f"Google PSI error: {e}")
            performance = {"error": str(e)}
    # 2. Gemini SEO Recommendations
    if performance:
        import json
        prompt = f"""
You are an expert SEO assistant. Given the following Google PageSpeed Insights API JSON result for a website, analyze the data and provide actionable recommendations to improve the website's SEO and Google ranking.

- Focus on issues related to performance, SEO, accessibility, and best practices.
- For each issue, explain why it matters and how to fix it.
- Prioritize the most impactful changes.

Google PageSpeed Insights API Result:
{json.dumps(performance, indent=2)}

Return your recommendations as a numbered list.
"""
        try:
            model = genai.GenerativeModel("gemini-pro")
            gemini_response = model.generate_content(prompt)
            gemini_recommendations = gemini_response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            gemini_recommendations = f"Gemini API error: {e}"
    return AnalyzeWithGeminiResult(
        url=url,
        performance=performance,
        gemini_recommendations=gemini_recommendations
    )

@app.get("/")
def root():
    return {"message": "SEO Optimizer FastAPI backend is running!"} 