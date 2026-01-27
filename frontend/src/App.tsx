import { useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

// Air-Demo 백엔드 API (MovieSir API를 커스텀해서 사용)
const API_URL = "/api/recommend";

// 현재 날짜를 YYYY.MM.DD 형식으로 반환
const getTodayDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
};

// 탑승권 정보 (하드코딩)
const BOARDING_PASS = {
  airline: "Air Demo",
  flightNo: "7C2955",
  departure: "부산",
  departureCode: "PUS",
  arrival: "다낭",
  arrivalCode: "DAD",
  date: "2024.06.09",
  departTime: "09:30",
  boardingTime: "09:00",
  gate: "미정",
  seat: "23A",
  duration: 300, // 5시간
  passenger: "문수현",
};

interface Movie {
  movie_id: number;
  title: string;
  poster_path: string | null;
  runtime: number;
  genres: string[];
  vote_average: number;
}

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalRuntime, setTotalRuntime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMovies, setShowMovies] = useState(false);
  const [showGenreSelect, setShowGenreSelect] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showBubble, setShowBubble] = useState(true);

  const GENRES = [
    "드라마", "코미디", "스릴러", "로맨스",
    "액션", "다큐멘터리", "공포", "범죄",
    "모험", "가족", "SF", "미스터리",
    "TV 영화", "애니메이션", "판타지", "음악",
  ];

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const fetchMovieRecommendations = async () => {
    setLoading(true);
    setError(null);
    setShowMovies(true);
    setShowGenreSelect(false);

    try {
      const [response] = await Promise.all([
        axios.post(API_URL, {
          flight_duration: BOARDING_PASS.duration,
          genres: selectedGenres.length > 0 ? selectedGenres : undefined,
        }),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      setMovies(response.data.movies || []);
      setTotalRuntime(response.data.total_runtime || 0);
    } catch (err: any) {
      console.error("API Error:", err);
      if (err.response?.status === 401) {
        setError("API Key가 유효하지 않습니다");
      } else if (err.response?.status === 429) {
        setError("API 호출 한도를 초과했습니다");
      } else {
        setError("영화 추천을 불러오는데 실패했습니다");
      }
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}분`;
    if (mins === 0) return `${hours}시간`;
    return `${hours}시간 ${mins}분`;
  };

  const durationHours = Math.floor(BOARDING_PASS.duration / 60);

  return (
    <div className="h-screen bg-[#f0f2f5] flex flex-col overflow-hidden" onClick={() => setShowBubble(false)}>
      {/* Status Bar Area */}
      <div className="h-2 bg-[#f0f2f5]" />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-1 bg-[#f0f2f5]">
        <button
          className="flex items-center justify-center w-10 h-10"
          onClick={() => { if (showMovies) { setShowMovies(false); setShowGenreSelect(false); setSelectedGenres([]); } }}
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          탑승권 이미지 저장
        </h1>
        <button className="flex items-center justify-center w-10 h-10">
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-4 flex flex-col overflow-hidden relative">
        {/* Boarding Pass Card - 항상 표시 */}
        <div className="relative overflow-hidden shadow-lg boarding-pass rounded-2xl flex-1 flex flex-col">
          {/* ===== 상단: 항공사 헤더 (블루) ===== */}
          <div className={`bg-gradient-to-b from-blue-500 to-blue-600 px-6 pt-6 pb-5 z-10 transition-all duration-300 ${showMovies ? 'blur-sm opacity-40' : ''}`}>
            <p className="text-white font-bold text-2xl tracking-wide text-center">{BOARDING_PASS.airline}</p>
          </div>

          {/* ===== 본문: 흰색 영역 (모달이 여기만 덮음) ===== */}
          <div className="relative bg-white flex-1 flex flex-col justify-between py-5">
            {/* 노선 정보 */}
            <div className={`px-6 transition-all duration-300 ${showMovies ? 'blur-sm opacity-40' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="text-left w-20">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">From</p>
                  <p className="text-4xl font-extrabold text-blue-600 mt-1">{BOARDING_PASS.departureCode}</p>
                  <p className="text-base font-semibold text-gray-700 mt-1">{BOARDING_PASS.departure}</p>
                </div>
                <div className="flex-1 mx-3 flex flex-col items-center pt-3">
                  <p className="text-xs text-gray-500 mb-2">{formatDuration(BOARDING_PASS.duration)}</p>
                  <div className="relative w-full h-5">
                    <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-gray-300" />
                    <svg className="w-5 h-5 text-blue-500 rotate-90 absolute animate-fly-path" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                  </div>
                </div>
                <div className="text-right w-20">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">To</p>
                  <p className="text-4xl font-extrabold text-blue-600 mt-1">{BOARDING_PASS.arrivalCode}</p>
                  <p className="text-base font-semibold text-gray-700 mt-1">{BOARDING_PASS.arrival}</p>
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <div className="text-left w-20">
                  <p className="text-sm text-gray-400">{getTodayDate()}</p>
                  <p className="text-sm font-semibold text-gray-700">{BOARDING_PASS.departTime}</p>
                </div>
                <div className="text-right w-20">
                  <p className="text-sm text-gray-400">{getTodayDate()}</p>
                  <p className="text-sm font-semibold text-gray-700">{BOARDING_PASS.boardingTime}</p>
                </div>
              </div>
            </div>

            {/* 탑승자 / 좌석 바 */}
            <div className={`mx-6 bg-blue-600 rounded-xl px-5 py-3.5 flex items-center justify-between transition-all duration-300 ${showMovies ? 'blur-sm opacity-40' : ''}`}>
              <div className="flex-1">
                <p className="text-xs text-blue-200 uppercase tracking-wide">Passenger</p>
                <p className="text-lg font-bold text-white mt-0.5">{BOARDING_PASS.passenger}</p>
              </div>
              <div className="border-l border-blue-400/40 pl-5">
                <p className="text-xs text-blue-200 uppercase tracking-wide">Class</p>
                <p className="text-lg font-bold text-white mt-0.5">{BOARDING_PASS.seat}</p>
              </div>
            </div>

            {/* 상세 정보 3열 x 2행 */}
            <div className={`px-6 transition-all duration-300 ${showMovies ? 'blur-sm opacity-40' : ''}`}>
              <div className="grid grid-cols-3 gap-y-4 gap-x-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Flight</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{BOARDING_PASS.flightNo}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Gate</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{BOARDING_PASS.gate}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Seat</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{BOARDING_PASS.seat}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{getTodayDate()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Boarding</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{BOARDING_PASS.boardingTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Depart</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{BOARDING_PASS.departTime}</p>
                </div>
              </div>
            </div>

            {/* Tear Line */}
            <div className={`relative flex items-center transition-all duration-300 ${showMovies ? 'blur-sm opacity-40' : ''}`}>
              <div className="absolute -left-3 w-6 h-6 rounded-full bg-[#f0f2f5]" />
              <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-5" />
              <div className="absolute -right-3 w-6 h-6 rounded-full bg-[#f0f2f5]" />
            </div>

            {/* QR Code */}
            <div className={`flex flex-col items-center justify-center px-6 transition-all duration-300 ${showMovies ? 'blur-sm opacity-40' : ''}`}>
              <QRCodeSVG
                value={`BOARDING:${BOARDING_PASS.flightNo}/${BOARDING_PASS.passenger}/${BOARDING_PASS.date}/${BOARDING_PASS.seat}`}
                size={140}
                level="M"
                bgColor="#ffffff"
                fgColor="#111827"
              />
              <p className="text-xs text-gray-300 mt-2.5 tracking-wider">{BOARDING_PASS.flightNo} · {BOARDING_PASS.seat}</p>
            </div>
            {/* Movie Modal - 본문 영역만 덮는 오버레이 */}
            {showMovies && (
              <div className="absolute inset-0 z-20 flex items-center justify-center animate-fade-in">
              <div className="w-[calc(100%-24px)] h-[calc(100%-24px)] flex flex-col bg-blue-50 rounded-2xl shadow-2xl">
                {/* X 닫기 버튼 */}
                <button
                  onClick={() => { setShowMovies(false); setShowGenreSelect(false); setSelectedGenres([]); }}
                  className="absolute top-5 right-5 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* 모달 콘텐츠 - 영화 추천만 */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4">
                  {loading ? (
                    <div className="flex flex-col items-center py-12">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        맞춤 영화 추천 중...
                      </p>
                    </div>
                  ) : error ? (
                    <div className="py-12 text-center">
                      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-red-100 rounded-full">
                        <svg
                          className="w-8 h-8 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                      <p className="font-medium text-gray-600">{error}</p>
                    </div>
                  ) : movies.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-3">
                      {movies.map((movie) => (
                        <div
                          key={movie.movie_id}
                          className="relative group movie-card w-[calc(33.333%-8px)] aspect-[2/3] rounded-xl overflow-hidden shadow-sm"
                        >
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                              alt={movie.title}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-400 bg-gray-200">
                              <svg
                                className="w-10 h-10"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <p className="text-xs font-bold leading-tight text-white line-clamp-2">
                              {movie.title}
                            </p>
                            <p className="text-[10px] text-white/70 mt-0.5">
                              {formatDuration(movie.runtime)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 rounded-full bg-amber-100">
                        <svg
                          className="w-8 h-8 text-amber-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="font-medium text-gray-600">
                        추천할 영화가 없습니다
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        비행시간이 너무 짧습니다
                      </p>
                    </div>
                  )}
                </div>
              </div>
              </div>
            )}
          </div>

          {/* ===== 하단: 항공사 푸터 (블루) ===== */}
          <div className={`bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3.5 text-center z-10 transition-all duration-300 ${showMovies ? 'blur-sm opacity-40' : ''}`}>
            <p className="text-white text-base font-bold tracking-wider">{BOARDING_PASS.airline}</p>
          </div>
        </div>
      </main>

      {/* 챗봇 + 말풍선 (화면 하단 오른쪽 고정, 컨텐츠 위에 떠있음) */}
      <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
        <div className="flex items-end gap-3">
          {/* 말풍선 (FloatingBubble 원본 스타일) */}
          {showBubble && (
          <div className="animate-float">
            <div
              className="
                relative bg-white shadow-xl
                rounded-3xl rounded-br-none
                py-4 px-5
                text-sm text-gray-900
                border border-gray-100
                transform transition-all duration-500
                hover:scale-105 hover:shadow-2xl
                cursor-pointer
              "
              onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}
            >
              {showMovies && !showGenreSelect ? (
                <>
                  <p className="leading-relaxed">
                    추천 받은 영화는 어떠신가요?
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGenreSelect(true);
                      setSelectedGenres([]);
                    }}
                    className="mt-3 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all"
                  >
                    다시 추천 받기
                  </button>
                </>
              ) : !showMovies && !showGenreSelect ? (
                <>
                  <p className="leading-relaxed">
                    <span className="mr-1">✈️</span>
                    <strong>{durationHours}시간</strong> 비행이네요!
                    <br />
                    기내에서 볼 영화는 준비하셨나요?
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowGenreSelect(true); }}
                    className="mt-3 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all"
                  >
                    무비서 추천 받기
                  </button>
                </>
              ) : (
                <>
                  <p className="leading-relaxed mb-3">
                    어떤 장르를 좋아하세요?
                    <br />
                    <span className="text-xs text-gray-400">선택 안하면 전체 장르로 추천해요</span>
                  </p>

                  {/* 장르 선택 그리드 */}
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                    {GENRES.map((genre) => (
                      <button
                        key={genre}
                        onClick={(e) => { e.stopPropagation(); toggleGenre(genre); }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                          selectedGenres.includes(genre)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>

                  {/* 추천 받기 버튼 */}
                  <button
                    onClick={(e) => { e.stopPropagation(); fetchMovieRecommendations(); }}
                    className="mt-3 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all"
                  >
                    {selectedGenres.length > 0
                      ? `${selectedGenres.length}개 장르로 추천 받기`
                      : "전체 장르로 추천 받기"}
                  </button>
                </>
              )}
            </div>
          </div>
          )}

          {/* 무비서 챗봇 아바타 (원본 ChatbotButton: w-28 h-28 + Glow + float) */}
          <div className="animate-float">
            <div
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 shadow-xl flex items-center justify-center flex-shrink-0 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setShowBubble(!showBubble); }}
            >
              {/* Glow 이펙트 */}
              <div
                className="pointer-events-none absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse scale-125 bg-blue-500"
                aria-hidden="true"
              />
              {/* 얼굴 (축소 비율 적용) */}
              <div className="flex flex-col items-center gap-1.5 select-none">
                <div className="flex gap-3">
                  <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />
                </div>
                <div className="flex gap-6">
                  <div className="w-4 h-1 bg-pink-400/80 rounded-full" />
                  <div className="w-4 h-1 bg-pink-400/80 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
