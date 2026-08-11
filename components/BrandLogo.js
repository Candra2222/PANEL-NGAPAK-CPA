"use client";

import {
  FaAndroid,
  FaApple,
  FaWindows,
  FaLinux,
  FaChrome,
  FaSafari,
  FaEdge,
  FaFirefoxBrowser,
  FaOpera,
  FaFacebook,
  FaInstagram,
  FaWhatsapp,
  FaTelegram,
  FaYoutube,
  FaLine,
  FaXTwitter,
  FaTiktok,
} from "react-icons/fa6";
import { SiThreads, SiMessenger } from "react-icons/si";
import { hasFlag } from "country-flag-icons";
import * as Flags from "country-flag-icons/react/3x2";

const DEVICE_ICONS = {
  Android: { Icon: FaAndroid, color: "#3ddc84" },
  iPhone: { Icon: FaApple, color: "#ffffff" },
  iPad: { Icon: FaApple, color: "#ffffff" },
  iOS: { Icon: FaApple, color: "#ffffff" },
  macOS: { Icon: FaApple, color: "#ffffff" },
  Windows: { Icon: FaWindows, color: "#00adef" },
  Linux: { Icon: FaLinux, color: "#fcc624" },
  "Desktop Windows": { Icon: FaWindows, color: "#00adef" },
  "Desktop Linux": { Icon: FaLinux, color: "#fcc624" },
};

const APP_ICONS = {
  Facebook: { Icon: FaFacebook, color: "#1877f2" },
  Instagram: { Icon: FaInstagram, color: "#e4405f" },
  Threads: { Icon: SiThreads, color: "#ffffff" },
  X: { Icon: FaXTwitter, color: "#ffffff" },
  TikTok: { Icon: FaTiktok, color: "#ffffff" },
  WhatsApp: { Icon: FaWhatsapp, color: "#25d366" },
  Telegram: { Icon: FaTelegram, color: "#229ed9" },
  YouTube: { Icon: FaYoutube, color: "#ff0000" },
  Messenger: { Icon: SiMessenger, color: "#00b2ff" },
  LINE: { Icon: FaLine, color: "#06c755" },
};

const BROWSER_ICONS = {
  Chrome: { Icon: FaChrome, color: "#ea4335" },
  Safari: { Icon: FaSafari, color: "#00b2ff" },
  Edge: { Icon: FaEdge, color: "#0078d4" },
  Firefox: { Icon: FaFirefoxBrowser, color: "#ff7139" },
  Opera: { Icon: FaOpera, color: "#ff1b2d" },
  "Samsung Internet": { Icon: FaChrome, color: "#1428a0" },
};

export function DeviceLogo({ device, size = 16 }) {
  const meta = DEVICE_ICONS[device] || { Icon: FaAndroid, color: "#3ddc84" };
  const Icon = meta.Icon;
  return <Icon size={size} color={meta.color} title={device} />;
}

export function AppLogo({ app, size = 16 }) {
  const meta = APP_ICONS[app] || { Icon: FaInstagram, color: "#e4405f" };
  const Icon = meta.Icon;
  return <Icon size={size} color={meta.color} title={app} />;
}

export function BrowserLogo({ browser, size = 16 }) {
  const meta = BROWSER_ICONS[browser] || { Icon: FaChrome, color: "#ea4335" };
  const Icon = meta.Icon;
  return <Icon size={size} color={meta.color} title={browser} />;
}

export function flagEmoji(country) {
  const code = (country || "").toUpperCase();
  if (code.length !== 2) return "🏳️";
  return String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0)));
}

export function CountryFlag({ country, size = 18 }) {
  const code = (country || "").toUpperCase();
  const Flag = hasFlag(code) ? Flags[code] : null;
  if (!Flag) return null;
  return <Flag width={size} height={Math.round(size * 0.75)} title={country} aria-label={country} />;
}
