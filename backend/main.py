from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any
import requests
from bs4 import BeautifulSoup
import httpx
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

    # 3. NLP (removed, always None)
    nlp_result = None

    return AnalyzeResult(
        url=url,
        meta=meta,
        headings=headings,
        images=images,
        performance=performance,
        nlp=nlp_result
    )

@app.get("/")
def root():
    return {"message": "SEO Optimizer FastAPI backend is running!"} 