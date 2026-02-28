import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import { usePlayer } from '../contexts/PlayerContext'
import { useDrive } from '../contexts/DriveContext'
import './PdfViewer.css'

// Fix for React-PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function PdfViewer() {
    const { currentPdfItem, closePdfViewer } = usePlayer()
    const { token } = useDrive()
    const [numPages, setNumPages] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [scale, setScale] = useState(1.0)

    useEffect(() => {
        if (currentPdfItem) {
            setPageNumber(1)
            setScale(1.0)

            // Lock body scroll when opened
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [currentPdfItem])

    if (!currentPdfItem) return null

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages)
    }

    const prevPage = () => setPageNumber(prev => Math.max(prev - 1, 1))
    const nextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1))
    const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 3.0))
    const zoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5))

    const fileOptions = currentPdfItem.driveId && token
        ? {
            url: `https://www.googleapis.com/drive/v3/files/${currentPdfItem.driveId}?alt=media`,
            httpHeaders: { Authorization: `Bearer ${token}` }
        }
        : currentPdfItem.src

    return (
        <div className="pdf-viewer animate-slideUp">
            <header className="pdf-viewer__header">
                <button onClick={closePdfViewer} className="pdf-viewer__close">
                    <X size={24} />
                </button>
                <div className="pdf-viewer__title">
                    <h4>{currentPdfItem.title}</h4>
                    <span>Página {pageNumber} / {numPages || '?'}</span>
                </div>
                <div className="pdf-viewer__controls">
                    <button onClick={zoomOut}><ZoomOut size={20} /></button>
                    <button onClick={zoomIn}><ZoomIn size={20} /></button>
                </div>
            </header>

            <div className="pdf-viewer__content">
                <Document
                    file={fileOptions}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="pdf-viewer__loading">Carregando livro...</div>}
                    error={
                        <div className="pdf-viewer__error">
                            <h3>Não foi possível carregar o livro nativamente</h3>
                            <p>Pode ser um ePub ou a conexão falhou.</p>
                            <button onClick={() => window.open(currentPdfItem.webViewLink, '_blank')}>
                                Abrir no Google Drive ↗
                            </button>
                        </div>
                    }
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="pdf-viewer__page"
                    />
                </Document>
            </div>

            <footer className="pdf-viewer__footer">
                <button onClick={prevPage} disabled={pageNumber <= 1} className="pdf-viewer__nav-btn">
                    <ChevronLeft size={24} />
                    Anterior
                </button>
                <button onClick={nextPage} disabled={pageNumber >= numPages} className="pdf-viewer__nav-btn">
                    Próxima
                    <ChevronRight size={24} />
                </button>
            </footer>
        </div>
    )
}
