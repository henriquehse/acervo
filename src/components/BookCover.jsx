import { getInitials } from '../utils/helpers'
import './BookCover.css'

export default function BookCover({ item, size = 'md', className = '', onClick }) {
    const initials = getInitials(item.title)
    const sizeClass = `book-cover--${size}`

    return (
        <div
            className={`book-cover ${sizeClass} ${className}`}
            style={{ background: item.coverGradient }}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {item.thumbnail ? (
                <>
                    <img src={item.thumbnail} alt={item.title} className="book-cover__image" loading="lazy" />
                    <div className="book-cover__shine" style={{ zIndex: 3 }} />
                </>
            ) : (
                <div className="book-cover__inner">
                    <div className="book-cover__shine" />
                    <div className="book-cover__content">
                        <span className="book-cover__type-badge">
                            {item.type === 'audiobook' ? '🎧' : '📖'}
                        </span>
                        <div className="book-cover__text">
                            <h3 className="book-cover__title">{item.title}</h3>
                            <p className="book-cover__author">{item.author}</p>
                        </div>
                        <span className="book-cover__initials">{initials}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
