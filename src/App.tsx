import { useState } from 'react'
import axios from 'axios'
import './App.css'

// MovieSir API configuration
const MOVIESIR_API_URL = 'https://api.moviesir.cloud/v1/recommend'
const DEFAULT_MOVIE_IDS = [278, 238, 240, 424, 389]

// Hardcoded flight data
const FLIGHTS = [
  { id: 1, airline: 'Air Demo', flightNo: 'AD101', departure: '서울(GMP)', arrival: '제주(CJU)', departTime: '07:00', arriveTime: '08:10', duration: 70, price: 65000 },
  { id: 2, airline: 'Air Demo', flightNo: 'AD203', departure: '서울(GMP)', arrival: '제주(CJU)', departTime: '09:30', arriveTime: '10:40', duration: 70, price: 72000 },
  { id: 3, airline: 'Air Demo', flightNo: 'AD305', departure: '서울(GMP)', arrival: '제주(CJU)', departTime: '12:00', arriveTime: '13:10', duration: 70, price: 68000 },
  { id: 4, airline: 'Air Demo', flightNo: 'AD407', departure: '서울(ICN)', arrival: '오사카(KIX)', departTime: '08:00', arriveTime: '10:00', duration: 120, price: 189000 },
  { id: 5, airline: 'Air Demo', flightNo: 'AD509', departure: '서울(ICN)', arrival: '도쿄(NRT)', departTime: '10:30', arriveTime: '13:00', duration: 150, price: 225000 },
  { id: 6, airline: 'Air Demo', flightNo: 'AD611', departure: '서울(ICN)', arrival: '방콕(BKK)', departTime: '23:00', arriveTime: '03:00', duration: 360, price: 320000 },
]

interface Movie {
  movie_id: number
  title: string
  poster_path: string | null
  runtime: number
  genres: string[]
  vote_average: number
}

interface Flight {
  id: number
  airline: string
  flightNo: string
  departure: string
  arrival: string
  departTime: string
  arriveTime: string
  duration: number
  price: number
}

function App() {
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [bookedFlight, setBookedFlight] = useState<Flight | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('airdemo_apikey') || '')
  const [showSettings, setShowSettings] = useState(false)
  const [bookingStep, setBookingStep] = useState<'select' | 'booking' | 'complete'>('select')
  const [error, setError] = useState<string | null>(null)

  const saveApiKey = (key: string) => {
    setApiKey(key)
    localStorage.setItem('airdemo_apikey', key)
  }

  const fetchMovieRecommendations = async (availableTime: number) => {
    if (!apiKey) {
      alert('설정에서 API Key를 먼저 입력해주세요 (발표자용)')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await axios.post(
        MOVIESIR_API_URL,
        {
          user_movie_ids: DEFAULT_MOVIE_IDS,
          available_time: availableTime,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
        }
      )

      if (response.data.success) {
        // track_a와 track_b에서 영화 추출
        const trackA = response.data.data.track_a?.movies || []
        const trackB = response.data.data.track_b?.movies || []
        // 두 트랙의 영화를 합쳐서 최대 6개 표시
        const allMovies = [...trackA, ...trackB].slice(0, 6)
        setMovies(allMovies)
      }
    } catch (err: any) {
      console.error('API Error:', err)
      if (err.response?.status === 401) {
        setError('API Key가 유효하지 않습니다')
      } else if (err.response?.status === 429) {
        setError('API 호출 한도를 초과했습니다')
      } else {
        setError('영화 추천을 불러오는데 실패했습니다')
      }
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  const handleFlightSelect = (flight: Flight) => {
    setSelectedFlight(flight)
    setBookingStep('select')
  }

  const handleBooking = async () => {
    if (!selectedFlight) return

    setBookingStep('booking')
    setBookedFlight(selectedFlight)

    // 예매 처리 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000))

    // MovieSir API 호출 (B2B Console에서 로그 확인 가능)
    await fetchMovieRecommendations(selectedFlight.duration)

    setBookingStep('complete')
  }

  const resetBooking = () => {
    setSelectedFlight(null)
    setBookedFlight(null)
    setMovies([])
    setBookingStep('select')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}분`
    return `${hours}시간 ${mins}분`
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
            <span className="text-xl font-bold">Air Demo</span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4">
        {/* B2B Integration Badge */}
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-4 mb-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span className="font-bold">MovieSir API 연동 완료</span>
          </div>
          <p className="text-sm text-white/80">
            승객 예매 시 비행시간 기반 영화 추천 자동 제공
          </p>
        </div>

        {bookingStep === 'complete' && bookedFlight ? (
          <>
            {/* Booking Complete */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold">예매 완료!</span>
              </div>
              <div className="text-sm text-green-600">
                {bookedFlight.flightNo} | {bookedFlight.departure} → {bookedFlight.arrival}
              </div>
            </div>

            {/* Movie Recommendations */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">기내 추천 영화</h3>
                  <p className="text-xs text-gray-500">
                    비행시간 {formatDuration(bookedFlight.duration)} 내 감상 가능
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                  <p className="text-sm text-gray-500">영화 추천 중...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              ) : movies.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {movies.map((movie) => (
                    <div key={movie.movie_id} className="text-center">
                      <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden mb-2">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-medium text-gray-800 line-clamp-2">{movie.title}</div>
                      <div className="text-xs text-gray-500">{movie.runtime}분</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>영화 추천을 불러올 수 없습니다</p>
                </div>
              )}

              {/* Powered by MovieSir */}
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <span className="text-xs text-gray-400">Powered by </span>
                <a
                  href="https://console.moviesir.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary font-medium hover:underline"
                >
                  MovieSir API
                </a>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetBooking}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
            >
              다른 항공편 예매하기
            </button>
          </>
        ) : (
          <>
            {/* Flight List */}
            <div className="mb-4">
              <h2 className="text-lg font-bold mb-3 text-gray-800">항공편 선택</h2>
              <div className="space-y-3">
                {FLIGHTS.map((flight) => (
                  <div
                    key={flight.id}
                    onClick={() => handleFlightSelect(flight)}
                    className={`bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all ${
                      selectedFlight?.id === flight.id
                        ? 'ring-2 ring-primary bg-blue-50'
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{flight.airline}</div>
                          <div className="text-xs text-gray-500">{flight.flightNo}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{formatPrice(flight.price)}원</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-center">
                        <div className="text-xl font-bold">{flight.departTime}</div>
                        <div className="text-gray-500">{flight.departure}</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-4">
                        <div className="text-xs text-gray-400">{formatDuration(flight.duration)}</div>
                        <div className="w-full h-px bg-gray-300 my-1 relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
                        </div>
                        <div className="text-xs text-gray-400">직항</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{flight.arriveTime}</div>
                        <div className="text-gray-500">{flight.arrival}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Button */}
            {selectedFlight && (
              <button
                onClick={handleBooking}
                disabled={bookingStep === 'booking'}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-blue-600 disabled:bg-gray-400 transition shadow-lg shadow-primary/25"
              >
                {bookingStep === 'booking' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    예매 중...
                  </span>
                ) : (
                  `${formatPrice(selectedFlight.price)}원 예매하기`
                )}
              </button>
            )}
          </>
        )}
      </main>

      {/* Settings Modal (발표자용) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">설정 (발표자용)</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              MovieSir Console에서 발급받은 API Key를 입력하세요.
              이 설정은 발표 시연용입니다.
            </p>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              placeholder="sk-moviesir-xxxx..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
            />
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>실제 서비스에서는 서버에서 안전하게 관리됩니다</span>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-blue-600 transition"
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
