import BrandLogo from '../brand/BrandLogo.jsx';

// Header/footer logo link using the proposed brand system. The original
// company logo files remain in public/images/ untouched.
export default function Logo({ layout = 'horizontal', tone = 'color', height = 40, className = '' }) {
  return (
    <a className={`logo ${className}`} href="#top">
      <BrandLogo layout={layout} tone={tone} height={height} title="Busy Bee Lawn & Landscape — back to top" />
    </a>
  );
}
