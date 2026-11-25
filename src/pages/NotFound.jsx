import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="not-found">
      <div className="container">
        <Search size={45} />
        <span className="eyebrow">Error 404</span>
        <h1>No hemos encontrado esta página</h1>
        <p>Es posible que la dirección haya cambiado o que el contenido ya no esté disponible.</p>
        <Link to="/" className="button"><ArrowLeft size={17} />Volver al inicio</Link>
      </div>
    </section>
  );
}
