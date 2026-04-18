
import React from 'react';

const FigurePlaceholder = ({ caption, id }: { caption: string; id: string }) => (
  <div className="my-8 flex flex-col items-center">
    <div className="w-full aspect-video max-w-4xl bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 group hover:border-blue-300 transition-colors cursor-help">
      <svg className="w-16 h-16 mb-4 opacity-20 group-hover:text-blue-400 group-hover:opacity-40 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className="text-sm font-medium">Місце для скріншоту: {id}</span>
      <span className="text-xs mt-1">1920x1080 (рекомендовано)</span>
    </div>
    <p className="mt-4 text-sm text-gray-500 italic text-center">
      {caption}
    </p>
  </div>
);

export default function Documentation() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 bg-white shadow-sm border border-gray-200 rounded-2xl min-h-screen">
      <article className="prose prose-blue max-w-none text-gray-800 leading-relaxed">
        <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-6 mb-8 text-center">
          Технічний опис реалізації модулів ІСПР
        </h1>

        <section className="mb-10">
          <p className="text-lg">
            Програмна реалізація модулів візуалізації ринкової інформації базується на поєднанні декларативного підходу бібліотеки 
            <strong> React</strong> та імперативного керування графікою за допомогою <strong>Chart.js</strong>. Основним компонентом системи є 
            <code> CandlestickChart</code>, який інтегрує спеціалізований контролер <code>CandlestickController</code> для коректного відображення фінансових свічок. 
            Архітектура компонента побудована на використанні референсів <code>useRef</code> для безпосередньої взаємодії з елементами Canvas, 
            що дозволяє уникнути надлишкового навантаження на дерево компонентів React при інтенсивному оновленні котирувань. Візуалізація котирувань 
            розділена на дві основні області: головний графік цін з накладеними технічними індикаторами та синхронізований за часовою віссю графік об’ємів торгів.
          </p>

          <FigurePlaceholder 
            id="MAIN_VIEW" 
            caption="Рисунок 1 — Загальний вигляд інтерфейсу візуалізації котирувань та об'ємів торгів" 
          />

          <p className="text-lg mt-6">
            Синхронізація масштабів та положення осей реалізована через спільний стан часового діапазону <code>xMin</code> та <code>xMax</code>, 
            що забезпечує цілісність відображення при панорамуванні або зміні масштабу користувачем за допомогою плагіна <code>zoomPlugin</code>.
          </p>
        </section>

        <section className="mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Математичне забезпечення та індикатори</h2>
          <p className="text-lg">
            Математичне забезпечення аналітичного модуля винесене у файл <code>indicators.ts</code>, де реалізовано алгоритми обчислення ковзних середніх, 
            осциляторів та смуг Боллінджера. Розрахунок простих (SMA) та експоненціальних (EMA) ковзних середніх виконується на основі масивів закриття свічок. 
            Оптимізація обчислень забезпечується через хук <code>useMemo</code>, який кешує результати розрахунків. Окрему увагу приділено системі розпізнавання 
            свічкових патернів, які візуалізуються у вигляді інтерактивних міток через кастомний плагін <code>patternsPlugin</code>.
          </p>

          <FigurePlaceholder 
            id="INDICATORS_OVERLAY" 
            caption="Рисунок 2 — Накладання технічних індикаторів та відображення свічкових патернів на графіку" 
          />
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Інтерактивні інструменти аналізу</h2>
          <p className="text-lg">
            Плагін <code>crosshairPlugin</code> забезпечує відображення динамічного перехрестя з текстовими мітками ціни та часу. 
            Модуль малювання <code>DrawingToolbar</code> дозволяє користувачеві наносити трендові лінії та прямокутні зони підтримки/опору. 
            Для актуалізації даних у реальному часі реалізовано WebSocket-з’єднання з API Binance.
          </p>

          <FigurePlaceholder 
            id="DRAWING_TOOLS" 
            caption="Рисунок 3 — Використання графічних інструментів для визначення рівнів підтримки та опору" 
          />
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Інтелектуальний аналіз та підтримка рішень</h2>
          <p className="text-lg">
            Комплексний технічний аналіз активу консолідовано в компоненті <code>TechnicalAnalysis</code>. Візуалізація настрою ринку реалізована через 
            метафору аналогових датчиків <code>Gauge</code>. Впроваджено інтеграцію з моделлю штучного інтелекту <strong>Google Gemini 2.5 Flash</strong>. 
            Система формує контекстний запит і отримує синтезований текстовий висновок українською мовою.
          </p>

          <FigurePlaceholder 
            id="AI_ANALYSIS" 
            caption="Рисунок 4 — Модуль технічного аналізу з інтегрованим ШІ-асистентом та датчиками настрою ринку" 
          />

          <p className="text-lg mt-6">
            Додаткові модулі, такі як <code>OrderBook</code> та <code>RiskCalculator</code>, забезпечують допоміжний контекст щодо ліквідності та управління капіталом.
          </p>

          <FigurePlaceholder 
            id="AUX_MODULES" 
            caption="Рисунок 5 — Калькулятор ризику та книга ордерів (Order Book) у реальному часі" 
          />
        </section>

        <footer className="mt-16 pt-8 border-t border-gray-100 text-center text-gray-400 text-sm">
          Система підтримки прийняття рішень на крипторинку © 2024
        </footer>
      </article>
    </div>
  );
}
