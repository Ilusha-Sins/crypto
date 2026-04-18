import React, { useState, useEffect } from "react";

interface RiskCalculatorProps {
  currentPrice: number;
}

export default function RiskCalculator({ currentPrice }: RiskCalculatorProps) {
  const [balance, setBalance] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [entryPrice, setEntryPrice] = useState(currentPrice);
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [isLong, setIsLong] = useState(true);

  // Update calculator when coin changes (currentPrice resets to 0 during load)
  useEffect(() => {
    // If loading new symbol (price 0), reset entry to allow re-initialization
    if (currentPrice === 0) {
        if (entryPrice !== 0) setEntryPrice(0);
        return;
    }

    // Initialize values if entryPrice is 0 (first load or after reset)
    if (currentPrice > 0 && entryPrice === 0) {
        setEntryPrice(currentPrice);
        if (isLong) {
            setStopLoss(currentPrice * 0.98);
            setTakeProfit(currentPrice * 1.04);
        } else {
            setStopLoss(currentPrice * 1.02);
            setTakeProfit(currentPrice * 0.96);
        }
    }
  }, [currentPrice, entryPrice, isLong]);

  const handleDirectionChange = (newIsLong: boolean) => {
    setIsLong(newIsLong);
    if (entryPrice > 0) {
        if (newIsLong) {
            setStopLoss(entryPrice * 0.98);
            setTakeProfit(entryPrice * 1.04);
        } else {
            setStopLoss(entryPrice * 1.02);
            setTakeProfit(entryPrice * 0.96);
        }
    }
  };

  const calculate = () => {
    const riskAmount = (balance * riskPercent) / 100;
    
    let priceDiff = 0;
    let rewardDiff = 0;

    if (isLong) {
        priceDiff = entryPrice - stopLoss;
        rewardDiff = takeProfit - entryPrice;
    } else {
        priceDiff = stopLoss - entryPrice;
        rewardDiff = entryPrice - takeProfit;
    }

    // Safety check for invalid calculation inputs
    if (priceDiff <= 0 || entryPrice <= 0) {
        return { riskAmount, positionSize: 0, positionUsd: 0, rrRatio: 0, profit: 0 };
    }

    const positionSize = riskAmount / priceDiff;
    const positionUsd = positionSize * entryPrice;
    const profit = positionSize * rewardDiff;
    const rrRatio = priceDiff === 0 ? 0 : rewardDiff / priceDiff;

    return {
        riskAmount,
        positionSize: isFinite(positionSize) ? positionSize : 0,
        positionUsd: isFinite(positionUsd) ? positionUsd : 0,
        profit: isFinite(profit) ? profit : 0,
        rrRatio: isFinite(rrRatio) ? rrRatio : 0
    };
  };

  const results = calculate();

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 36v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Калькулятор позиції
      </h3>

      {/* Direction Toggle */}
      <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
          <button 
            onClick={() => handleDirectionChange(true)}
            className={`flex-1 py-1.5 text-sm font-semibold rounded transition-all ${isLong ? 'bg-green-500 text-white shadow' : 'text-gray-500'}`}
          >
            Long (Купівля)
          </button>
          <button 
            onClick={() => handleDirectionChange(false)}
            className={`flex-1 py-1.5 text-sm font-semibold rounded transition-all ${!isLong ? 'bg-red-500 text-white shadow' : 'text-gray-500'}`}
          >
            Short (Продаж)
          </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
              <label className="block text-xs text-gray-500 mb-1">Депозит ($)</label>
              <input type="number" value={balance} onChange={e => setBalance(Number(e.target.value))} className="w-full p-2 border rounded text-sm" />
          </div>
          <div>
              <label className="block text-xs text-gray-500 mb-1">Ризик (%)</label>
              <input type="number" value={riskPercent} onChange={e => setRiskPercent(Number(e.target.value))} className="w-full p-2 border rounded text-sm" />
          </div>
          <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Ціна входу</label>
              <input type="number" value={entryPrice} onChange={e => setEntryPrice(Number(e.target.value))} className="w-full p-2 border rounded text-sm font-bold" />
          </div>
          <div>
              <label className="block text-xs text-gray-500 mb-1">Stop Loss</label>
              <input type="number" value={stopLoss} onChange={e => setStopLoss(Number(e.target.value))} className={`w-full p-2 border rounded text-sm border-red-200 bg-red-50`} />
          </div>
          <div>
              <label className="block text-xs text-gray-500 mb-1">Take Profit</label>
              <input type="number" value={takeProfit} onChange={e => setTakeProfit(Number(e.target.value))} className={`w-full p-2 border rounded text-sm border-green-200 bg-green-50`} />
          </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100 flex-1 flex flex-col justify-center">
          <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ризик ($):</span>
              <span className="font-semibold text-red-600">-${results.riskAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
              <span className="text-gray-500">Потенційний прибуток:</span>
              <span className="font-semibold text-green-600">+${results.profit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-1">
              <span className="text-gray-500">R:R Ratio:</span>
              <span className={`font-bold ${results.rrRatio >= 2 ? 'text-green-600' : results.rrRatio >= 1 ? 'text-yellow-600' : 'text-red-500'}`}>
                  1 : {results.rrRatio.toFixed(2)}
              </span>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-200">
             <div className="text-xs text-gray-400 mb-1">Рекомендований розмір позиції:</div>
             <div className="text-lg font-bold text-blue-700">
                 {results.positionSize.toFixed(4)} монет
             </div>
             <div className="text-xs text-gray-500">
                 (~${results.positionUsd.toFixed(2)})
             </div>
          </div>
      </div>
    </div>
  );
}
