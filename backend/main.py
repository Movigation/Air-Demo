# Air-Demo Backend
# MovieSir B2B API를 커스텀해서 사용하는 예시

import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(
    title="Air-Demo API",
    description="항공사 기내 영화 추천 서비스 (Powered by MovieSir)",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MovieSir API 설정
MOVIESIR_API_URL = os.getenv("MOVIESIR_API_URL", "https://api.moviesir.cloud/v1/recommend")
MOVIESIR_API_KEY = os.getenv("MOVIESIR_API_KEY", "")


class Movie(BaseModel):
    movie_id: int
    title: str
    poster_path: Optional[str]
    runtime: int
    genres: List[str]
    vote_average: float


class RecommendRequest(BaseModel):
    flight_duration: int  # 비행시간 (분)


class RecommendResponse(BaseModel):
    movies: List[Movie]
    total_runtime: int
    flight_duration: int
    message: str


@app.get("/")
def health():
    return {"status": "ok", "service": "Air-Demo API"}


@app.post("/api/recommend", response_model=RecommendResponse)
async def recommend_movies(request: RecommendRequest):
    """
    비행시간에 맞는 영화 추천

    MovieSir API를 호출하고, Air-Demo의 비즈니스 로직으로 커스텀:
    - 총 러닝타임이 비행시간 이내가 되도록 필터링
    """

    if not MOVIESIR_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="API Key가 설정되지 않았습니다"
        )

    flight_duration = request.flight_duration

    # 1. MovieSir API 호출
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                MOVIESIR_API_URL,
                json={
                    "user_movie_ids": [],  # 항공사는 사용자 선호 영화를 모름 → 빈 리스트
                    "available_time": flight_duration,
                },
                headers={
                    "Content-Type": "application/json",
                    "X-API-Key": MOVIESIR_API_KEY,
                },
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise HTTPException(status_code=401, detail="MovieSir API Key가 유효하지 않습니다")
            elif e.response.status_code == 429:
                raise HTTPException(status_code=429, detail="API 호출 한도 초과")
            else:
                raise HTTPException(status_code=502, detail="MovieSir API 오류")
        except httpx.RequestError:
            raise HTTPException(status_code=502, detail="MovieSir API 연결 실패")

    # 2. API 응답에서 영화 추출
    if not data.get("success"):
        raise HTTPException(status_code=502, detail="MovieSir API 응답 오류")

    track_a = data.get("data", {}).get("track_a", {}).get("movies", [])
    track_b = data.get("data", {}).get("track_b", {}).get("movies", [])
    all_movies = track_a + track_b

    # 3. Air-Demo 커스텀 로직: 비행시간 내에 맞는 영화 조합 선택
    filtered_movies = []
    total_runtime = 0

    for movie in all_movies:
        movie_runtime = movie.get("runtime", 0)
        # 비행시간 이내에 맞는 영화만 추가
        if total_runtime + movie_runtime <= flight_duration:
            filtered_movies.append(Movie(
                movie_id=movie.get("movie_id"),
                title=movie.get("title"),
                poster_path=movie.get("poster_path"),
                runtime=movie_runtime,
                genres=movie.get("genres", []),
                vote_average=movie.get("vote_average", 0),
            ))
            total_runtime += movie_runtime

    # 4. 응답 생성
    if not filtered_movies:
        message = "비행시간이 너무 짧아 추천할 영화가 없습니다"
    elif total_runtime < flight_duration * 0.7:
        message = f"총 {total_runtime}분 분량의 영화를 추천합니다"
    else:
        message = f"비행시간에 딱 맞는 {total_runtime}분 분량의 영화입니다"

    return RecommendResponse(
        movies=filtered_movies,
        total_runtime=total_runtime,
        flight_duration=flight_duration,
        message=message,
    )
