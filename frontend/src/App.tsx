import { useState } from "react";
import axios from "axios";
import "./App.css";

// Confetti Component
const Confetti = () => {
  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];
  const confettiPieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 6,
  }));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.size,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
};

// Air-Demo 백엔드 API (MovieSir API를 커스텀해서 사용)
const API_URL = "/api/recommend";

// 오늘 날짜
const TODAY = new Date();
const TODAY_STR = `${String(TODAY.getMonth() + 1).padStart(2, "0")}.${String(TODAY.getDate()).padStart(2, "0")}`;

// Hardcoded flight data (해외 노선만)
const FLIGHTS = [
  {
    id: 1,
    airline: "Air Demo",
    flightNo: "AD101",
    departure: "서울",
    departureCode: "ICN",
    arrival: "도쿄",
    arrivalCode: "NRT",
    departTime: "08:00",
    arriveTime: "10:30",
    duration: 150,
    price: 189000,
    nextDay: false,
  },
  {
    id: 2,
    airline: "Air Demo",
    flightNo: "AD203",
    departure: "서울",
    departureCode: "ICN",
    arrival: "오사카",
    arrivalCode: "KIX",
    departTime: "09:30",
    arriveTime: "11:40",
    duration: 130,
    price: 175000,
    nextDay: false,
  },
  {
    id: 3,
    airline: "Air Demo",
    flightNo: "AD305",
    departure: "서울",
    departureCode: "ICN",
    arrival: "타이베이",
    arrivalCode: "TPE",
    departTime: "11:00",
    arriveTime: "13:30",
    duration: 150,
    price: 165000,
    nextDay: false,
  },
  {
    id: 4,
    airline: "Air Demo",
    flightNo: "AD407",
    departure: "서울",
    departureCode: "ICN",
    arrival: "방콕",
    arrivalCode: "BKK",
    departTime: "14:00",
    arriveTime: "18:00",
    duration: 360,
    price: 320000,
    nextDay: false,
  },
  {
    id: 5,
    airline: "Air Demo",
    flightNo: "AD509",
    departure: "서울",
    departureCode: "ICN",
    arrival: "싱가포르",
    arrivalCode: "SIN",
    departTime: "22:00",
    arriveTime: "04:30",
    duration: 390,
    price: 380000,
    nextDay: true,
  },
  {
    id: 6,
    airline: "Air Demo",
    flightNo: "AD611",
    departure: "서울",
    departureCode: "ICN",
    arrival: "로스앤젤레스",
    arrivalCode: "LAX",
    departTime: "10:00",
    arriveTime: "06:00",
    duration: 720,
    price: 890000,
    nextDay: true,
  },
];

interface Movie {
  movie_id: number;
  title: string;
  poster_path: string | null;
  runtime: number;
  genres: string[];
  vote_average: number;
}

interface Flight {
  id: number;
  airline: string;
  flightNo: string;
  departure: string;
  departureCode: string;
  arrival: string;
  arrivalCode: string;
  departTime: string;
  arriveTime: string;
  duration: number;
  price: number;
  nextDay: boolean;
}

