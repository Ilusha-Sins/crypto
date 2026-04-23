import OrderBook from './OrderBook';
import { panelStyle } from '../styles/ui';

type Props = {
  selectedSymbol: string;
};

export default function OrderBookPanel({ selectedSymbol }: Props) {
  return (
    <div
      style={{
        ...panelStyle,
        overflow: 'hidden',
        minHeight: 420,
      }}
    >
      <OrderBook symbol={selectedSymbol} />
    </div>
  );
}