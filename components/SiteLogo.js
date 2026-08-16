export const SITE_LOGO_URL =
  "https://nnrjaxykyjxkuggbogri.supabase.co/storage/v1/object/public/LOGO/logo.png";

export default function SiteLogo({ size = 64, className = "", alt = "Logo" }) {
  return (
    <img
      src={SITE_LOGO_URL}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={className}
      style={{ objectFit: "contain", mixBlendMode: "screen" }}
    />
  );
}