function App() {
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [bookedFlight, setBookedFlight] = useState<Flight | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalRuntime, setTotalRuntime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState<
    "select" | "booking" | "complete"
  >("select");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "tickets" | "mypage">(
    "home",
  );
  const [showConfetti, setShowConfetti] = useState(false);

  const fetchMovieRecommendations = async (flightDuration: number) => {
    setLoading(true);
    setError(null);

    try {
      // API 호출과 최소 로딩 시간을 병렬로 실행
      const [response] = await Promise.all([
        axios.post(API_URL, { flight_duration: flightDuration }),
        new Promise((resolve) => setTimeout(resolve, 1000)), // 최소 1초 로딩
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

  const handleFlightSelect = (flight: Flight) => {
    setSelectedFlight(flight);
    setBookingStep("select");
  };

  const handleBooking = async () => {
    if (!selectedFlight) return;

    setBookingStep("booking");
    setBookedFlight(selectedFlight);

    // 잠시 대기 후 complete 화면으로 전환 (로딩 애니메이션 보이도록)
    await new Promise((resolve) => setTimeout(resolve, 800));
    setBookingStep("complete");

    // Confetti 효과 표시
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    // complete 화면에서 영화 추천 로딩 (비행기 애니메이션 표시)
    await fetchMovieRecommendations(selectedFlight.duration);
  };

  const resetBooking = () => {
    setSelectedFlight(null);
    setBookedFlight(null);
    setMovies([]);
    setTotalRuntime(0);
    setBookingStep("select");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}분`;
    if (mins === 0) return `${hours}시간`;
    return `${hours}시간 ${mins}분`;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* App Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-blue-500/25">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Air Demo</h1>
            <p className="text-xs text-gray-500">해외 항공권 예매</p>
          </div>
        </div>
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {activeTab === "home" && (
          <div className="p-4">
            {bookingStep === "complete" && bookedFlight ? (
              <>
                {/* Confetti Effect */}
                {showConfetti && <Confetti />}

                {/* Booking Complete Card */}
                <div className="relative p-5 mb-4 overflow-hidden text-white shadow-lg bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      {/* Pulse Ring */}
                      <div className="absolute inset-0 w-12 h-12 rounded-full bg-white/30 animate-pulse-ring" />
                      <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white/20 animate-check">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-white/80">예매 완료</p>
                      <p className="text-xl font-bold">
                        {bookedFlight.flightNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {bookedFlight.departureCode}
                      </p>
                      <p className="text-sm text-white/70">
                        {bookedFlight.departure}
                      </p>
                      <p className="mt-1 font-medium text-white/90">
                        {bookedFlight.departTime}
                      </p>
                    </div>
                    <div className="flex flex-col items-center flex-1 px-4">
                      <div className="relative flex items-center w-full h-6">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-white/50" />
                        <div className="flex-1 h-[2px] bg-white/30 mx-2 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer-line" />
                        </div>
                        <div className="absolute left-0 right-0 flex justify-center animate-plane-fly">
                          <svg
                            className="w-5 h-5 text-white rotate-90"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                          </svg>
                        </div>
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-white/50" />
                      </div>
                      <p className="mt-1 text-xs text-white/80">
                        {formatDuration(bookedFlight.duration)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {bookedFlight.arrivalCode}
                      </p>
                      <p className="text-sm text-white/70">
                        {bookedFlight.arrival}
                      </p>
                      <p className="mt-1 font-medium text-white/90">
                        {bookedFlight.arriveTime}
                        {bookedFlight.nextDay && (
                          <span className="ml-1 text-xs text-yellow-300">
                            +1
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Movie Recommendations */}
                <div className="mb-4 overflow-hidden bg-white shadow-sm rounded-2xl">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          여행에서 즐길 추천 영화
                        </h3>
                        <p className="text-xs text-gray-500">
                          {movies.length > 0
                            ? `총 ${formatDuration(totalRuntime)} 분량 (비행시간 ${formatDuration(bookedFlight.duration)})`
                            : `비행시간 ${formatDuration(bookedFlight.duration)} 내 감상 가능`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
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
                            className="relative group movie-card w-[calc(33.333%-8px)] aspect-[2/3] rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition"
                          >
                            {movie.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                                alt={movie.title}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-400">
                                <svg
                                  className="w-10 h-10"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                                </svg>
                              </div>
                            )}
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            {/* Title & Runtime */}
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="text-xs font-bold text-white leading-tight line-clamp-2">
                                {movie.title}
                              </p>
                              <p className="text-[10px] text-white/70 mt-0.5">
                                {movie.runtime}분
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

                {/* Reset Button */}
                <button
                  onClick={resetBooking}
                  className="w-full py-4 bg-white text-gray-700 rounded-2xl font-semibold shadow-sm active:scale-[0.98] transition"
                >
                  다른 항공편 검색
                </button>
              </>
            ) : (
              <>
                {/* Search Header */}
                <div className="flex items-center justify-between px-4 py-3 mb-4 bg-white shadow-sm rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">ICN</span>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                    <span className="font-bold text-gray-900">해외</span>
                  </div>
                  <div className="w-px h-4 bg-gray-200" />
                  <span className="text-sm text-gray-600">{TODAY_STR}</span>
                  <div className="w-px h-4 bg-gray-200" />
                  <span className="text-sm text-gray-600">1명</span>
                </div>

                {/* Flight List */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-900">
                      항공편 {FLIGHTS.length}건
                    </h2>
                    <button className="text-sm font-medium text-blue-500">
                      필터
                    </button>
                  </div>
                  <div className="space-y-3">
                    {FLIGHTS.map((flight) => (
                      <div
                        key={flight.id}
                        onClick={() => handleFlightSelect(flight)}
                        className={`flight-card bg-white rounded-2xl p-4 shadow-sm cursor-pointer ${
                          selectedFlight?.id === flight.id
                            ? "ring-2 ring-blue-500 bg-blue-50/50"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                              </svg>
                            </div>
                            <span className="font-semibold text-gray-800">
                              {flight.flightNo}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              직항
                            </span>
                          </div>
                          <p className="text-lg font-bold text-blue-600">
                            {formatPrice(flight.price)}원
                          </p>
                        </div>

                        <div className="flex items-center">
                          <div className="flex-1">
                            <p className="text-2xl font-bold text-gray-900">
                              {flight.departTime}
                            </p>
                            <p className="text-sm text-gray-500">
                              {flight.departureCode}
                            </p>
                          </div>
                          <div className="flex flex-col items-center flex-1">
                            <p className="mb-1 text-xs text-gray-400">
                              {formatDuration(flight.duration)}
                            </p>
                            <div className="relative flex items-center w-full">
                              <div className="flex-shrink-0 w-2 h-2 bg-gray-300 rounded-full" />
                              <div className="flex-1 mx-1 border-t-2 border-gray-300 border-dashed" />
                              <div className="flex-shrink-0 w-2 h-2 bg-gray-300 rounded-full" />
                              <svg
                                className="w-4 h-4 text-blue-500 animate-flight-move"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              {flight.arriveTime}
                              {flight.nextDay && (
                                <span className="ml-1 text-sm text-orange-500">
                                  +1
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {flight.arrivalCode}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "tickets" && (
          <div className="p-4">
            <div className="py-20 text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full">
                <svg
                  className="w-10 h-10 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <p className="font-medium text-gray-500">예매 내역이 없습니다</p>
              <p className="mt-1 text-sm text-gray-400">
                홈에서 항공편을 예매해보세요
              </p>
            </div>
          </div>
        )}

        {activeTab === "mypage" && (
          <div className="p-4">
            <div className="p-6 mb-4 bg-white shadow-sm rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold text-white rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                  문
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">문수현</p>
                  <p className="text-sm text-gray-500">Air Demo 회원</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden bg-white shadow-sm rounded-2xl">
              <button className="flex items-center justify-between w-full px-4 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-800">고객센터</span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <button className="flex items-center justify-between w-full px-4 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-800">이용약관</span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <button className="flex items-center justify-between w-full px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-800">앱 정보</span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-6 py-2 bg-white border-t border-gray-200 safe-area-bottom">
        <button
          onClick={() => {
            setActiveTab("home");
            resetBooking();
          }}
          className={`flex flex-col items-center py-2 px-4 ${activeTab === "home" ? "text-blue-500" : "text-gray-400"}`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10"
            />
          </svg>
          <span className="mt-1 text-xs font-medium">홈</span>
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`flex flex-col items-center py-2 px-4 ${activeTab === "tickets" ? "text-blue-500" : "text-gray-400"}`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
          <span className="mt-1 text-xs font-medium">예매내역</span>
        </button>
        <button
          onClick={() => setActiveTab("mypage")}
          className={`flex flex-col items-center py-2 px-4 ${activeTab === "mypage" ? "text-blue-500" : "text-gray-400"}`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="mt-1 text-xs font-medium">마이</span>
        </button>
      </nav>

      {/* Floating Book Button */}
      {activeTab === "home" && selectedFlight && bookingStep !== "complete" && (
        <div className="fixed left-0 right-0 p-4 bottom-20 bg-gradient-to-t from-white via-white to-transparent">
          <button
            onClick={handleBooking}
            disabled={bookingStep === "booking"}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg disabled:bg-gray-400 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition"
          >
            {bookingStep === "booking" ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                예매 처리 중...
              </span>
            ) : (
              `${formatPrice(selectedFlight.price)}원 예매하기`
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
