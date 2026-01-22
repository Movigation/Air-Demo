# Air-Demo ✈️

> MovieSir B2B API 시연용 항공사 앱

## 소개

Air-Demo는 **MovieSir B2B API**의 크로스 클라우드 호환성을 검증하기 위한 데모 애플리케이션입니다.

**Google Cloud Platform**(Cloud Run)에 배포된 Air-Demo가 **KakaoCloud VPC**에서 운영되는 <br />MovieSir API를 호출하여,서로 다른 클라우드 환경 간의 원활한 API 통신이 가능함을 증명합니다.

비행 시간을 입력하면 MovieSir의 AI 추천 엔진이 최적의 영화 조합을 제안하고, <br />Air-Demo 백엔드가 항공사 비즈니스 로직에 맞게 응답을 가공하여 제공합니다.

> 본 애플리케이션의 UI/UX 디자인 및 프론트엔드/백엔드 구현은 **Movigation 팀**이 직접 설계하고 개발하였습니다.

## MovieSir B2B API 커스텀 로직

Air-Demo 백엔드는 MovieSir B2B API를 호출한 후 **자체 비즈니스 로직**으로 응답을 가공합니다.

### 1. API 호출

```python
response = await client.post(
    MOVIESIR_API_URL,
    json={
        "user_movie_ids": [],      # 항공사는 사용자 선호 영화를 모름
        "available_time": flight_duration,
    },
    headers={"X-API-Key": MOVIESIR_API_KEY},
)
```

### 2. 커스텀 필터링

MovieSir API는 **Track A** (장르 맞춤)와 **Track B** (다양성 추천) 두 트랙을 반환합니다.<br />
Air-Demo는 두 트랙을 합친 후, **비행시간 내에 시청 가능한 영화만 필터링**합니다.

```python
# 두 트랙 병합
all_movies = track_a + track_b

# Greedy 알고리즘: 비행시간 내 영화 조합
for movie in all_movies:
    if total_runtime + movie.runtime <= flight_duration:
        filtered_movies.append(movie)
        total_runtime += movie.runtime
```

### 3. 응답 메시지 생성

| 조건      | 메시지                                        |
| --------- | --------------------------------------------- |
| 영화 없음 | "비행시간이 너무 짧아 추천할 영화가 없습니다" |
| 70% 미만  | "총 {N}분 분량의 영화를 추천합니다"           |
| 70% 이상  | "비행시간에 딱 맞는 {N}분 분량의 영화입니다"  |

## 배포

- **Frontend**: Google Cloud Platform - Cloud Run
- **Backend**: Google Cloud Platform - Cloud Run
- **MovieSir API**: KakaoCloud VPC

## 로컬 실행

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## 환경 변수

```bash
# Backend (.env)
MOVIESIR_API_URL=https://api.moviesir.cloud/v1/recommend
MOVIESIR_API_KEY=sk-moviesir-xxxxx
```
