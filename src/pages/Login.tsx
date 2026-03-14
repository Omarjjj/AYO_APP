import { useNavigate } from 'react-router-dom'
import PixelBlast from '../components/PixelBlast'
import Header from '../components/Layout/Header'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="login-root">
      {/* Background */}
      <div className="login-bg">
        <PixelBlast
          variant="square"
          pixelSize={4}
          color="#B19EEF"
          patternScale={2}
          patternDensity={1}
          pixelSizeJitter={0}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid={false}
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.5}
          edgeFade={0.25}
          transparent
        />
      </div>

      {/* Window controls */}
      <div className="login-header-shell">
        <Header />
      </div>

      {/* Login Card */}
      <div className="container">
        <div className="login-box">
          <form className="form" onSubmit={handleSubmit}>
            <div className="logo">
              <video
                className="logo-video"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="/ayo_animatelogo.webm" type="video/webm" />
                <source src="/ayo_animatelogo.mp4" type="video/mp4" />
              </video>
            </div>

            <div className="header">Sign in to Ayo</div>

            <input
              className="input"
              type="email"
              placeholder="Email"
              autoComplete="email"
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
            />

            <button type="submit" className="button sign-in">
              Sign In
            </button>

            <div className="login-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="btn-google"
              onClick={() => navigate('/dashboard')}
            >
              <span className="btn-google-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                </svg>
              </span>
              <span>Google</span>
            </button>

            <div className="footer">
              <span>Forgot password? </span>
              <a href="#" className="link">
                Reset here
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

