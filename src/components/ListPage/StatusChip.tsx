import type { CustomCellRendererProps } from 'ag-grid-react';

const statusMap: Record<string, string> = {
  complete: 'Completed',
  processing: 'In Progress',
  queued: 'Queued',
  failed: 'Failed',
};

interface StatusStyle {
  backgroundColor: string;
  borderColor: string;
  color: string;
}

/* TODO use tailwind for this eventually */
const statusStyles: Record<string, StatusStyle> = {
  complete: {
    backgroundColor: '#CEEEDD',
    borderColor: '#00A13A',
    color: '#7E8285',
  },
  processing: {
    backgroundColor: '#C9E8FB',
    borderColor: '#1790D0',
    color: '#7E8285',
  },
  queued: {
    backgroundColor: '#FFF2CC',
    borderColor: '#FFE699',
    color: '#7E8285',
  },
  failed: {
    backgroundColor: '#F4CCDB',
    borderColor: '#C9024A',
    color: '#7E8285',
  },
  default: {
    backgroundColor: '#BFC3C6',
    borderColor: '#7E8285',
    color: '#7E8285',
  },
};

export default function StatusChip(props: CustomCellRendererProps) {
  const statusKey: string = (props.value as string)
    .toLowerCase()
    .replace(/\s+/g, '');
  const statusValue: string = statusMap[statusKey] ?? 'INVALID';
  const style: StatusStyle | undefined =
    statusStyles[statusKey] ?? statusStyles.default;

  return (
    <div className={`flex flex-wrap gap-2 py-3`}>
      <div
        className={`text-xs m-1 flex min-w-[8rem] items-center justify-center rounded-full border px-2 py-1 font-medium`}
        style={style}
      >
        <div className='max-w-full flex-initial leading-none'>
          {statusValue}
        </div>
      </div>
    </div>
  );
}
