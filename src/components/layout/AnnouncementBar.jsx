// Luxury bronze-metal announcement bar — polished, premium, gender-neutral.
const MESSAGE = '🚚 Pay the delivery charge to confirm your order • Fast Delivery All Over Nepal';

const BRONZE = {
  background:
    'linear-gradient(90deg, #1A0F09 0%, #3B2418 20%, #6E4A32 50%, #3B2418 80%, #1A0F09 100%)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px rgba(255,255,255,0.08)',
  borderTop: '1px solid rgba(201,160,99,0.55)',
  borderBottom: '1px solid rgba(201,160,99,0.55)',
};

const TEXT = { color: '#F5E7D0', fontWeight: 500, letterSpacing: '2px' };
const textClass = 'uppercase whitespace-nowrap text-[10px] sm:text-[11px] md:text-xs';

export default function AnnouncementBar() {
  return (
    <div className="relative overflow-hidden h-10 md:h-11" style={BRONZE}>
      {/* Glossy shine across the center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0) 32%, rgba(245,231,208,0.10) 47%, rgba(255,255,255,0.18) 50%, rgba(245,231,208,0.10) 53%, rgba(255,255,255,0) 68%)',
        }}
      />
      {/* Soft top inner highlight — subtle metallic reflection */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.07), transparent)' }}
      />
      {/* Gentle bottom shadow for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.18), transparent)' }}
      />

      {/* Desktop / tablet — static centered */}
      <div className="relative z-10 hidden sm:flex items-center justify-center h-full px-4">
        <span className={textClass} style={TEXT}>{MESSAGE}</span>
      </div>

      {/* Mobile — smooth marquee so the full message never clips */}
      <div className="relative z-10 flex sm:hidden items-center h-full">
        <div className="flex w-max animate-marquee" style={{ animationDuration: '16s' }}>
          <span className={`${textClass} px-6`} style={TEXT}>{MESSAGE}</span>
          <span className={`${textClass} px-6`} style={TEXT} aria-hidden>{MESSAGE}</span>
        </div>
      </div>
    </div>
  );
}
