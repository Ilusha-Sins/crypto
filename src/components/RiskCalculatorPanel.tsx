import RiskCalculator from './RiskCalculator';

type Props = {
  currentPrice: number;
};

export default function RiskCalculatorPanel({ currentPrice }: Props) {
  return (
    <div
      style={{
        border: '1px solid #2a2a2a',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#111',
      }}
    >
      <RiskCalculator currentPrice={currentPrice} />
    </div>
  );
}