
import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function Camara() {
  const videoRef = useRef(null)
  const scannerRef = useRef(null)
  const scannerControlsRef = useRef(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  useEffect(() => {
    return () => {
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop()
        scannerControlsRef.current = null
      }
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [])

  const stopCamera = () => {
    if (scannerControlsRef.current) {
      scannerControlsRef.current.stop()
      scannerControlsRef.current = null
    }

    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
  }

  const startCamera = async () => {
    try {
      setError('')

      const hasGetUserMedia =
        typeof navigator !== 'undefined' &&
        !!navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function'

      if (!hasGetUserMedia) {
        setError('Este navegador no soporta acceso a cámara (getUserMedia).')
        return
      }

      if (typeof window !== 'undefined' && window.isSecureContext === false) {
        setError('Para usar la cámara en el móvil abre la web por HTTPS (o localhost).')
        return
      }

      if (!videoRef.current) {
        setError('Video no disponible.')
        return
      }

      stopCamera()
      setCameraActive(true)

      if (!scannerRef.current) {
        scannerRef.current = new BrowserMultiFormatReader()
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
        },
        audio: false,
      }

      const controls = await scannerRef.current.decodeFromConstraints(constraints, videoRef.current, (res, err) => {
        if (res) {
          const text = typeof res.getText === 'function' ? res.getText() : String(res)
          setResult(text)
          console.log(setResult)
          stopCamera()
          return
        }

        if (!err) return
        if (err?.name === 'NotFoundException') return

        const message = err?.name ? `${err.name}: ${err.message ?? ''}` : String(err)
        setError(message)
      })

      scannerControlsRef.current = controls
    } catch (err) {
      const message = err?.name ? `${err.name}: ${err.message ?? ''}` : 'No se pudo acceder a la cámara'
      setError(message)
      setCameraActive(false)
    }
  }

  return (
    <div className="scanner">
      <div className="scannerCamera">
        <video ref={videoRef} className="scannerVideo" autoPlay playsInline muted />

        <div className="scannerGuide" aria-hidden="true">
          <div className="scannerGuideBox" />
          <div className="scannerGuideLine" />
        </div>

        {!cameraActive ? (
          <div className="scannerPlaceholder">
            <div className="scannerPlaceholderTitle">Cámara apagada</div>
            <div className="scannerPlaceholderText">Presiona “Activar cámara” para escanear.</div>
          </div>
        ) : null}
      </div>

      <div className="scannerPanel">
        <div className="scannerPanelHeader">
          <div className="scannerPanelTitle">Resultado</div>
          <div className="scannerPanelActions">
            {cameraActive ? (
              <button className="btn" onClick={stopCamera} type="button">
                Desactivar
              </button>
            ) : (
              <button className="btn" onClick={startCamera} type="button">
                Nuevo
              </button>
            )}
          </div>
        </div>

        <div className="scannerPanelBody">
          <div className="scannerValue">{result ? result : 'Sin lecturas aún'}</div>
          <div className="scannerValue">{result ? 'direccion: 5118 Naranjal 1' : ''}</div>
          <div className="scannerValue">{result ? 'Empresa: Autoland' : ''}</div>
        </div>
      </div>
    </div>
  )
}

