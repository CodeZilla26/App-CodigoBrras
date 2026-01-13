
import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function Camara() {
  const videoRef = useRef(null)
  const scannerRef = useRef(null)
  const scannerControlsRef = useRef(null)
  const apiAbortRef = useRef(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState('')
  const [placa, setPlaca] = useState('')
  const [direccion, setDireccion] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    return () => {
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop()
        scannerControlsRef.current = null
      }
      if (videoRef.current) videoRef.current.srcObject = null

      if (apiAbortRef.current) {
        apiAbortRef.current.abort()
        apiAbortRef.current = null
      }
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

  const clearResults = () => {
    setError('')
    setApiError('')
    setPlaca('')
    setDireccion('')
    setEmpresa('')
    setLoading(false)

    if (apiAbortRef.current) {
      apiAbortRef.current.abort()
      apiAbortRef.current = null
    }
  }

  const fetchDatosPorPlaca = async (placaValue) => {
    const endpoint =
      import.meta.env.VITE_API_ENDPOINT ?? 
      (import.meta.env.DEV
        ? 'https://autohub.madrisqui.com/servicios/tramite/placa/recojo'
        : undefined)

    if (!endpoint) {
      setApiError('Falta configurar VITE_API_ENDPOINT (URL del endpoint)')
      return
    }

    if (apiAbortRef.current) {
      apiAbortRef.current.abort()
    }

    const controller = new AbortController()
    apiAbortRef.current = controller

    setLoading(true)
    setApiError('')

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placa: placaValue }),
        signal: controller.signal,
      })

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`)
      }

      const json = await resp.json()
      setDireccion(json?.data?.direccion ?? '')
      setEmpresa(json?.data?.empresa ?? '')
    
    } catch (e) {
      if (e?.name === 'AbortError') return
      const msg = e?.message ? String(e.message) : 'Error consultando API'
      setApiError(msg)
    } finally {
      setLoading(false)
      apiAbortRef.current = null
    }
  }

  const onNuevo = async () => {
    stopCamera()
    clearResults()
    await startCamera()
  }

  const startCamera = async () => {
    try {
      setError('')
      setApiError('')

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
          setPlaca(text)
          stopCamera()
          fetchDatosPorPlaca(text)
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
              <button className="btn" onClick={onNuevo} type="button">
                Nuevo
              </button>
            )}
          </div>
        </div>

        <div className="scannerPanelBody">
          <div className="scannerValue">{placa ? placa : 'Sin lecturas aún'}</div>
          {loading ? <div className="scannerValue">Consultando...</div> : null}
          {direccion ? <div className="scannerValue">Dirección: {direccion}</div> : null}
          {empresa ? <div className="scannerValue">Empresa: {empresa}</div> : null}
          {apiError ? <div className="error">{apiError}</div> : null}
        </div>
      </div>
    </div>
  )
}

