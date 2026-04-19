'use client'

// Componente cliente que muestra un gráfico de barras CSS para los ingresos mensuales.
// Se usa CSS puro (divs con altura proporcional) ya que recharts no está instalado.

interface RevenueChartProps {
  data: { month: string; revenue: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Si todos los meses tienen ingreso cero, mostramos estado vacío
  const allZero = data.every((d) => d.revenue === 0)

  if (allZero) {
    return (
      <div className="flex h-48 items-center justify-center text-neutral-400 text-sm">
        No revenue data yet
      </div>
    )
  }

  // Valor máximo para calcular las alturas relativas de cada barra
  const maxRevenue = Math.max(...data.map((d) => d.revenue))

  return (
    <div className="w-full" aria-label="Monthly revenue bar chart">
      {/* Área del gráfico con las barras */}
      <div className="flex items-end gap-2 h-48 px-2">
        {data.map((item) => {
          // Altura proporcional al máximo (mínimo 4px para visibilidad)
          const heightPct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
          const heightStyle = `${Math.max(heightPct, item.revenue > 0 ? 4 : 0)}%`

          return (
            <div
              key={item.month}
              className="flex flex-1 flex-col items-center gap-1"
            >
              {/* Etiqueta del valor sobre la barra */}
              {item.revenue > 0 && (
                <span className="text-xs font-medium text-neutral-600">
                  ${item.revenue.toLocaleString()}
                </span>
              )}

              {/* Barra con altura proporcional */}
              <div className="w-full flex items-end" style={{ height: '100%' }}>
                <div
                  className="w-full rounded-t-md bg-blue-600 transition-all duration-300"
                  style={{ height: heightStyle }}
                  title={`${item.month}: $${item.revenue.toLocaleString()}`}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Etiquetas de los meses debajo del gráfico */}
      <div className="flex gap-2 px-2 mt-2">
        {data.map((item) => (
          <div key={item.month} className="flex-1 text-center">
            <span className="text-xs text-neutral-500">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
