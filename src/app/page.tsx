import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-mono-dark">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Portal de Clientes
            <span className="text-mono-purple"> Mono</span>
          </h1>
          <p className="text-xl text-gray-300">
            Gestiona tus servicios financieros de forma segura
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Link 
            href="/admin/clients"
            className="group relative overflow-hidden rounded-2xl bg-mono-gray p-8 transition-all hover:shadow-lg hover:shadow-mono-purple/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-mono-purple to-mono-pink opacity-0 transition-opacity group-hover:opacity-10"/>
            <h2 className="text-xl font-semibold text-white mb-3">Portal de Empleados</h2>
            <p className="text-gray-300 text-sm">
              Administra clientes y gestiona servicios financieros
            </p>
          </Link>

          <Link 
            href="/login"
            className="group relative overflow-hidden rounded-2xl bg-mono-gray p-8 transition-all hover:shadow-lg hover:shadow-mono-purple/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-mono-purple to-mono-pink opacity-0 transition-opacity group-hover:opacity-10"/>
            <h2 className="text-xl font-semibold text-white mb-3">Iniciar Sesión</h2>
            <p className="text-gray-300 text-sm">
              Accede a tu cuenta y gestiona tus servicios
            </p>
          </Link>

          <Link 
            href="/register"
            className="group relative overflow-hidden rounded-2xl bg-mono-purple p-8 transition-all hover:shadow-lg hover:shadow-mono-purple/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-mono-purple to-mono-pink opacity-0 transition-opacity group-hover:opacity-10"/>
            <h2 className="text-xl font-semibold text-white mb-3">Registro</h2>
            <p className="text-gray-300 text-sm">
              Crea tu cuenta y comienza a operar
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
