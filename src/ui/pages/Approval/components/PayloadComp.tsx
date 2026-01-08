import { Column, Text, Row, Card } from '@/ui/components';
import type { HexString } from 'kaspa-wasm';

export default function PayloadComp({ payload }: { payload: Uint8Array | HexString | undefined }) {
  if (payload === undefined || payload.length == 0) return null;
  return (
    <Column gap="sm">
      <Text text={'Payload:'} preset="default" color="textDim" selectText />
      <Row justifyCenter fullX mt={'zero'} mb="sm">
        <Card fullX>
          <div
            style={{
              userSelect: 'text',
              maxHeight: 384,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              flexWrap: 'wrap',
              fontSize: '1rem'
            }}
          >
            {payload}
          </div>
        </Card>
      </Row>
    </Column>
  );
}
