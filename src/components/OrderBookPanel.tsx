import OrderBook from './OrderBook';

type Props = {
  selectedSymbol: string;
};

export default function OrderBookPanel({ selectedSymbol }: Props) {
  return (
    <div
      style={{
        border: '1px solid #2a2a2a',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#111',
        minHeight: 420,
      }}
    >
      <OrderBook symbol={selectedSymbol} />
    </div>
  );
}