import React, { useState, useEffect } from 'react';
import BASE_URL from './config';

// Función para generar IDs únicos simples
const generateId = () => `tx-${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;

// --- Helper Functions ---
const formatCurrency = (value, currency = 'USD') => {
    const numericValue = typeof value === 'number' ? value : 0;
    let options = { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 };
    if (Math.abs(numericValue) < 0.01 && numericValue !== 0) {
        options.maximumFractionDigits = 6;
    }
    return numericValue.toLocaleString('es-AR', options);
};
const formatNumber = (value) => {
    const numericValue = typeof value === 'number' ? value : 0;
    return numericValue.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 8 });
};

// Array de símbolos populares
const popularSymbols = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com, Inc." },
  { symbol: "TSLA", name: "Tesla, Inc." },
  { symbol: "META", name: "Meta Platforms, Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "BTC-USD", name: "Bitcoin USD" },
  { symbol: "ETH-USD", name: "Ethereum USD" },
  { symbol: "BNB-USD", name: "Binance Coin USD" },
  { symbol: "ADA-USD", name: "Cardano USD" },
  { symbol: "SOL-USD", name: "Solana USD" },
  { symbol: "XRP-USD", name: "XRP USD" },
  { symbol: "DOGE-USD", name: "Dogecoin USD" },
  { symbol: "YPF", name: "YPF S.A." },
  { symbol: "GGAL", name: "Grupo Financiero Galicia S.A." },
  { symbol: "BBAR", name: "Banco BBVA Argentina S.A." },
  { symbol: "PAM", name: "Pampa Energía S.A." },
  { symbol: "LOMA", name: "Loma Negra Compañía Industrial Argentina S.A." }
];

// --- Components ---

// Card Component
function Card({ children, className = "", title }) {
  return (
    <div className={`relative bg-gray-800 border border-gray-700 rounded-md shadow-lg p-4 md:p-5 ${className}`}>
      {title && <h2 className="text-lg font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">{title}</h2>}
      {children}
    </div>
  );
}

// Componente para mostrar los símbolos destacados
function TopSymbols() {
  const [symbolsData, setSymbolsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Lista de símbolos destacados
  const symbols = ['BTC-USD', 'ETH-USD', 'NVDA', 'TSLA', 'GOOGL', 'MSFT', 'AAPL', 'AMZN'];

  useEffect(() => {
    const fetchTopSymbols = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${BASE_URL}/api/prices?symbols=${symbols.join(',')}`);
        if (!response.ok) throw new Error('Error al obtener datos');

        const data = await response.json();
        setSymbolsData(data);
      } catch (err) {
        console.error('Error al obtener símbolos destacados:', err);
        setError('No se pudieron cargar los símbolos destacados');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTopSymbols();
    
    // Actualizar cada 2 minutos
    const intervalId = setInterval(fetchTopSymbols, 120000);
    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-md p-2 mb-6 text-center text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-md p-3 mb-6 overflow-x-auto">
      <h2 className="text-sm text-gray-400 uppercase mb-2 tracking-wider text-center">Símbolos destacados</h2>
      <div className="flex space-x-4 justify-center min-w-max px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-3 w-full">
            <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          symbols.map(symbol => {
            const data = symbolsData[symbol];
            if (!data) return null; // Importante: manejar el caso donde no hay datos
            
            const changePercent = data.change || 0;
            const changeColor = changePercent >= 0 ? 'text-green-400' : 'text-red-400';
            
            return (
              <div key={symbol} className="bg-gray-700 rounded-md px-3 py-2 text-center min-w-[100px]">
                <div className="text-gray-200 font-medium text-sm">{symbol}</div>
                <div className="text-gray-100 text-base font-semibold">{formatCurrency(data.price)}</div>
                <div className={`text-xs font-medium ${changeColor}`}>
                  {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Formulario de Transacción
function TransactionForm({ addTransaction, fetchPrice }) {
    const [formData, setFormData] = useState({
        ticker: '', 
        tipo: 'compra', 
        cantidad: '', // Ahora representa USD invertidos
        fecha: new Date().toISOString().split('T')[0],
        broker: '',
        observaciones: ''
    });

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Mostrar sugerencias solo para el campo ticker
        if (name === 'ticker') {
            const input = value.toUpperCase();
            if (input.length >= 1) {
                const filtered = popularSymbols.filter(
                    item => item.symbol.includes(input) || item.name.toUpperCase().includes(input)
                ).slice(0, 5); // Mostrar máximo 5 sugerencias
                setSuggestions(filtered);
                setShowSuggestions(filtered.length > 0);
            } else {
                setShowSuggestions(false);
            }
        }
    };
    
    const selectSuggestion = (symbol) => {
        setFormData(prev => ({ ...prev, ticker: symbol }));
        setShowSuggestions(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const cantidadNum = parseFloat(formData.cantidad.replace(',', '.'));
        
        if (!formData.ticker.trim() || isNaN(cantidadNum) || cantidadNum <= 0 || !formData.fecha) {
            alert('Por favor, completa todos los campos obligatorios correctamente.'); 
            return;
        }
        
        // Obtener el precio actual para calcular cuánto del activo estamos comprando
        fetchPrice(formData.ticker.toUpperCase().trim())
            .then(price => {
                if (price) {
                    addTransaction({ 
                        ...formData, 
                        ticker: formData.ticker.toUpperCase().trim(), 
                        cantidad: cantidadNum,
                        precioCompra: price // Guardamos el precio al que compramos
                    });
                    
                    // Reiniciar campos
                    setFormData(prev => ({ 
                        ...prev, 
                        ticker: '', 
                        cantidad: '',
                        observaciones: '' 
                    }));
                } else {
                    alert(`No se pudo obtener el precio para ${formData.ticker}. Inténtalo de nuevo.`);
                }
            })
            .catch(error => {
                alert(`Error: ${error.message}`);
            });
    };

    const inputBaseStyle = "w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500 text-sm";
    const labelBaseStyle = "block text-xs font-medium text-gray-400 mb-1";

    return (
        <Card className="mb-6" title="Nueva Transacción">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                <div className="relative">
                    <label htmlFor="ticker" className={labelBaseStyle}>Ticker / Símbolo <span className="text-red-400">*</span></label>
                    <input 
                        type="text" 
                        id="ticker" 
                        name="ticker" 
                        value={formData.ticker} 
                        onChange={handleChange}
                        onFocus={() => formData.ticker.length > 0 && setSuggestions(popularSymbols.filter(
                            item => item.symbol.includes(formData.ticker.toUpperCase()) || 
                            item.name.toUpperCase().includes(formData.ticker.toUpperCase())
                        ).slice(0, 5))}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className={`${inputBaseStyle} uppercase`} 
                        placeholder="Ej: AAPL, BTC" 
                        autoComplete="off"
                        required 
                    />
                    
                    {showSuggestions && (
                        <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-sm mt-1 max-h-60 overflow-y-auto">
                            {suggestions.map((item) => (
                                <li 
                                    key={item.symbol} 
                                    className="px-3 py-2 hover:bg-gray-600 cursor-pointer text-sm text-gray-200"
                                    onMouseDown={() => selectSuggestion(item.symbol)}
                                >
                                    <span className="font-medium">{item.symbol}</span> - <span className="text-gray-400">{item.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                <div>
                    <label htmlFor="tipo" className={labelBaseStyle}>Tipo <span className="text-red-400">*</span></label>
                    <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} className={inputBaseStyle} required>
                        <option value="compra">Compra</option>
                        <option value="venta">Venta</option>
                    </select>
                </div>
                
                <div>
                    <label htmlFor="cantidad" className={labelBaseStyle}>Cantidad (USD) <span className="text-red-400">*</span></label>
                    <input type="text" inputMode="decimal" id="cantidad" name="cantidad" value={formData.cantidad} onChange={handleChange} className={inputBaseStyle} placeholder="Ej: 150.00" required />
                </div>
                
                <div>
                    <label htmlFor="fecha" className={labelBaseStyle}>Fecha <span className="text-red-400">*</span></label>
                    <input type="date" id="fecha" name="fecha" value={formData.fecha} onChange={handleChange} className={inputBaseStyle} required />
                </div>
                
                <div>
                    <label htmlFor="broker" className={labelBaseStyle}>Broker</label>
                    <select id="broker" name="broker" value={formData.broker} onChange={handleChange} className={inputBaseStyle}>
                        <option value="">Seleccionar...</option>
                        <option value="Binance">Binance</option>
                        <option value="BullMarket">BullMarket</option>
                        <option value="Nexo">Nexo</option>
                        <option value="IOL">IOL</option>
                        <option value="Hapi">Hapi</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>
                
                <div className="sm:col-span-2">
                    <label htmlFor="observaciones" className={labelBaseStyle}>Observaciones</label>
                    <input type="text" id="observaciones" name="observaciones" value={formData.observaciones} onChange={handleChange} className={inputBaseStyle} placeholder="Comentarios opcionales" />
                </div>
                
                <div>
                    <button type="submit" className="w-full py-1.5 px-4 rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 text-sm bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white font-medium">
                        Agregar
                    </button>
                </div>
            </form>
        </Card>
    );
}

// Tabla de Historial de Transacciones *** MODIFICADA ***
function TransactionHistory({ transactions, deleteTransaction, fetchPrice, currentPrices, loadingPrices, updateTransaction }) {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return (
        <Card title="Historial de Transacciones">
             <div className="overflow-x-auto custom-scrollbar">
                 <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ticker</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo</th>
                            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Invertido (USD)</th>
                            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Precio Compra</th>
                            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Precio Actual</th>
                            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Cambio %</th>
                            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Valor Actual</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Broker</th>
                            <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {sortedTransactions.length === 0 ? (
                             <tr><td colSpan="10" className="text-center py-4 text-sm text-gray-500">No hay transacciones registradas.</td></tr>
                        ) : (
                            sortedTransactions.map(tx => {
                                const tipoClass = tx.tipo === 'compra' ? 'text-green-400' : 'text-red-400';
                                const tipoText = tx.tipo === 'compra' ? 'Compra' : 'Venta';
                                const currentPrice = currentPrices[tx.ticker];
                                const isLoading = loadingPrices[tx.ticker];
                                const precioCompra = tx.precioCompra || 0;
                                
                                // Calcular cambio porcentual y valor actual
                                let changePercentage = null;
                                let valorActual = tx.cantidad;
                                if (currentPrice && precioCompra > 0) {
                                    changePercentage = ((currentPrice - precioCompra) / precioCompra) * 100;
                                    valorActual = tx.cantidad * (1 + changePercentage / 100);
                                }

                                const handlePriceChange = (e) => {
                                    const newPrice = parseFloat(e.target.value);
                                    if (!isNaN(newPrice)) {
                                        updateTransaction(tx.id, { precioCompra: newPrice });
                                    }
                                };
                                
                                return (
                                    <tr key={tx.id} className="hover:bg-gray-700/50">
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{tx.fecha || 'N/A'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-100 uppercase">{tx.ticker}</td>
                                        <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${tipoClass}`}>{tipoText}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 text-right">{formatCurrency(tx.cantidad, 'USD')}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 text-right">
                                            <input
                                                type="number"
                                                value={precioCompra}
                                                onChange={handlePriceChange}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-sm text-gray-100 text-right px-2 py-1 text-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 text-right">
                                            {isLoading ? (
                                                <span className="flex justify-end items-center">
                                                    <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                </span>
                                            ) : (
                                                currentPrice !== undefined ? formatCurrency(currentPrice, 'USD') : '-'
                                            )}
                                        </td>
                                        {/* Columna de Cambio % */}
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                            {tx.tipo === 'compra' && changePercentage !== null ? (
                                                <div className={`flex items-center justify-end ${changePercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {changePercentage >= 0 ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    )}
                                                    <span>{Math.abs(changePercentage).toFixed(2)}%</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>
                                        {/* Columna de Valor Actual */}
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                            {tx.tipo === 'compra' && valorActual !== tx.cantidad ? (
                                                <span className={valorActual > tx.cantidad ? 'text-green-400' : 'text-red-400'}>
                                                    {formatCurrency(valorActual, 'USD')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">{formatCurrency(tx.cantidad, 'USD')}</span>
                                            )}
                                        </td>
                                        {/* Columna de Broker */}
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                                            {tx.broker || '-'}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-center space-x-2">
                                            <button 
                                                onClick={() => fetchPrice(tx.ticker)} 
                                                className="text-blue-400 hover:text-blue-300 p-1 inline-flex items-center" 
                                                title="Refrescar Precio"
                                                disabled={isLoading}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0015.357 2M15 15H9" />
                                                </svg>
                                            </button>
                                            <button onClick={() => deleteTransaction(tx.id)} className="text-red-500 hover:text-red-400 p-1 inline-flex items-center" title="Eliminar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
             </div>
        </Card>
    );
}

// Componente para mostrar resumen del portafolio
function PortfolioSummary({ transactions, currentPrices }) {
    const calculatePortfolio = () => {
        const holdings = {};
        let totalInvested = 0;
        let totalCurrent = 0;
        
        // Procesar las transacciones
        transactions.forEach(tx => {
            if (tx.tipo === 'compra') {
                const ticker = tx.ticker;
                const montoInvertido = tx.cantidad;
                const precioCompra = tx.precioCompra || 0;
                
                // Inicializar el ticker si no existe
                if (!holdings[ticker]) {
                    holdings[ticker] = { 
                        invertido: 0,
                        precioCompra: precioCompra,
                        valorActual: 0
                    };
                }
                
                // Actualizar montos
                holdings[ticker].invertido += montoInvertido;
                totalInvested += montoInvertido;
                
                // Calcular valor actual si tenemos precio actual
                const currentPrice = currentPrices[ticker];
                if (currentPrice && precioCompra > 0) {
                    const changePercent = (currentPrice - precioCompra) / precioCompra;
                    const valorActual = montoInvertido * (1 + changePercent);
                    holdings[ticker].valorActual += valorActual;
                    totalCurrent += valorActual;
                } else {
                    holdings[ticker].valorActual += montoInvertido;
                    totalCurrent += montoInvertido;
                }
            }
            // Para las ventas, simplemente restamos del total invertido y actual
            // (No implementado por simplicidad)
        });
        
        return { holdings, totalInvested, totalCurrent };
    };
    
    const { totalInvested, totalCurrent } = calculatePortfolio();
    
    // Calcular ganancia/pérdida total
    const totalProfit = totalCurrent - totalInvested;
    const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    const isProfit = totalProfit >= 0;
    
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-md p-3 mb-6">
            <h2 className="text-sm text-gray-400 uppercase mb-3 tracking-wider">Resumen del Portafolio</h2>
            
            <div className="flex flex-wrap justify-between items-center">
                <div className="mb-3 md:mb-0">
                    <div className="text-sm text-gray-400">Inversión Total:</div>
                    <div className="text-xl font-semibold text-gray-200">{formatCurrency(totalInvested, 'USD')}</div>
                </div>
                
                <div className="mb-3 md:mb-0">
                    <div className="text-sm text-gray-400">Valor Actual:</div>
                    <div className={`text-xl font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(totalCurrent, 'USD')}
                    </div>
                </div>
                
                <div className="mb-3 md:mb-0">
                    <div className="text-sm text-gray-400">Ganancia/Pérdida:</div>
                    <div className={`flex items-center text-xl font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfit ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                        {formatCurrency(Math.abs(totalProfit), 'USD')} 
                        <span className="ml-1 text-base">({Math.abs(totalProfitPercentage).toFixed(2)}%)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main App Component ---
function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('investmentTransactions');
    return saved ? JSON.parse(saved).map(t => ({...t, id: t.id || generateId()})) : [];
  });

  const [currentPrices, setCurrentPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState({});

  useEffect(() => {
    localStorage.setItem('investmentTransactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    const uniqueTickers = [...new Set(transactions.map(tx => tx.ticker))];
    uniqueTickers.forEach(ticker => {
      if (ticker && !currentPrices[ticker] && !loadingPrices[ticker]) {
        fetchPrice(ticker);
      }
    });
  }, [transactions]);

  // Nuevo efecto para refrescar precios automáticamente cada 30 minutos
  useEffect(() => {
    const intervalId = setInterval(() => {
        console.log("[Auto-Refresh] Refrescando precios...");
        const uniqueTickers = [...new Set(transactions.map(tx => tx.ticker))];
        uniqueTickers.forEach(ticker => {
            if (ticker) {
                fetchPrice(ticker);
            }
        });
    }, 30 * 60 * 1000); // 30 minutos en milisegundos

    return () => clearInterval(intervalId); // Limpiar el intervalo al desmontar el componente
  }, [transactions]);

  const fetchPrice = async (ticker) => {
    if (!ticker) return null;

    console.log(`[Frontend] Solicitando precio para ${ticker}...`);
    setLoadingPrices(prev => ({ ...prev, [ticker]: true }));

    try {
        const response = await fetch(`${BASE_URL}/api/price/${ticker}`);
        if (!response.ok) {
            let errorMsg = `Error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) { /* No hacer nada si no hay cuerpo JSON */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log(`[Frontend] Precio recibido para ${data.symbol}: ${data.price}`);

        const price = data.price;
        setCurrentPrices(prev => ({ ...prev, [data.symbol]: price }));
        setLoadingPrices(prev => ({ ...prev, [ticker]: false }));

        return price;
    } catch (error) {
        console.error(`[Frontend] Error al obtener precio para ${ticker}:`, error.message);
        setLoadingPrices(prev => ({ ...prev, [ticker]: false }));
        return null;
    }
  };

  const addTransaction = (newTransactionData) => {
    const newTx = { ...newTransactionData, id: generateId() };
    setTransactions(prev => [...prev, newTx]);

    if (!currentPrices[newTx.ticker] && !loadingPrices[newTx.ticker]) {
      fetchPrice(newTx.ticker);
    }
  };

  const deleteTransaction = (idToDelete) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      setTransactions(prev => prev.filter(tx => tx.id !== idToDelete));
    }
  };

  const updateTransaction = (id, updatedFields) => {
    setTransactions(prev =>
      prev.map(tx => (tx.id === id ? { ...tx, ...updatedFields } : tx))
    );
  };

  const handleResetData = () => {
    if (window.confirm("¿Estás seguro de que quieres borrar TODAS las transacciones? Esta acción no se puede deshacer.")) {
      setTransactions([]);
      setCurrentPrices({});
      setLoadingPrices({});
      localStorage.removeItem('investmentTransactions');
      alert("Datos reseteados.");
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-900 min-h-screen font-sans flex flex-col">
      <header className="flex justify-between items-center mb-6 px-4 md:px-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-100 uppercase tracking-wider flex-grow">
          SEGUIMIENTO DE INVERSIONES
        </h1>
        <button onClick={handleResetData}
          className="p-2 bg-red-800 text-red-200 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          title="Resetear Todos los Datos">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </header>

      <TopSymbols />
      <PortfolioSummary transactions={transactions} currentPrices={currentPrices} />

      <main className="flex-grow">
        <TransactionForm 
          addTransaction={addTransaction} 
          fetchPrice={fetchPrice}
        />
        <TransactionHistory
          transactions={transactions}
          deleteTransaction={deleteTransaction}
          fetchPrice={fetchPrice}
          currentPrices={currentPrices}
          loadingPrices={loadingPrices}
          updateTransaction={updateTransaction}
        />
      </main>

      <footer className="text-center text-xs text-gray-500 py-4 mt-8 border-t border-gray-700">
        Aplicación desarrollada por Pablo Martín Gatica. Gestión financiera con precisión.
      </footer>
    </div>
  );
}

export default App;
