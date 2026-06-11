

const COLORS = {
  close: '#7A3020', // var(--red)
  min:   '#C8882A', // var(--copper2)
  max:   '#4A7C6F', // var(--jade)
};

export function WindowButton({
  variant, onClick
}: {
  variant: 'close' | 'min' | 'max'
  onClick: () => void
}) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        width: 10, height: 10, borderRadius: '50%',
        background: COLORS[variant],
        cursor: 'pointer', flexShrink: 0,
        transition: 'filter .1s, transform 0.1s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.filter = 'brightness(1.5)';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.filter = '';
        e.currentTarget.style.transform = '';
      }}
    />
  );
}
